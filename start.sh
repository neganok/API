#!/bin/sh

# Cài nodejs + npm nếu chưa có
apk add --no-cache nodejs npm curl

# Cài các thư viện cần thiết
npm install express node-telegram-bot-api localtunnel

npm install -g localtunnel

# Chạy bot với MASTER_URL
MASTER_URL=https://witty-nails-retire.loca.lt node bot.js




