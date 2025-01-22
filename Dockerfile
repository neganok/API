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
    && npm install -g colors set-cookie-parser request hpack axios chalk chalk@2 \
    && pip3 install requests python-telegram-bot pytz termcolor psutil \
    && apt clean \
    && rm -rf /var/lib/apt/lists/*

# Copy toàn bộ nội dung từ repository vào container
COPY . .

# Cài đặt dependencies
RUN npm install

# Expose port 9999
EXPOSE 9999

# Set the default command to run the API script
CMD ["node", "api.js"]
