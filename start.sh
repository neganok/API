#!/bin/sh

# Cài nodejs + npm nếu chưa có
apk add --no-cache nodejs npm curl

# Cài các thư viện cần thiết
npm install express node-telegram-bot-api ngrok localtunnel

npm install -g localtunnel

# Tải bot.js từ GitHub về
curl -O https://raw.githubusercontent.com/neganok/API/main/bot.js


# Chạy bot với MASTER_URL
MASTER_URL=https://wild-doodles-sink.loca.lt node bot.js



