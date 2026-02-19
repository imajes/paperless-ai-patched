FROM node:24-slim AS node-builder

WORKDIR /app

# Build deps are only needed for native module compilation (e.g. better-sqlite3).
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

FROM node:24-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    gosu \
    passwd && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN npm install -g pm2 && npm cache clean --force

COPY --from=node-builder /app/node_modules ./node_modules

COPY --chown=node:node package.json server.js ecosystem.config.js schemas.js swagger.js ./
COPY --chown=node:node config ./config/
COPY --chown=node:node models ./models/
COPY --chown=node:node routes ./routes/
COPY --chown=node:node services ./services/
COPY --chown=node:node views ./views/
COPY --chown=node:node public ./public/

COPY docker/entrypoint-node.sh /usr/local/bin/entrypoint-node.sh
RUN chmod +x /usr/local/bin/entrypoint-node.sh

VOLUME ["/app/data"]

ENV NODE_ENV=production \
    PAPERLESS_AI_PORT=3000 \
    RAG_SERVICE_ENABLED=true

EXPOSE ${PAPERLESS_AI_PORT}

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -fsS "http://localhost:${PAPERLESS_AI_PORT:-3000}/health" || exit 1

ENTRYPOINT ["/usr/local/bin/entrypoint-node.sh"]
CMD ["pm2-runtime", "ecosystem.config.js"]
