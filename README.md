# Novel-Writer 小说创作器

基于 React + Fastify + Prisma 的本地优先小说创作平台，支持项目/章节元数据管理、版本历史与结构化章节规划。

##  当前状态（2025-12-13）

- **后端架构**: Fastify + Prisma (SQLite) + TypeScript
- **前端架构**: React 18 + Vite + TailwindCSS
- **数据存储**: SQLite (使用 Prisma Json 类型存储元数据)
- **核心功能**: 三栏创作、元数据管理、暗线/设定集管理、Markdown 导出

## ✨ 核心能力

- 📚 **文集与项目管理**: 极简的项目卡片与文集分类
-  **三栏编辑器**: 沉浸式创作体验，左侧导航 | 中部正文 | 右侧元数据
- 🧩 **Json元数据**: 灵活的设定集系统，底层使用 Prisma Json 类型，无需手动解析
- 🧱 **章节规划**: 支持拖拽排序、字数统计、状态管理
-  **本地优先**: 包含完整的数据导入导出功能 (Markdown/Json)

## 🚀 快速开始

### 1. 安装依赖

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. 数据库准备

初始化 SQLite 数据库：

```bash
cd backend
npx prisma generate
npx prisma db push
```

### 3. 启动服务

```bash
# 终端 A: 后端 (http://localhost:5000)
cd backend
npm run dev

# 终端 B: 前端 (http://localhost:3000)
cd frontend
npm run dev
```

## 📁 主要结构

```
novel-writer/
├─ frontend/           # React + Vite 前端
├─ backend/            # Fastify + Prisma 后端 (API v2)
│  ├─ prisma/          # 数据库 Schema
│  └─ src/
│     └─ routes/       # API 路由
├─ docs/               # 文档
└─ README.md
```

## 🛠️ 技术栈

- **前端**: React 18, TypeScript, Vite, TailwindCSS, Axios, Monaco Editor, Lucide Icons
- **后端**: Fastify, TypeScript, Zod (验证), Prisma (ORM), SQLite
- **架构**: REST API (/api/v2)

## 🔒 配置

在 `backend` 目录下创建 `.env` 文件（参考 `.env.example`）：
- `APP_PASSWORD`: 设置简单的访问密码（默认 `novel2024`）

## 📄 许可证

MIT License