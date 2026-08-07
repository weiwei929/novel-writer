# ---- Build Stage ----
FROM node:18-slim AS builder
WORKDIR /app

# Match runtime OpenSSL so prisma generate picks linux-*-openssl-3.0.x engine
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma
COPY tsconfig.json ./
COPY .env.example ./

RUN npm ci
RUN npx prisma generate
COPY src ./src
RUN npm run build
RUN npm prune --omit=dev

# ---- Runtime Stage ----
FROM node:18-slim
WORKDIR /app

# Prisma query engine on Debian slim needs OpenSSL at runtime
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 5000
CMD ["node", "dist/index.js"]
