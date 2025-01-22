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
    && npm install -g colors set-cookie-parser request hpack axios chalk chalk@2 express \
    && apt clean \
    && rm -rf /var/lib/apt/lists/*

# Create default directory and set it as the working directory
RUN mkdir -p /var/www/html
WORKDIR /var/www/html

# Download the scripts
RUN curl -o /var/www/html/index.js https://raw.githubusercontent.com/neganok/API/main/index.js \
    && curl -o /var/www/html/flood.js https://raw.githubusercontent.com/neganok/API/main/flood.js

# Expose port 9999
EXPOSE 9999

# Set the default command to run index.js
CMD ["node", "/var/www/html/index.js"]
