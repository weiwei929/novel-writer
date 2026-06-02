# Changelog

All notable changes to this project will be documented in this file.

---

## [2.0.0] — 2026-06-02

### Added

- **2.0 主页仪表盘** — 五段管线进度与「继续创作」入口
- **作品详情中枢** — `/work/:id` 三 Tab（设定 / 章节 / 元数据）
- **创作室编辑器** — `/writing/:projectId/:chapterId` 纯 Markdown + 参考侧栏
- **管线闭环** — 相邻状态流转、阶段管理弹窗、作品暂存
- **文集库** — `/library` 文集侧栏、归入/移出、Markdown 导出
- **作品暂存** — `/shelf` 软删除与还原

### Changed

- **路由** — 1.0 路径重定向：`/projects`→`/`、`/projects/:id`→`/work/:id`、`/editor/*`→`/writing` 或 `/work`、`/collections`→`/library`
- **文档** — `CURSOR_REFERENCE.md` 与当前 2.0 路由/文案对齐（「作品暂存」）

### Removed

- **1.0 页面** — `EnhancedEditorPage`、`ProjectDetailPage`、`CollectionsPage`、`ProjectsPage`、`ApiTestPage`、`CollectionsList`、`ProjectsList`

---

## [Unreleased] — 2026-05-29

### Added

- **章节规划回写** — 后端新增 `GET/PUT /projects/:id/chapter-planning` 端点，规划数据存入 `project.metadata.chapterPlanning`
- **章节梗概弹窗** — 章节列表点击「梗概」标签弹出居中只读模态窗，支持遮罩/Esc 关闭
- **章节正文弹窗** (`ChapterContentModal`) — 点「正文」弹出只读阅览，640px→720px 居中
- **内容元数据只读卡片** (`ContentMetadataCard`) — 6 标签切换只读展示作品内容元数据
- **认证强化** — `/auth/status` 不再恒返回 true，改为 session token 校验；前端 axios 拦截器自动携带 token

### Changed

- **作品详情页重构** — Tab 结构改为双栏布局：左栏作品梗概+章节列表，右栏内容元数据
- **章节列表优化** — 每章含「梗概」「正文」「写作」三按钮，含字数/日期/状态
- **流程闭环统一** — 移除"手动创建章节"入口，统一到"管理章节规划"
- **编辑器"退出"→"返回作品"** — 消除歧义
- **元数据架构明确** — 内容元数据为作品级唯一，AI 不参与构建；编辑入口限详情页
- **弹窗尺寸统一放大** — 梗概 520→640px、正文 640→720px、元数据编辑 28→42rem

### Removed

- **AI 章节大纲生成器** — 从详情页移除，与手动规划模式冲突
- **章节元数据面板** — `ChapterMetadataPanel` 标记 `@deprecated`，内容元数据统一到作品级
- **元数据编辑 AI 助手** — `ProjectMetadataPanel` 移除 AI 辅助按钮和 `AIMetadataAssistant` 集成
- **登录页密码提示** — 移除默认密码明文展示

### Fixed

- **章节规划保存 404** — `updateChapterPlanning` 从抛异常改为调用真实端点
- **路由回退** — `/editor/:projectId`（无 chapterId）新增重定向到详情页
- **元数据编辑双层背景** — 移除详情页多余 wrapper
- **作品列表标题** — 可点击跳转详情页

### Files Changed

**新增 (4):**
- `frontend/src/components/editor/ChapterContentModal.tsx`
- `frontend/src/components/metadata/ContentMetadataCard.tsx`
- `backend/src/routes/auth.ts` (重写)

**修改 (~10):**
- `backend/src/routes/projects.ts`
- `frontend/src/App.tsx`
- `frontend/src/services/api.ts`
- `frontend/src/pages/ProjectDetailPage.tsx` (重构)
- `frontend/src/pages/EnhancedEditorPage.tsx`
- `frontend/src/components/editor/ProjectNavigationPanel.tsx`
- `frontend/src/components/editor/ProjectMetadataPanel.tsx`
- `frontend/src/components/editor/ChapterPlanningEditor.tsx`
- `frontend/src/components/projects/ProjectCard.tsx`
- `frontend/src/components/auth/AuthGuard.tsx`

---

### Added

- **灵感碎片模块** (`Scraps`) — 独立的笔记/便签系统
  - 新增 `ScrapsPage` 页面 (`/scraps`)：全文搜索、按作品过滤、按标签筛选
  - 新增 `ScrapCard` 组件：内容预览、标签 chip、编辑/删除操作
  - 新增 `ScrapFormModal` 组件：创建 + 编辑复用，支持手写和 Ctrl+V 粘贴
  - 后端：新增 `GET /api/v2/scraps`、`PUT /api/v2/scraps/:id` 端点
  - Prisma：`Scrap.projectId` 改为可选，支持不归属任何作品的碎片
- **多 Provider AI 支持**
  - `AIService` 新增 OpenAI / DeepSeek / Ollama 三个 provider 调用能力
  - 三个 provider 共享 OpenAI-compatible Chat Completions 协议，零额外依赖
  - Settings 中已有的 `openai`/`deepseek`/`ollama` 选项现在可实际使用

### Fixed

- **SettingsPage 导航栏重复** — 移除了 `SettingsPageWrapper` 中冗余的 `<Layout>` 包裹
- **AI Status 端点** (`/api/v2/ai/status`) 不再硬编码 `mock`，改为动态读取配置
- **Router 性能** — `createBrowserRouter` 从组件函数体内移至模块级，避免每次渲染重建
- **AuthGuard 绿色横幅** — 新增 × 关闭按钮，不再永久显示
- **类型安全** — `Scrap` 接口补充 `project` 关联类型和 `projectId?`，消除多处类型断言
- **魔术字符串** — `ScrapsPage` 中 `"__none__"` 替换为命名常量 `FILTER_UNASSIGNED`
- **动态 import** — `ai.ts` 中 `await import('../services/SettingsManager')` 改为静态 import

### Changed

- **全局命名规范化**：用户可见的 `项目` → `作品`（14 个文件，纯文案替换，零逻辑变更）
- **文档重构**：
  - `docs/` 目录整理：归档旧文档至 `archive/`，指南移至 `guides/`
  - 更新 `docs/INDEX.md`：修复全部失效链接，补充 thinklogs 和规格说明索引
- **版本号统一**：
  - `VERSION.json`：`1.0.0` → `2.0.0`，技术栈描述修正（Express→Fastify, LowDB→SQLite）
  - `package.json`：版本号同步至 `2.0.0`
- **环境配置清理**：
  - `.env` / `.env.example`：移除无效的 `GROK_API_KEY` 配置，替换为 `GEMINI_API_KEY` + `DATABASE_URL`

### Files Changed

**新增 (7):**
- `frontend/src/pages/ScrapsPage.tsx`
- `frontend/src/components/scraps/ScrapCard.tsx`
- `frontend/src/components/scraps/ScrapFormModal.tsx`
- `docs/README.md`
- `docs/specs/AI_FEATURES_SPECIFICATION.md`
- `docs/specs/METADATA_FIELD_CONVENTION.md`
- `docs/thinklogs/` (2 篇新随笔)

**修改 (~30):**
- `backend/prisma/schema.prisma`
- `backend/src/routes/ai.ts`
- `backend/src/routes/scraps.ts`
- `backend/src/services/ai/AIService.ts`
- `frontend/src/App.tsx`
- `frontend/src/services/api.ts`
- `frontend/src/pages/SettingsPage.tsx`
- `frontend/src/components/auth/AuthGuard.tsx`
- 14 个文件的"项目→作品"文案替换
- 其他组件/页面微调

---

## [2.0.0] — 2025-12-24

### Added
- Fastify + Prisma + SQLite 架构升级
- AI 三层上下文管理 (Tier A/B/C)
- Google Gemini API 集成
- 三栏编辑器 (Monaco Editor)
- AI 元数据助手 + 写作助手 + 审阅功能

---

## [1.0.0] — 2025-11-03

### Added
- 文集管理与项目管理
- 数据库持久化 (Prisma + SQLite)
- 前端 React 应用 + 后端 API 服务
- TypeScript 集成
- 设置管理系统
