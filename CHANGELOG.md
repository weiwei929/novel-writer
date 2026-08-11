# Changelog

All notable changes to this project will be documented in this file.

> **状态**：现役 · 最后核对 2026-08-11

---

## [未发布] — 2026-08-11 主线对齐

### Added

- **正式主线确认** — `feature/workdetail-p1@b60eaf8` 晋升为 `master` 正式主线；标签 `baseline-2026-08-07`
- **在研分支收拢** — TASK-710/720 未提交内容独立收束至 `task-710-720-followup`
- **私有化部署候选** — Docker / Caddy / PM2 配置与 Prisma 引擎适配已进入主线

### Changed

- **基线文档对齐** — `AGENTS.md`、`docs/CURRENT_BASELINE.md` 更新为 `master@b60eaf8` 新基线
- **数据库迁移** — Project 工作流时间戳、软删除、`proposalId` 主关联迁移已并入主线

---

## [未发布] — 2026-06 ~ 2026-07

### Added

- **616 内容链贯通** — 企划课设定 / 章节规划 → 确认 → 交接创作室 → 正文写作，主链已实测跑通
- **创作室只读参阅侧栏** — 写作时对照作品设定与本章梗概
- **「继续写作」入口** — 首页恢复最近创作中的作品与章节
- **本地草稿镜像与一键恢复** — 断网 / 异常时保护未保存正文
- **后端测试防线** — Jest 4 个 suite / 16 个用例（此前为占位）
- **发布门槛校验** — 企划课设定完整度与章节最低要求
- **`docs/ROADMAP.md`** — 面向未来的唯一说明（现状、冻结项、三期路线）

### Changed

- **写作器重构** — 三栏布局降噪；`WorkMetadataPanel` → `WorkSettingDocument`；抽出 `CreateProposalModal`；`WorkDetailPage` 产物体积 −20%
- **文档体系治理（TASK-621）** — 217 份文档按功能三分：现役 25 / 学习档案 `journal/` 60 / 历史归档 `archive/` 137。全部现役文档加状态行，并写入 `AGENTS.md` 硬规则：**无状态行的文档不得作为操作依据**
- **构建门禁** — `backend` 的 `build` / `lint` 前置 `prisma generate`

### Deprecated / Frozen

- **AI 全部功能已冻结** — `frontend/src/config/aiFreeze.ts` 中 `AI_UI_FROZEN = true`，前端入口统一关闭；后端代码保留未删。**对外可用 AI 能力为 0**
- **旧版世界观 / 人物 / 故事线数据线** — 仅折叠展示，不再扩展

### Fixed

- 修正文档中早已废弃的 Grok provider 配置说明（`QUICK_START.md` / `DEPLOYMENT.md`）
- 修正 `README.md` / `VERSION.json` / AI 规格文档中「AI 95% 完成」「状态：已实现」等与现状矛盾的表述
- `WorkDetailPage` 返回按钮改为语义导航

### Known Issues

- 前端无自动化测试（2.3 万行零覆盖）
- 服务默认监听 `0.0.0.0`，`APP_PASSWORD` 未设时回落到硬编码默认值
- 字数统计三处取值不一致，中文按空格分词无意义
- 会话文件路径写死 POSIX `/tmp`，Windows 下静默失败，后端重启即掉登录

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
