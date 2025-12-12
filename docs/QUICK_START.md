# 快速启动指南

**最后更新**: 2025年12月08日

---

## 🚀 启动开发服务器

### 方式一：同时启动前端和后端（推荐）

```bash
npm run dev
```

这将同时启动：
- **前端开发服务器**: http://localhost:3000
- **后端 API 服务器**: http://localhost:5000

### 方式二：分别启动

**启动后端**:
```bash
npm run dev:backend
# 或
cd backend && npm run dev
```

**启动前端**:
```bash
npm run dev:frontend
# 或
cd frontend && npm run dev
```

---

## 🌐 访问地址

### 前端应用
- **开发服务器**: http://localhost:3000
- **主要功能**:
  - 文集管理
  - 项目管理
  - 章节编辑
  - AI 写作助手
  - 版本管理

### 后端 API
- **API 服务器**: http://localhost:5000
- **健康检查**: http://localhost:5000/health
- **API 文档**: http://localhost:5000/api/v1

---

## 📋 服务器信息

### 后端服务器
- **端口**: 5000（可通过 `PORT` 环境变量修改）
- **框架**: Express.js
- **数据库**: LowDB (JSON 文件)
- **数据目录**: `backend/data/`

### 前端服务器
- **端口**: 3000（Vite 默认）
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **代理配置**: 
  - `/api/*` → `http://localhost:5000`
  - `/auth/*` → `http://localhost:5000`

---

## 🔧 环境变量

### 后端环境变量

创建 `backend/.env` 文件（可选）:

```env
# 服务器端口
PORT=5000

# 数据存储路径
DATA_PATH=./data

# JWT 密钥（用于认证）
JWT_SECRET=your-secret-key-here

# Grok API 密钥（用于 AI 功能）
GROK_API_KEY=your-grok-api-key-here

# 环境
NODE_ENV=development
```

### 前端环境变量

创建 `frontend/.env` 文件（可选）:

```env
# API 基础 URL
VITE_API_BASE_URL=http://localhost:5000
```

---

## ✅ 启动检查清单

启动前确保：

- [x] Node.js >= 18.0.0 已安装
- [x] 所有依赖已安装 (`npm run install:all`)
- [x] 后端数据目录存在 (`backend/data/`)
- [ ] 环境变量已配置（如需要）

---

## 🐛 常见问题

### 端口被占用

**后端端口 5000 被占用**:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# 或修改环境变量
set PORT=5001
npm run dev:backend
```

**前端端口 3000 被占用**:
```bash
# 修改 vite.config.ts 中的 port
server: {
  port: 3001,
}
```

### 依赖未安装

```bash
# 安装所有依赖
npm run install:all
```

### 数据库初始化失败

检查 `backend/data/` 目录是否存在且有写入权限。

---

## 📝 开发提示

1. **热重载**: 前端和后端都支持热重载，修改代码后自动刷新
2. **日志**: 后端日志使用 Winston，可在控制台查看
3. **API 测试**: 使用 http://localhost:5000/health 测试后端是否运行
4. **浏览器控制台**: 查看前端错误和网络请求

---

## 🛑 停止服务器

按 `Ctrl + C` 停止开发服务器。

---

**提示**: 首次启动可能需要几秒钟来初始化数据库和加载依赖。


