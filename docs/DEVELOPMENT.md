# Novel-Writer 开发指南

> **状态**：现役 · 最后核对 2026-07-27

## 🚀 快速开始

### 环境准备

确保您的系统已安装以下软件：

```bash
# Node.js 18+
node --version

# npm 8+
npm --version

# Git
git --version

# PM2 (可选，用于生产环境)
npm install -g pm2
```

**Windows用户**：建议安装 [Git for Windows](https://git-scm.com/download/win) 以获得更好的终端体验。

### 项目初始化

1. **克隆项目**
```bash
git clone <your-repo-url>
cd novel-writer
```

2. **安装依赖**
```bash
# 安装所有依赖（根项目、前端、后端）
npm run install:all
```

3. **环境配置**
```bash
# 复制环境变量模板（后端见 backend/.env.example）
cp backend/.env.example backend/.env

# 按需编辑；变量说明见 backend/.env.example（DATABASE_URL、APP_PASSWORD 等）
```

4. **启动开发环境**
```bash
# Windows: 使用批处理脚本
start-dev.bat

# 或者手动启动
npm run dev

# 分别启动 (可选)
npm run dev:frontend  # 前端: http://localhost:3000
npm run dev:backend   # 后端: http://localhost:5000
```

## 📁 项目结构详解

```
novel-writer/
├── frontend/                   # React前端应用
│   ├── src/
│   │   ├── components/         # React组件
│   │   │   ├── layout/         # 布局组件
│   │   │   ├── collections/    # 文集管理
│   │   │   ├── story/          # 故事设置
│   │   │   ├── editor/         # 编辑器
│   │   │   ├── media/          # 媒体处理
│   │   │   └── common/         # 通用组件
│   │   ├── stores/             # Zustand 状态管理
│   │   ├── hooks/              # 自定义Hooks
│   │   ├── utils/              # 工具函数
│   │   └── types/              # TypeScript类型定义
│   ├── public/                 # 静态资源
│   └── package.json
│
├── backend/                    # Fastify 后端服务
│   ├── prisma/                 # Prisma schema + SQLite（dev.db）
│   ├── src/
│   │   ├── routes/             # API 路由（Fastify）
│   │   ├── services/           # 业务逻辑
│   │   └── utils/              # 工具函数
│   └── package.json
│
├── deployment/                 # 部署配置
│   ├── caddy/                  # Caddy配置
│   └── scripts/                # 部署脚本
│
├── docs/                       # 文档
│   ├── DEVELOPMENT.md          # 开发指南
│   ├── DEPLOYMENT.md           # 部署指南
│   └── API.md                  # API文档
│
├── data/                       # （legacy）1.0 LowDB 时代目录，现仓主数据在 backend/prisma/
│
├── docker-compose.yml          # Docker编排
├── .env.example                # 环境变量模板
└── package.json                # 根项目配置
```

## 🛠️ 开发工作流

### 1. 功能开发流程

```bash
# 1. 创建功能分支
git checkout -b feature/collection-management

# 2. 开发和测试
npm run dev
npm run test

# 3. 代码检查
npm run lint
npm run type-check

# 4. 提交代码
git add .
git commit -m "feat: add collection management"

# 5. 构建测试（会先停 backend dev，见下方 Prisma 说明）
npm run build
```

> **Prisma generate**：根目录 `npm run build` / `npm run lint` 会触发 backend `prisma generate`。Windows 上若 backend dev 正在运行，可能锁 `query_engine-windows.dll.node`（EPERM）；构建前请先停止 backend dev。

### 2. 前端开发

**技术栈：** React 18 + TypeScript + Tailwind CSS + Zustand + Vite

```bash
# 进入前端目录
cd frontend

# 安装新依赖
npm install package-name

# 启动开发服务器
npm run dev

# 类型检查
npm run type-check

# 构建生产版本
npm run build
```

**关键文件：**
- `src/App.tsx` - 应用入口
- `src/stores/` - Zustand stores
- `src/components/layout/AppLayout.tsx` - 主布局
- `vite.config.ts` - Vite配置

### 3. 后端开发

**技术栈：** Node.js + Fastify + TypeScript + Prisma + SQLite

```bash
# 进入后端目录
cd backend

# 启动开发服务器（热重载）
npm run dev

# 构建
npm run build

# 运行生产版本
npm start

# 运行备份脚本
npm run backup
```

**关键文件：**
- `src/index.ts` - 服务器入口
- `src/routes/` - API路由定义
- `src/services/` - 业务逻辑
- `tsconfig.json` - TypeScript配置

## 🔧 核心功能开发

> 以下 Express / MUI / Redux 示例为 **1.0 legacy**，仅供参考。现仓请参照 `backend/src/routes/` 中的 Fastify 路由写法。

### 1. 添加新的API端点（legacy 示例）

1. **定义路由** (`backend/src/routes/`)
```typescript
// routes/collections.ts
import { Router } from 'express'
import { CollectionController } from '../controllers/collectionController'

const router = Router()
router.post('/', CollectionController.create)
router.get('/', CollectionController.list)

export { router as collectionRoutes }
```

2. **实现控制器** (`backend/src/controllers/`)
```typescript
// controllers/collectionController.ts
export class CollectionController {
  static async create(req: Request, res: Response) {
    // 实现逻辑
  }
}
```

3. **添加服务层** (`backend/src/services/`)
```typescript
// services/collectionService.ts
export class CollectionService {
  async createCollection(data: CollectionData) {
    // 业务逻辑
  }
}
```

### 2. 添加新的React组件（legacy 示例）

1. **创建组件** (`frontend/src/components/`)
```tsx
// components/collections/CollectionCard.tsx
import React from 'react'
import { Card, CardContent, Typography } from '@mui/material'

interface CollectionCardProps {
  collection: Collection
  onClick: () => void
}

export const CollectionCard: React.FC<CollectionCardProps> = ({ 
  collection, 
  onClick 
}) => {
  return (
    <Card onClick={onClick}>
      <CardContent>
        <Typography variant="h6">{collection.name}</Typography>
      </CardContent>
    </Card>
  )
}
```

2. **添加到状态管理** (`frontend/src/store/`)
```typescript
// store/slices/collectionsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

const collectionsSlice = createSlice({
  name: 'collections',
  initialState: {
    items: [],
    loading: false
  },
  reducers: {
    setCollections: (state, action) => {
      state.items = action.payload
    }
  }
})
```

## 🧪 测试

### 前端测试
```bash
cd frontend
npm test
```

### 后端测试
```bash
cd backend
npm test
```

### 端到端测试
```bash
# 启动完整环境
npm run dev

# 在另一个终端运行E2E测试
npm run test:e2e
```

## 📦 构建和部署

### 开发环境构建
```bash
# 建议先停止 backend dev（Windows 上避免 Prisma DLL 锁）
npm run build
```

### 生产环境部署
```bash
# Windows: 使用批处理脚本
start-prod.bat

# 或者手动部署
npm run build     # 构建项目
npm start         # 启动生产服务器
npm run logs      # 查看日志

# PM2管理
pm2 status        # 查看状态
pm2 restart all   # 重启服务
pm2 stop all      # 停止服务
```

## 🐛 调试技巧

### 1. 前端调试
- 使用浏览器开发者工具
- React Developer Tools

### 2. 后端调试
```bash
# 启用详细日志
LOG_LEVEL=debug npm run dev

# 查看API请求
curl -X GET http://localhost:5000/health
```

### 3. 常见问题

**问题：前端无法连接后端**
```bash
# 检查代理配置
# frontend/vite.config.ts
proxy: {
  '/api': 'http://localhost:5000'
}
```

**问题：AI Provider 调用失败**

检查 `backend/.env` 与 `.env.example` 中的相关配置（按当前启用的 Provider 填写）。

## 🔍 性能优化

### 前端优化
- 使用 React.lazy() 懒加载
- 控制 Zustand store 粒度
- 图片压缩和懒加载

### 后端优化
- API响应缓存
- 文件压缩
- 数据库查询优化

## 📚 扩展阅读

- [React 官方文档](https://react.dev)
- [Fastify 文档](https://fastify.dev)
- [Prisma 文档](https://www.prisma.io/docs)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Zustand 文档](https://zustand.docs.pmnd.rs)
- [Docker 文档](https://docs.docker.com)

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交变更
4. 推送到分支
5. 创建Pull Request

## 📞 获取帮助

- 查看现有Issues
- 阅读技术文档
- 检查错误日志