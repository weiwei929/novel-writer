# 2.0 实现规范 — Cursor 参考手册

> 用途：Cursor 开发 2.0 时的编码规范、架构约定、数据模型参考
> 本文件不是任务卡，是所有任务卡的基础参考

---

## 一、项目信息

| 项目 | 值 |
|------|-----|
| 栈 | Vite + React 18 + TypeScript + Tailwind CSS + Zustand + Monaco Editor |
| 后端 | Fastify 5 + Prisma 6 + SQLite + Zod + TypeScript |
| 包管理 | npm（两套：`frontend/package.json` + `backend/package.json`） |
| 2.0 目录 | `/root/novel-writer-2.0/`（VPS），与 1.0 隔离 |
| 端口 | 开发 3001，生产待定 |

---

## 二、分支策略

- `master` — 1.0 线上版本，不动
- `v2-dev` — 2.0 开发分支
- 2.0 代码在 `v2-dev` 上开发，完成后合入 `master`

---

## 三、四级导航结构

```
L1 主导航（5项，顶部 Tab 栏）
[创意组] [企划课] [创作室] [编审部] [文集库]

L2 子导航（仅创意组/企划课有，Tab 切换）
创意组: [外来参考] [灵感碎片] [AI搜索] [创意讨论] [企划建议书]
企划课: [企划建议书评估] [作品内容元数据] [立项评估] [立项作品]

L3 作品级（列表 → 详情页）
子 Tab → 作品名称列表 → 点击 → 详情页

L4 章节级（仅创作室）
编辑器 + 参考面板
```

### 路由结构对应

```
/creative           → 创意组 L1
/creative/references    → 外来参考 L2
/creative/scraps        → 灵感碎片 L2
/creative/ai-search     → AI 搜索 L2
/creative/chat          → 创意讨论 L2
/creative/proposals     → 企划建议书 L2
/creative/proposals/:id → 企划建议书详情 L3

/planning           → 企划课 L1
/planning/proposals    → 企划建议书评估 L2（仅列已提交提案）
/planning/proposals/:id → 企划建议书评估详情 L3（只读）
/planning/metadata     → 作品内容元数据 L2
/planning/metadata/:id → 作品详情 L3
/planning/evaluation   → 立项评估 L2
/planning/projects     → 立项作品 L2

/writing            → 创作室 L1
/writing/projects      → 创作中作品列表 L3
/writing/:projectId/:chapterId → 编辑器 L4

/review             → 编审部 L1
/review/projects       → 待审作品列表 L3
/review/:projectId     → 审阅工作台

/library            → 文集库 L1
/library/projects      → 归档作品列表
/library/stats         → 统计仪表盘
```

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

---

## 五、关键数据模型

### 5.1 现有模型（复用，不修改）

```prisma
// Project - 扩充 status
model Project {
  id          String   @id @default(uuid())
  title       String
  description String?
  author      String?
  coverImage  String?
  status      String   @default("draft")  // draft | planning | writing | reviewing | completed | archived | pooled | trashed
  wordCount   Int      @default(0)
  metadata    Json?    // 保留现有结构
  tags        Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  collectionId String?
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

// Character - 扩展（TASK-006 新增字段）
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
  // 归属双锚点（TASK-008）：proposalId（提案阶段）/ projectId（立项后），应用层 XOR
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

// Collection - 语义重定义为"文集"
model Collection {
  id          String    @id @default(uuid())
  name        String
  description String?
  projects    Project[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

### 5.2 新增模型

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

// 故事线（TASK-006 新增）
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
  // 归属双锚点（TASK-008）：proposalId / projectId，应用层 XOR
  projectId       String?
  project         Project?  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  proposalId      String?
  proposal        Proposal? @relation(fields: [proposalId], references: [id], onDelete: Cascade)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

// 创作心流（TASK-006 新增）
model CreativeFlow {
  id              String   @id @default(uuid())
  title           String
  content         String    // Markdown 正文
  tags            Json?     // 标签
  // 归属双锚点（TASK-008）：proposalId / projectId，应用层 XOR
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
  status      String   @default("draft") // draft | submitted | evaluated | approved | rejected
  references  Json?    // 引用的外来参考/碎片ID列表
  sourceNotes String?  // 来源讨论记录
  projectId   String?  // 被采纳后关联到立项项目
  project     Project? @relation(fields: [projectId], references: [id])

  // 作品设定子表（提案阶段挂在 proposalId 下；立项后 re-key 到 projectId）
  characters      Character[]
  timelineEntries TimelineEntry[]
  creativeFlows   CreativeFlow[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// 审核池 & 回收站（统一的状态管理）
// 不新增模型，通过 Project.status 和 Proposal.status 扩展值管理
// status: "pooled" = 审查池, "trashed" = 回收站

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

---

## 六、UI 命名规范

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
│   ├── CreativePage.tsx     ← 创意组页面（内嵌子Tab）
│   ├── PlanningPage.tsx     ← 企划课页面
│   ├── WritingPage.tsx      ← 创作室页面
│   ├── WritingEditorPage.tsx ← 编辑器页面（L4）
│   ├── ReviewPage.tsx       ← 编审部页面
│   └── LibraryPage.tsx      ← 文集库页面
└── services/
    └── api.ts               ← 扩展 API 方法
```

### 路由配置

```typescript
// App.tsx 路由结构
const routes = [
  { path: '/creative/*', element: <CreativePage /> },
  { path: '/planning/*', element: <PlanningPage /> },
  { path: '/writing/*', element: <WritingPage /> },
  { path: '/writing/:projectId/:chapterId', element: <WritingEditorPage /> },
  { path: '/review/*', element: <ReviewPage /> },
  { path: '/library/*', element: <LibraryPage /> },
]
```

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

---

## 九、后端实现规则

1. **验证**：统一用 Zod（和 1.0 一致）
2. **鉴权**：复用 1.0 的 auth middleware
3. **路由风格**：保持 `/api/v2/...` 前缀
4. **错误格式**：保持 `{ success, data, error }` 格式
