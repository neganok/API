# Use the official Ubuntu minimal base image
FROM ubuntu:20.04

# Set environment variables to avoid interactive prompts during installation
ENV DEBIAN_FRONTEND=noninteractive

# Update and install minimal required packages
RUN apt update -y && apt install -y --no-install-recommends \
    bash curl \
    && apt clean \
    && rm -rf /var/lib/apt/lists/*

# Set the default shell to bash
CMD ["/bin/bash"]
