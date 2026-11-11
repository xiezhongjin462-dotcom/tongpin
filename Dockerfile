FROM node:24-slim

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

COPY server.js ./
COPY cloud.js ./
COPY public ./public
COPY scripts ./scripts

RUN mkdir -p /data /uploads

ENV DATA_DIR=/data \
    UPLOAD_DIR=/uploads \
    HOST=0.0.0.0 \
    PORT=3000

EXPOSE 3000
CMD ["node", "server.js"]
