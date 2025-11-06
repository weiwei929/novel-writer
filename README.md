# Novel-Writer 小说创作器

基于 React + Node.js 的本地优先小说创作平台，支持项目/章节元数据管理、版本历史与结构化章节规划，已在本地开发环境稳定运行并进入功能迭代阶段。

## � 当前状态（2025-11-06）

- 前后端架构稳定：Express(5000) + Vite(3000) 端到端联通
- 认证与拦截器完善：前端 Axios 拦截器与后端认证路由工作正常
- 编辑器体系落地：三栏编辑器 + 项目/章节元数据面板 + 版本管理
- 章节规划升级：从自由 JSON 提示，升级为结构化规划编辑器（CRUD/排序/状态/要点）

## ✨ 核心能力

- 📚 文集与项目管理：项目统计、章节创建、导航跳转
- � 三栏编辑器：左侧项目导航 | 中部正文编辑 | 右侧章节元数据
- 🧩 元数据系统：项目/章节字段可视化编辑，支持版本保存与回滚
- 🧱 章节规划：结构化规划项（标题、状态、关键要点、顺序），独立保存
- � 友好交互：自动保存、非阻塞通知、失败提示与复原
- � 本地优先：JSON/LowDB 存储，可备份与回滚

## 🚀 快速开始

参考完整快速指南：`QUICKSTART.md`

1) 安装依赖

```bash
cd backend && npm install
cd ../frontend && npm install
```

2) 启动服务（两个终端）

```bash
# 终端 A：后端（http://localhost:5000）
cd backend
npm run dev

# 终端 B：前端（http://localhost:3000）
cd frontend
npm run dev
```

可选：打包与预览

```bash
# 前端
cd frontend
npm run build
npm run preview

# 后端（生产）
cd ../backend
npm run build
npm start
```

## 📍 访问地址

- 前端开发：http://localhost:3000
- 后端健康：http://localhost:5000/health

提示：根目录有 `api-test.html` 可用于快速调用 API（直接用浏览器打开本地文件）。

## 📁 主要结构

```
novel-writer/
├─ frontend/           # React + Vite 前端
├─ backend/            # Express + TypeScript 后端
├─ docs/               # 文档索引与说明
├─ data/               # 本地数据（LowDB/JSON）
├─ deployment/         # 部署与进程管理示例
└─ README.md
```

## 📖 文档

- 文档总览：`docs/INDEX.md`
- 快速启动：`QUICKSTART.md`
- 需求规格：`docs/requirements/小说创作器应用需求文档（优化版）.md`
- 技术架构：`docs/architecture/小说创作器应用技术文档（优化版）.md`
- 元数据实现进展：`docs/development/METADATA_SYSTEM_IMPLEMENTATION_PLAN.md`

## 🛠️ 技术栈（当前真实使用）

- 前端：React 18 + TypeScript + Vite，Axios，React Router，Tailwind 实用类（tailwind-merge），Lucide 图标，Monaco Editor
- 后端：Express + TypeScript，LowDB(JSON) 持久化，CORS，dotenv
- 架构：REST API（/api/v1），前端代理转发到 5000，版本化元数据与结构化章节规划

## 🔒 隐私与本地化

- 本地运行与存储，便于离线创作与隐私保护
- 可选备份目录与版本快照，支持回滚

## �️ 道路图（节选）

- [ ] 章节规划拖拽排序与键入优化（chips）
- [ ] 从规划一键生成章节（可选）
- [ ] README 英文化与截图

## 📄 许可证

MIT License（详见根目录 `LICENSE`）

——
最后更新：2025-11-06