# ---- Build Stage ----
FROM node:18-slim AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Runtime Stage ----
FROM node:18-slim
WORKDIR /app

RUN npm install -g serve@14
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["npx", "serve", "-s", "dist", "-l", "3000"]
