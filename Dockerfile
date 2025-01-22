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
    && apt clean \
    && rm -rf /var/lib/apt/lists/*

# Create default directory and set it as the working directory
WORKDIR /var/www/html

# Copy package.json để cài đặt dependencies
COPY package.json /var/www/html/

# Cài đặt dependencies
RUN npm install

# Copy toàn bộ mã nguồn vào container
COPY . /var/www/html/

# Expose port 9999
EXPOSE 9999

# Chạy ứng dụng
CMD ["node", "api.js"]
