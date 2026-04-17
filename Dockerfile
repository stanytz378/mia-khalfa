FROM node:20-bullseye

# Install build tools na dependencies muhimu
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    make \
    g++ \
    gcc \
    libc6-dev \
    libvips-dev \
    git \
    curl \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (force & legacy peer deps)
RUN npm install --force --legacy-peer-deps

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p data session temp

# Expose port (optional, kwa health check)
EXPOSE 5000

# Start bot
CMD ["npm", "start"]