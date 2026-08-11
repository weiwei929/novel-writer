# 2.0 实现规范 — Cursor 参考手册

> **状态**：现役 · 最后核对 2026-08-11

> 用途：Cursor 开发 2.0 时的编码规范、架构约定、数据模型参考
> 本文件不是任务卡，是所有任务卡的基础参考
>
> **当前正式主线**：`master@b60eaf8`（标签 `baseline-2026-08-07`）。历史基线如 `v2-dev`、`feature/workdetail-p1` 已不再作为当前开发依据，仅保留在历史文档中。

---

## 一、项目信息

| 项目 | 值 |
|------|-----|
| 栈 | Vite + React 18 + TypeScript + Tailwind CSS + Zustand + Monaco Editor |
| 后端 | Fastify 5 + Prisma 6 + SQLite + Zod + TypeScript |
| 包管理 | npm（两套：`frontend/package.json` + `backend/package.json`） |
| 正式主线 | `master@b60eaf8`（标签 `baseline-2026-08-07`） |
| 端口 | 开发 3000，生产待定 |

---

## 二、分支策略

- `master` — 当前正式主线，基线 `b60eaf8`（标签 `baseline-2026-08-07`）
- `task-710-720-followup` — TASK-710/720 在研内容，尚未并入主线
- 新任务分支应从 `master` 切出；完成后通过 PR 或司令官指定方式合入

### Day 1 设计文档（2026-06-03 定案）

实现 TASK-200+ 前必读：

1. `docs/design/day1-handoff-brief.md` — 5 分钟入门
2. `docs/design/overall-architecture.md` — **v4.1 权威设计全文**
3. `docs/design/v2-migration-map.md` — TASK-200 前资产映射
4. `docs/design/code-conflict-analysis.md` — 冲突点与落地顺序
5. `docs/design/day1-vps-code-index.md` — VPS 代码对照（修正过时路径）

> `day1-design.md` 为 06-03 快照；冲突时以 `overall-architecture.md` v4.1 为准。

---

## 三、四级导航结构

### L1 主导航（当前 2.0 已实现）

Layout 顶部五段 + 全局入口中，**已接通**的主要动线：

```
[创意组] [企划课] [创作室] [编审部] [文集库]
右上角：[数据统计] [系统设置] [作品暂存]
```

### L1 主导航（完整规划，部分待实现）

```
[创意组] [企划课] [创作室] [编审部] [文集库]
```

编审部工作台、创意组部分 L2 仍为占位页；企划课/创作室/文集库/作品暂存已可用。

### L2–L4（概要）

- **L2**：创意组/企划课子 Tab（见下方路由）
- **L3**：作品列表 → `/work/:id` 统一详情中枢
- **L4**：`/writing/:projectId/:chapterId` 创作室编辑器

### 路由结构（当前 2.0 实际）

```
/                   → 主页仪表盘
/work/:id           → 统一作品详情页（L3 中枢 ★）
/writing/:projectId/:chapterId → 创作室编辑器（L4）
/writing/:projectId → 创作室作品入口（无章节时）
/writing/projects   → 创作中作品列表
/library            → 文集库（已完成/已归档 + 文集归类）
/shelf              → 作品暂存（软删除，可还原）
/settings           → 系统设置
/stats              → 数据统计

# 创意组 / 企划课（L1 子路由）
/creative/references、/creative/scraps、/creative/ai-search、/creative/chat、/creative/proposals …
/planning/proposals、/planning/metadata、/planning/evaluation、/planning/projects …

# 编审部（占位）
/review             → 编审部说明页（建设中）

# 1.0 遗留入口（保留或重定向）
/scraps             → 重定向 /creative/scraps
/files              → 文件导入导出（FileManagerPage）
/creative/scraps    → 灵感手记（ScrapNote / scraps）

# 兼容重定向（P2 已落地）
/projects           → /
/projects/:id       → /work/:id
/editor/:projectId/:chapterId → /writing/:projectId/:chapterId
/editor/:projectId  → /work/:projectId
/editor             → /writing/projects
/collections        → /library
/api-test           → /
```

### `/work/:id` 中枢行为

```
/work/:id  ← 统一作品详情页
  提案阶段 → 显示提案数据（可编辑作品设定）
  企划阶段 → 显示项目数据（作品设定只读，含操作栏）
  创作阶段 → 显示章节列表 + 「进入创作室」按钮
  审阅阶段 → 全只读 + 审阅操作栏
  文集库   → 全只读 + 归入文集/导出（`completed`；`archived` 亦出现在文集库列表，详情页暂无「归入文集」）
  作品暂存 → 全只读 + 还原/彻底删除
```

DB 模型名仍为 `Project`，前端路由叫 `work`，两者不一致是允许的。

---

## 四、阶段间四决策点

每个阶段末尾，进入下一阶段前弹出：

```typescript
interface StageTransition {
  action: 'continue' | 'back' | 'pool' | 'trash'
  note?: string
}
```

| 操作 | 行为 |
|------|------|
| `continue` | 进入下一阶段 |
| `back` | 退回上一阶段 |
| `pool` | 移入审查池（保留阶段信息，可恢复） |
| `trash` | 移入回收站（软删除，可恢复） |

审查池和回收站都是全局的，不分阶段。

阶段内不设回退，可配置"不玩了"删除按钮，同样落入回收站。

> **2.0 落地说明（TASK-011+）：** `pool` / `trash` 在数据层统一收敛为 `status: 'shelved'`，原状态保存在 `metadata._shelved = { previousStatus, shelvedAt, source }`。作品暂存入口为 `/shelf`，还原时回到原状态，彻底删除才真删。

---

## 五、关键数据模型

### 5.1 现有模型（复用，不修改表名）

```prisma
// Project - 扩充 status
model Project {
  id          String   @id @default(uuid())
  title       String
  description String?
  author      String?
  coverImage  String?
  status      String   @default("draft")  // draft | planning | writing | reviewing | completed | archived | shelved
  wordCount   Int      @default(0)
  metadata    Json?    // 保留现有结构；_shelved 存作品暂存元数据
  masterPrompt String? // 保留
  tags        Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  collectionId String?  // 可选归属，创建 Project 不再强制选 Collection
  chapters    Chapter[]
  characters  Character[]
  timelineEntries TimelineEntry[]
  creativeFlows CreativeFlow[]
  locations   Location[]    // 保留，但不再扩展新字段（地点信息合入 TimelineEntry）
  scraps      Scrap[]
  proposals   Proposal[]
  collection  Collection? @relation(fields: [collectionId], references: [id])
}

// Chapter - 扩展 status
model Chapter {
  id        String   @id @default(uuid())
  title     String
  content   String   @default("")
  order     Int
  status    String   @default("draft")  // draft | writing | completed
  wordCount Int      @default(0)
  summary   String?
  metadata  Json?    // 保留
  projectId String
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Character - 扩展（TASK-006 新增字段 + TASK-008 双锚点）
model Character {
  id              String   @id @default(uuid())
  name            String
  gender          String?   // 性别
  age             String?   // 年龄
  identity        String?   // 身份/职业
  appearance      String?   // 外貌
  personality     String?   // 性格（含特点/缺陷）
  interests       String?   // 兴趣
  roleType        String?   // 角色定位：主角一号/二号/重要配角/普通配角/龙套
  experience      String?   // 个人经历（选填）
  keyRelations    String?   // 关键关系（选填）
  catchphrase     String?   // 口头禅（选填）
  role            String?   // 保留旧字段（兼容）
  description     String?   // 保留旧字段
  profile         Json?     // 保留旧字段
  // 归属双锚点：proposalId（提案阶段）/ projectId（立项后），应用层 XOR
  projectId       String?
  project         Project?  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  proposalId      String?
  proposal        Proposal? @relation(fields: [proposalId], references: [id], onDelete: Cascade)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

// Location - 保留且仍在启用，但不再扩展新字段（地点信息合入 TimelineEntry）

// Scrap - 复用现有
model Scrap {
  id        String   @id @default(uuid())
  content   String
  note      String?
  tags      Json?    // ["tag1","tag2"]
  sourceType String? // "text" | "image" | "link"
  sourceUrl String?  // 图片URL或链接URL
  projectId String?
  project   Project? @relation(fields: [projectId], references: [id], onDelete: SetNull)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Collection - 语义重定义为"文集"，文集库阶段使用，不做创建前置条件
model Collection {
  id          String    @id @default(uuid())
  name        String
  description String?
  projects    Project[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

### 5.2 新增 / 扩展模型

```prisma
// 外来参考（文件引用）
model FileReference {
  id          String   @id @default(uuid())
  fileName    String
  filePath    String
  fileType    String   // "pdf" | "docx" | "image" | "link"
  sourceUrl   String?  // 来源链接
  comment     String?  // 手工点评（可选）
  tags        Json?    // 标签
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// 故事线（TASK-006 新增 + TASK-008 双锚点）
model TimelineEntry {
  id              String   @id @default(uuid())
  time            String    // 时间标记（必填）
  location        String    // 地点（必填）
  characters      String    // 涉及人物及当下关系（必填）
  premise         String?   // 起因（选填）
  process         String?   // 过程（选填）
  outcome         String?   // 结果（选填）
  narrativeMode   String?   // 叙事方式（选填）
  emotionStage    String?   // 情绪阶段（选填）
  notes           String?   // 备注（选填）
  sortOrder       Int       // 排序
  // 归属双锚点：proposalId / projectId，应用层 XOR
  projectId       String?
  project         Project?  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  proposalId      String?
  proposal        Proposal? @relation(fields: [proposalId], references: [id], onDelete: Cascade)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

// 创作心流（TASK-006 新增 + TASK-008 双锚点）
model CreativeFlow {
  id              String   @id @default(uuid())
  title           String
  content         String    // Markdown 正文
  tags            Json?     // 标签
  // 归属双锚点：proposalId / projectId，应用层 XOR
  projectId       String?
  project         Project?  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  proposalId      String?
  proposal        Proposal? @relation(fields: [proposalId], references: [id], onDelete: Cascade)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

// 作品企划建议书（TASK-008 已实现）
model Proposal {
  id          String   @id @default(uuid())
  title       String
  synopsis    String?  // 故事梗概
  innovation  String?  // 创新点
  coreSetting String?  // 核心设定
  status      String   @default("draft") // draft | submitted | evaluated | approved | rejected | shelved
  references  Json?    // 引用的外来参考/碎片ID列表
  sourceNotes String?  // 来源讨论记录
  projectId   String?  // 被采纳后关联到立项项目
  project     Project? @relation(fields: [projectId], references: [id])

  characters      Character[]
  timelineEntries TimelineEntry[]
  creativeFlows   CreativeFlow[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// 作品暂存（统一的状态管理）
// 不新增模型，通过 Project.status 和 Proposal.status 扩展值管理
// status: "shelved" = 作品暂存（软删除，保留完整状态可还原）
// metadata._shelved = { previousStatus, shelvedAt, source }

// 修订快照
model Snapshot {
  id        String   @id @default(uuid())
  projectId String
  chapterId String?
  version   Int
  content   String   // 快照正文
  note      String?  // 快照说明
  createdAt DateTime @default(now())
}
```

### 5.3 状态枚举（唯一源，见 TASK-011）

```typescript
// frontend/src/types/status.ts
export const PROJECT_STATUSES = [
  'draft', 'planning', 'writing', 'reviewing', 'completed', 'archived', 'shelved',
] as const

export const PROPOSAL_STATUSES = [
  'draft', 'submitted', 'evaluated', 'approved', 'rejected', 'shelved',
] as const
```

存量旧状态兼容映射（`imported→draft`, `published→completed`, `pooled/trashed→shelved`）集中在 service 层，不散落在页面。

`completed` 与 `archived` 均可在文集库（`/library`）列表中展示；详情页「归入文集」入口目前仅对 `completed` 开放。

---

## 六、UI 命名规范

### 文案约定

- **用户可见文案**：统一用「作品设定」，不出现「世界观」
- **代码变量名 / API 字段**：保持英文
- AI Prompt 中的「世界观」暂不改动（改变可能影响 AI 输出，单独阶段处理）

### 组件目录

```
frontend/src/
├── components/
│   ├── layout/           ← 导航、Layout、页面框架
│   │   ├── MainNav.tsx       ← L1 主导航
│   │   ├── SubNav.tsx        ← L2 子导航
│   │   └── StageLayout.tsx   ← 阶段通用布局
│   ├── creative/         ← 创意组相关组件
│   │   ├── ReferencePanel.tsx
│   │   ├── ScrapList.tsx
│   │   ├── AISearchPanel.tsx
│   │   ├── AIChatPanel.tsx
│   │   └── ProposalEditor.tsx
│   ├── planning/         ← 企划课相关组件
│   │   ├── ProposalReview.tsx
│   │   ├── MetadataForm.tsx
│   │   ├── EvaluationPanel.tsx
│   │   └── ProjectList.tsx
│   ├── writer/           ← 创作室组件（复用 + 扩展）
│   │   ├── WriterWorkspace.tsx
│   │   ├── ChapterStatusBoard.tsx
│   │   ├── ReferenceSidebar.tsx
│   │   └── QuickNote.tsx
│   ├── review/           ← 编审部组件
│   │   ├── ReviewWorkspace.tsx
│   │   ├── ContinuousReader.tsx
│   │   ├── SnapshotManager.tsx
│   │   └── ReviewChecklist.tsx
│   └── library/          ← 文集库组件
│       ├── CollectionList.tsx
│       └── StatsDashboard.tsx
├── pages/
│   ├── CreativePage.tsx      ← 创意组页面（内嵌子Tab）
│   ├── PlanningPage.tsx      ← 企划课页面
│   ├── WritingPage.tsx       ← 创作室页面
│   ├── WritingEditorPage.tsx ← 编辑器页面（L4）
│   ├── WorkDetailPage.tsx    ← 统一作品详情页（/work/:id，中枢）
│   ├── ReviewPage.tsx        ← 编审部页面
│   ├── LibraryPage.tsx       ← 文集库页面
│   └── ShelfPage.tsx         ← 作品暂存页面
└── services/
    └── api.ts                ← 扩展 API 方法
```

### 路由配置

```typescript
// App.tsx 路由结构（目标态）
const routes = [
  { path: '/', element: <HomePage /> },
  { path: '/creative/*', element: <CreativePage /> },
  { path: '/planning/*', element: <PlanningPage /> },
  { path: '/writing/*', element: <WritingPage /> },
  { path: '/writing/:projectId/:chapterId', element: <WritingEditorPage /> },
  { path: '/work/:id', element: <WorkDetailPage /> },
  { path: '/review/*', element: <ReviewPage /> },
  { path: '/library/*', element: <LibraryPage /> },
  { path: '/stats', element: <StatsPage /> },
  { path: '/settings', element: <SettingsPage /> },
  { path: '/shelf', element: <ShelfPage /> },
]
```

### 编辑器范围

```
章节框架编辑（标题/梗概/排序）→ 在 /work/:id 详情页内做，不用 Monaco
章节正文写作 → 在 /writing/:projectId/:chapterId 用 Monaco
               纯 Markdown，不含 frontmatter
               不含元数据提取、AI 审阅等杂项
               超 5000 字温和提示
               用 ## 标题做内部锚点导航
```

编辑器右栏 4 模式互斥：`pure`（默认）| `reference` | `ai` | `review`（留空，编审部以后做）

---

## 七、AI 开关机制

```typescript
// 前端 store
interface AISettings {
  enabled: boolean          // 总开关
  partner: boolean          // AI 创意合伙人（默认开启）
  writer: boolean           // AI 写作助手（默认开启）
  reviewer: boolean         // AI 审校官-企划课（默认关闭）
  auditor: boolean          // AI 审校官-编审部（默认开启）
}

// 开关影响
// partner=false → 隐藏 AI 搜索 + 创意讨论 Tab
// writer=false → 隐藏 AI 写作助手面板
// reviewer=false → 隐藏立项评估中的 AI 评估区域
// auditor=false → 隐藏编审 AI 审校报告
```

---

## 八、前端实现规则

1. **状态管理**：统一用 Zustand（保持 1.0 风格）
2. **API 调用**：复用 1.0 的 `api.ts` 模式（axios + baseURL）
3. **样式**：Tailwind CSS，和 1.0 一致
4. **编辑器**：复用 Monaco Editor 集成
5. **路由**：React Router v7，和 1.0 一致
6. **UI 语言**：所有面向用户的标签、按钮、提示文字用**中文**。代码中的变量名、API 字段名保持英文。任务卡中的「UI 标签」列就是用户最终看到的文字。

---

## 九、后端实现规则

1. **验证**：统一用 Zod（和 1.0 一致）
2. **鉴权**：复用 1.0 的 auth middleware
3. **路由风格**：保持 `/api/v2/...` 前缀
4. **错误格式**：保持 `{ success, data, error }` 格式

---

## 十、开发习惯

- **不要每卡一 commit** — 阶段性里程碑时一次性提交
- **不要出现「世界观」** — 统一用「作品设定」（AI Prompt 除外）
- **代码变量名用英文，UI 标签用中文**
- **不问「我要不要提交」** — 任务卡里写明提交时机

---

## 十一、VPS 开发规范

> 与 Claude 对齐：`docs/plan/ALIGNMENT-2026-06-02.md`  
> 复盘：`docs/tasks/REPORT-TASK-102-CREATIVE-GROUP-INCIDENT-2026-06-02.md`

### 11.1 后端

- `nodemon` 使用 `backend/nodemon.json`，**仅 watch `src/`**，排除 `data/`、`prisma/dev.db`
- 开发会话文件：`/tmp/novel-writer-sessions.json`（避免写项目目录触发重启）
- **后端重启后**内存/文件会话可能失效；前端须复检 token（见 `AuthGuard`）
- 生产域名 API：`Caddy` 将 `/api/*` 反代到 `127.0.0.1:5000`

### 11.2 前端

- **禁止**在 `useCallback` 依赖中放入 `useNotifications()` 返回的函数（已改为 Zustand + `useCallback` 稳定化）
- 列表页 `load`：`useEffect` 依赖仅 `[load]` 且 `load` 依赖稳定；或 `useRef` 存 `notifyError`
- **空数据**须显示引导文案（如「暂无讨论，点击新建」），勿长期停在「加载中…」
- 旧数据兼容：`Scrap.tags` 可能为 JSON 数组或逗号分隔字符串，统一经 `normalizeScrapTags` / `normalizeTagsField`
- `AuthGuard` 须在 **路由树内**（`Outlet`），并在 `location.pathname` 变化时复检 `/auth/status`

### 11.3 部署（novel.pf2008.com）

- **生产**：`Caddy` → `frontend/dist` 静态 + `/api` → `:5000`；**不要**与 Vite dev 混用
- `index.html` 配置 `Cache-Control: no-cache`（防旧 HTML 引用已删除的 lazy chunk）
- 发版后 **hard refresh**（`Ctrl+Shift+R`）验收；若 chunk 404，先清站点缓存
- 本地 dev：`frontend` 端口 3000，`vite` 代理 `/api` → 5000

### 11.4 提交前自测清单（Cursor）

```
□ cd backend && npm run build && cd ../frontend && npx tsc --noEmit && npm run build
□ hard refresh 后无 chunk 404
□ 后端重启后：未登录跳登录页；已失效 token 不显示「已通过认证」
□ 创意组各 Tab 空列表有引导文案，无无限「加载中」
□ 列表页 Network 无同一 API 刷屏
```

### 11.5 任务卡协作（Claude 出卡 / Cursor 执行）

| 侧 | 义务 |
|----|------|
| Claude | 任务卡末尾加「工程注意事项」；验收含持久化/边界/部署三类 |
| Cursor | 实现层问题先自查；非实现层出报告再讨论设计 |
| 双方 | 设计问题不用实现糊，实现问题不用设计补；信息互通 |

**原则**：各归各的，但对齐记录与参考文档保持更新。
