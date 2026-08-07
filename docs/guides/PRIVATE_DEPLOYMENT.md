# Novel Writer 私人服务器部署指南

> **状态**：现役 · 最后核对 2026-08-06
>
> 面向单用户私人 VPS / 家用服务器，Docker Compose + Caddy。不涵盖 CI/CD、K8s 或云平台托管。

## 架构概览

```text
Internet / 局域网 → Caddy (:80 或 :443)
                      ├─ /api/*, /media/*, /health → backend:5000（仅 Docker 内网）
                      └─ /*                         → frontend:3000

backend 数据卷：./data → /app/data
  ├─ novel.db          SQLite（DATABASE_URL=file:/app/data/novel.db）
  ├─ backups/          备份目录
  └─ media/            上传媒体
```

| 路径 | 含义 |
|------|------|
| 宿主机 `./data` | 持久化根目录，**必须备份** |
| 容器 `/app/data/novel.db` | 生产 SQLite 数据库 |
| 容器 `/app/prisma` | Prisma schema 与 migrations（只读，不自动迁移） |
| 前端 `dist` | 构建时写入镜像，**不要** bind-mount 空目录到 `/app/dist` |

**对外入口**：**仅** Caddy 映射宿主机 80/443。frontend 与 backend 均使用 `expose`（不映射宿主机 3000/5000），生产访问必须经过 Caddy；API 与页面均通过同源 `/api/v2` 与 Caddy 反代工作。

## 1. Caddy 配置模式

仓库提供两份合法 Caddyfile，通过 `.env` 的 `CADDYFILE` 选择挂载：

| 模式 | `CADDYFILE` | `DOMAIN` | 说明 |
|------|-------------|----------|------|
| **A — HTTP 手测** | `Caddyfile.http`（默认） | `localhost` 或局域网 IP | 站点块 `http://…`，纯 HTTP :80，**无** `tls` 指令 |
| **B — HTTPS 公网** | `Caddyfile.https` | 公网 FQDN | 全局 `{ email … }` + Caddy 自动 HTTPS，**无** `tls` 指令 |

切换模式后需重启 Caddy：

```bash
docker compose up -d caddy
```

### 模式 A：私人 HTTP 手测

`.env` 示例：

```env
DOMAIN=localhost
CADDYFILE=Caddyfile.http
APP_PASSWORD=change-me-to-a-strong-password
```

局域网 IP 手测时将 `DOMAIN` 改为服务器 IP（如 `192.168.1.100`），浏览器访问 `http://192.168.1.100`。

`HTTPS_EMAIL` 可留空。

### 模式 B：公网 HTTPS

`.env` 示例：

```env
DOMAIN=novel.example.com
CADDYFILE=Caddyfile.https
HTTPS_EMAIL=admin@example.com
APP_PASSWORD=change-me-to-a-strong-password
```

前置条件：

- DNS `A` 记录指向本机公网 IP
- 防火墙放行 80、443（Let's Encrypt HTTP-01 需要 80）

浏览器访问 `https://novel.example.com`（Caddy 自动申请证书）。

## 2. 环境准备

### 服务器要求

- Linux，Docker Engine 20+，Docker Compose v2
- 模式 A：开放 80；模式 B：开放 80 + 443
- 建议 2 核 / 4GB RAM / 20GB 磁盘

### 克隆与配置

```bash
git clone <your-repo-url> /opt/novel-writer
cd /opt/novel-writer
cp .env.example .env
# 按上文「模式 A / B」编辑 DOMAIN、CADDYFILE、HTTPS_EMAIL、APP_PASSWORD
```

`docker-compose.yml` 已为 backend 注入：

- `HOST=0.0.0.0` — 容器内监听所有接口
- `DATABASE_URL=file:/app/data/novel.db` — 覆盖 `.env` 中的开发库路径

本地 `npm run dev` 仍默认 `HOST=127.0.0.1`（见 `backend/.env.example`）。

### 数据目录

```bash
mkdir -p data/backups data/media
chmod 755 data
```

首次部署前 **数据库文件不存在**，需手动初始化（见 §5）。

## 3. 构建与启动

```bash
docker compose config
docker compose up -d --build
docker compose ps
```

## 4. 健康检查

```bash
# 模式 A（HTTP）
curl -sf http://localhost/health

# 模式 B（HTTPS）
curl -sf https://YOUR_DOMAIN/health

# 容器内直连 backend（调试，宿主机无 :5000 映射）
docker compose exec backend node -e "fetch('http://127.0.0.1:5000/health').then(r=>r.text()).then(console.log)"
```

期望 JSON：`{"status":"ok","database":"connected",...}`

若 `database: disconnected`，多为未初始化 DB 或 `data` 卷权限问题。

> **说明**：compose 故意不将 frontend/backend 端口暴露到宿主机；生产访问必须经 Caddy。若临时调试，可短暂加 `ports`（如 backend `5000:5000`），完毕后再移除。

## 5. 数据库首次初始化

**容器启动不会自动执行迁移**，避免误伤已有数据。

首次部署（空 `data/novel.db`）：

```bash
docker compose exec backend npx prisma migrate deploy
```

说明：

- `migrate deploy` 仅应用已有 migration，**不会** reset 数据库
- 开发库 `backend/prisma/dev.db` 与生产 `data/novel.db` 相互独立

## 6. 访问与登录

- 模式 A：`http://localhost` 或 `http://YOUR_IP`
- 模式 B：`https://YOUR_DOMAIN`
- 使用 `.env` 中 `APP_PASSWORD` 登录
- 前端 API 使用同源相对路径 `/api/v2`，无需配置 `VITE_API_BASE_URL`

## 7. 日志

```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f caddy
```

Caddy 访问日志：`deployment/caddy/data/access.log`（容器内 `/data/access.log`）。

## 8. 备份与恢复

### 备份（推荐停机或低峰）

```bash
docker compose stop backend
tar -czf "backup_$(date +%Y%m%d_%H%M%S).tar.gz" data/
docker compose start backend
```

### 恢复

```bash
docker compose down
tar -xzf backup_YYYYMMDD_HHMMSS.tar.gz
docker compose up -d
```

## 9. 停止与回滚

```bash
docker compose down
git checkout <previous-tag-or-commit>
docker compose up -d --build
```

## 10. 常见问题

| 现象 | 排查 |
|------|------|
| 前端空白 / 404 | 确认 **未** mount `./frontend/dist`；`docker compose build frontend` |
| API 连不上 | backend `HOST=0.0.0.0`；Caddy `/api/*` → `backend:5000` |
| Caddy 启动报 TLS 错误 | 手测应使用 `CADDYFILE=Caddyfile.http`；HTTPS 模式勿在 HTTP 站点块写 `tls` |
| 证书申请失败 | 模式 B：`DOMAIN` DNS、防火墙 80/443、`HTTPS_EMAIL` 有效 |
| 宿主机 `:5000` / `:3000` 连不通 | 预期行为；仅 Caddy 80/443 对外，改走 `http://localhost/` 或域名 |

## 11. 本地开发对照

| 场景 | API 地址 | 后端监听 |
|------|----------|----------|
| `npm run dev` | Vite 代理 `/api` → `127.0.0.1:5000` | `HOST=127.0.0.1` |
| Docker 生产 | 浏览器同源 `/api/v2` | `HOST=0.0.0.0`（仅容器网络可达） |

更完整的 VPS 加固与监控见 [DEPLOYMENT.md](./DEPLOYMENT.md)。
