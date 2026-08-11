# Novel Writer — 本地优先的中文小说创作工具

> **状态**：现役 · 最后核对 2026-08-11
>
> 基于 React + Fastify + Prisma 的本地优先小说创作工具。**AI 辅助功能当前已冻结**，详见 [docs/ROADMAP.md](./docs/ROADMAP.md)。

**当前版本**: 2.0  
**最后更新**: 2026-08-11  
**正式主线**: `master@b60eaf8`（标签 `baseline-2026-08-07`）

> **AI 功能当前已冻结**，前端入口统一显示「AI 集成开发中」。本文档中 AI 相关章节为**设计留档**，非当前可用能力。

---

## ✨ 核心特性

### 📝 专业创作环境
- **三栏编辑器**: 左侧章节导航 | 中部正文编辑 | 右侧元数据面板
- **沉浸式写作**: Monaco Editor 提供专业的编辑体验
- **实时保存**: 自动保存，永不丢失创作内容
- **章节管理**: 拖拽排序、字数统计、状态跟踪

### 🤖 AI 智能辅助（⛔ 已冻结 · 不可用）
后端代码保留未删，前端入口已统一冻结（`frontend/src/config/aiFreeze.ts`）。以下为**待解冻时的设计目标**，非当前能力：
- AI 元数据提取 / 元数据助手 / 写作助手 / 审阅功能

### 📚 项目管理
- **文集分类**: 灵活的项目分组管理
- **看板视图**: 可视化项目进度（构思、写作、完成）
- **元数据系统**: 结构化管理项目和章节信息
- **导入导出**: 支持 Markdown 和 JSON 格式

### 🎯 本地优先
- **数据安全**: 所有数据存储在本地 SQLite 数据库
- **离线可用**: 无需网络即可创作（AI 功能除外）
- **完整导出**: 随时导出为 Markdown 或 JSON 格式

---

## 🚀 快速开始

### 前置要求
- Node.js 18+
- npm 或 yarn

### 1. 安装依赖

```bash
# 后端
cd backend && npm install

# 前端
cd frontend && npm install
```

### 2. 配置环境

在 `backend` 目录创建 `.env` 文件：

```env
# 应用密码（可选）
APP_PASSWORD=novel2024

# Gemini API Key（AI 功能必需）
GEMINI_API_KEY=your_api_key_here
```

### 3. 初始化数据库

```bash
cd backend
npx prisma generate
npx prisma db push
```

### 4. 启动服务

```bash
# 方式 1：使用启动脚本（推荐）
./start-dev.bat  # Windows
./start-dev.sh   # macOS/Linux

# 方式 2：手动启动
# 终端 A: 后端
cd backend && npm run dev

# 终端 B: 前端
cd frontend && npm run dev
```

### 5. 访问应用

- 前端: http://localhost:3000
- 后端 API: http://localhost:5000

---

## 📁 项目结构

```
novel-writer/
├── frontend/              # React 前端
│   ├── src/
│   │   ├── components/    # React 组件
│   │   ├── pages/         # 页面组件
│   │   ├── services/      # API 服务
│   │   └── App.tsx
│   └── package.json
├── backend/               # Fastify 后端
│   ├── src/
│   │   ├── routes/        # API 路由
│   │   ├── services/      # 业务逻辑
│   │   │   └── ai/        # AI 服务（已冻结）
│   │   └── index.ts
│   ├── prisma/
│   │   └── schema.prisma  # 数据库模型
│   └── package.json
├── docs/                  # 文档
│   ├── INDEX.md           # 文档索引
│   ├── ARCHITECTURE.md    # 架构说明
│   ├── DEVELOPMENT.md     # 开发指南
│   ├── guides/            # 详细指南
│   ├── specs/             # 规格说明
│   ├── tasks/             # 任务卡
│   ├── journal/           # 学习档案
│   └── archive/           # 历史归档
├── deployment/            # 部署配置
│   └── caddy/
├── data/                  # SQLite 数据库
└── README.md              # 本文件
```

---

## 🛠️ 技术栈

### 前端
- **框架**: React 18 + TypeScript
- **构建**: Vite
- **样式**: TailwindCSS
- **编辑器**: Monaco Editor
- **图标**: Lucide React
- **HTTP**: Axios

### 后端
- **框架**: Fastify + TypeScript
- **ORM**: Prisma
- **数据库**: SQLite
- **验证**: Zod
- **AI**: Google Gemini API

### 架构
- **API**: RESTful API (`/api/v2`)
- **数据**: 本地优先，SQLite 存储
- **AI**: 三层上下文管理（Tier A/B/C）

---

## 🤖 AI 功能说明

### 上下文管理策略

- **Tier A（核心元数据）**: 项目和章节的核心信息，所有 AI 请求必须包含
- **Tier B（章节工作层）**: 当前章节内容 + 核心元数据，用于写作助手
- **Tier C（全局审阅层）**: 所有章节内容，仅用于全书审阅

### 设计原则

1. **作者为主，AI 为客**: AI 提供建议，用户做决策
2. **对话式交互**: 通过对话引导用户构思
3. **确认后入库**: AI 生成的内容需用户确认才保存

详见 [AI 功能规格](./docs/specs/AI_FEATURES_SPECIFICATION.md)

---

## 📖 文档

- **[变更日志](./CHANGELOG.md)** - 版本变更记录
- **[文档索引](./docs/INDEX.md)** - 所有文档的导航
- **[架构说明](./docs/ARCHITECTURE.md)** - 系统架构和设计决策
- **[开发指南](./docs/DEVELOPMENT.md)** - 开发环境和工作流程
- **[快速开始](./docs/guides/QUICK_START.md)** - 5 分钟快速上手
- **[部署指南](./docs/guides/DEPLOYMENT.md)** - 生产环境部署

---

## 🎯 开发状态

> 详细状态与下一步计划见 **[docs/ROADMAP.md](./docs/ROADMAP.md)**；协作基线见 **[docs/CURRENT_BASELINE.md](./docs/CURRENT_BASELINE.md)**。

### 可用
- ✅ 文集 / 作品管理
- ✅ 企划课：作品设定、章节规划、发布门槛
- ✅ 创作室：三栏编辑器、正文保存、本地草稿恢复
- ✅ 只读参阅侧栏（设定 / 本章）
- ✅ Markdown 导入导出
- ✅ 私有化部署候选（Docker / Caddy / PM2）

### 冻结
- ⛔ AI 全部功能（后端代码保留，前端入口冻结）
- ⛔ 旧版世界观 / 人物 / 故事线数据线（仅折叠展示，不再扩展）

### 已知短板
- ⚠️ 前端无自动化测试（2.3 万行零覆盖）
- ⚠️ 字数统计三处取值不一致
- ⚠️ 会话文件路径写死 POSIX `/tmp`，Windows 下静默失败，后端重启即掉登录

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发流程
1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

---

## 📄 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件

---

## 🙏 致谢

- [React](https://react.dev/) - 前端框架
- [Fastify](https://fastify.dev/) - 后端框架
- [Prisma](https://www.prisma.io/) - ORM
- [Google Gemini](https://ai.google.dev/) - AI 能力
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - 代码编辑器
- [TailwindCSS](https://tailwindcss.com/) - CSS 框架

---

**Happy Writing! 📝✨**