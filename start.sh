#!/bin/sh

# Cài nodejs + npm nếu chưa có
apk add --no-cache nodejs npm curl

# Cài các thư viện cần thiết
npm install express node-telegram-bot-api ngrok

# Tải bot.js từ GitHub về
curl -fsSL https://raw.githubusercontent.com/neganok/API/refs/heads/main/bot.js -o bot.js

# Chạy bot với MASTER_URL
MASTER_URL=https://4ed9-23-97-62-134.ngrok-free.app node bot.js
