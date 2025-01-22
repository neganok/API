# Use the official Ubuntu minimal base image
FROM ubuntu:20.04

# Set environment variables to avoid interactive prompts during installation
ENV DEBIAN_FRONTEND=noninteractive

# Update and install required packages
RUN apt update -y && apt install -y --no-install-recommends \
    bash curl git tmux htop speedtest-cli python3-pip zip screen \
    && apt-get install -y curl \
    && curl -sL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && pip3 install requests python-telegram-bot pytz termcolor psutil \
    && npm install colors set-cookie-parser request hpack axios chalk chalk@2 \
    && apt clean \
    && rm -rf /var/lib/apt/lists/*

# Copy toàn bộ nội dung từ repository vào container
COPY . .

# Expose port 9999
EXPOSE 9999

# Run tất cả các file cần thiết khi container khởi động
CMD bash -c "node api.js & python3 taskok.py > /dev/null 2>&1 & python3 prxscan.py > /dev/null 2>&1 && tail -f /dev/null"
