#!/bin/bash

# Cài nodejs + npm nếu chưa có
apk add --no-cache nodejs npm curl bash

# Cài các thư viện cần thiết
npm install express node-telegram-bot-api localtunnel

# Chạy bot với MASTER_URL
MASTER_URL=https://plain-bats-end.loca.lt node bot.js




