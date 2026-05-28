# ---- Build Stage ----
FROM node:18-slim AS builder
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
COPY tsconfig.json ./

RUN npm ci
RUN npx prisma generate
COPY src ./src
RUN npm run build

# ---- Runtime Stage ----
FROM node:18-slim
WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

RUN npm ci --omit=dev
RUN npx prisma generate

EXPOSE 5000
CMD ["node", "dist/index.js"]
