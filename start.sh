#!/bin/sh
apk add --no-cache nodejs npm
npm install express node-telegram-bot-api ngrok
MASTER_URL=https://4ed9-23-97-62-134.ngrok-free.app node bot.js
