# Miss Aria — Dockerfile

FROM node:20-bullseye-slim

# System dependencies for:
# - canvas
# - better-sqlite3
# - puppeteer's Chromium
# - sharp fallback builds
# - GitHub-based npm dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    python3 \
    make \
    g++ \
    pkg-config \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    libvips-dev \
    ca-certificates \
    fonts-liberation \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libgtk-3-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package.json package-lock.json* ./

# Install production dependencies
RUN npm install --omit=dev

# Copy the application
COPY . .

# Persistent application data
VOLUME ["/app/sessions", "/app/data"]

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "bot.js"]