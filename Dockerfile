# Use the base Alpine Linux image
FROM alpine:latest

# Set environment variables
ENV NODE_VERSION=20.x

# Install dependencies and required packages
RUN apk update && apk add --no-cache bash curl \
    && apk add --no-cache --virtual .build-deps build-base python3 python3-dev py3-pip \
    && apk add --no-cache zip git tmux htop speedtest-cli screen \
    && curl -sL https://deb.nodesource.com/setup_${NODE_VERSION} | bash - \
    && apk add --no-cache nodejs \
    && npm install -g npm \
    && apk del .build-deps \
    && rm -rf /var/cache/apk/*

# Set the default shell to bash
CMD ["/bin/bash"]
