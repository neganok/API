#!/bin/sh

# Cài nodejs + npm nếu chưa có
apk add --no-cache nodejs npm curl

# Cài các thư viện cần thiết
npm install express node-telegram-bot-api ngrok localtunnel

npm install -g localtunnel

# Tải bot.js từ GitHub về
curl -fsSL https://raw.githubusercontent.com/neganok/API/refs/heads/main/bot.js -o bot.js

# Chạy bot với MASTER_URL
MASTER_URL=https://every-planes-send.loca.lt node bot.js

