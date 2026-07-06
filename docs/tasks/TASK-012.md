# TASK-012（中枢卡）：`/work/:id` 统一作品详情页

> 前情：TASK-011 已完成地基改造（状态枚举/Collection 清理/Layout 导航/路由骨架）。当前可以通过五段导航到达各阶段页面，但各阶段间的作品详情散落在不同页面中。
> 目标：建立 `/work/:id` 作为全阶段共享的统一作品详情页，按 `status` 切换操作栏和行为。

---

## 前置状态

- `v2-dev` 分支，包含 TASK-011 的全部提交（状态枚举、Layout 五段导航、路由就位）
- `frontend/src/pages/WorkDetailPage.tsx` 已存在 **占位页**（TASK-011 创建）
- `frontend/src/pages/ShelfPage.tsx` 已存在 **占位页**（TASK-011 创建）
- `Project.status` 已完成 7 态收口：`draft | planning | writing | reviewing | completed | archived | shelved`
- 现有 `ProjectDetailPage.tsx` 仍有完整的章节列表 + 梗概 + 元数据面板，本卡复用其结构但不改动该文件
- 现有 `ChapterContentModal` / `ChapterPlanningEditor` / `ProjectMetadataPanel` / `ContentMetadataCard` 等组件可直接复用
- `WorldBuildingPage` 面板（`CharactersPanel` / `TimelinePanel` / `CreativeFlowPanel`）已有但在 VPS 上（TASK-006~010 产出）

## 约束

1. **只建新页，不拆旧页** — 新建 `WorkDetailPage.tsx` 替换占位，不动 `ProjectDetailPage.tsx` 等老页面（后续清理）
2. **复用已有组件** — ChapterContentModal、ChapterPlanningEditor、ContentMetadataCard 等直接 import，不改动
3. **按 status 驱动 UI** — 操作栏、侧栏、编辑权限全部由 `project.status` 决定
4. **保绿** — `tsc --noEmit` + 前端构建通过
5. **路由已就位** — `/work/:id` 路由已在 TASK-011 中配置，本卡只填充组件

---

## 任务

### 1. 后端：统一工作台 API

#### 1.1 新建 `/api/v2/work/:id` 聚合端点

新建 `backend/src/routes/work.ts`，返回单个作品的全量数据（避免前端发 N 个请求）：

```typescript
// GET /api/v2/work/:id
interface WorkDetailResponse {
  project: Project
  chapters: Chapter[]
  characters: Character[]
  timelineEntries: TimelineEntry[]
  creativeFlows: CreativeFlow[]
  proposal?: Proposal  // 如果 project 有关联 proposal
}
```

**实现要点：**
- `projectsApi.getById(id)` + `chaptersApi.getByProjectId(id)` + 角色/故事线/心流 一次查齐
- 如果 `project.status === 'draft'` 且 `project.metadata?.proposalId` 存在，附带加载 proposal
- 输出端调用 `mapProjectStatus(project.status)` 兼容旧值

#### 1.2 注册路由

`backend/src/app.ts`（或 routes 索引文件）：

```typescript
import { workRoutes } from './routes/work'
app.register(workRoutes, { prefix: '/api/v2/work' })
```

#### 1.3 章节框架轻量更新端点（已存在？）

检查 `PUT /api/v2/chapters/:id` 是否已支持更新 `title`、`summary`、`order`。如果已有，跳过。如果只有 content 更新，扩展为支持框架字段：

```typescript
// PUT /api/v2/chapters/:id  — 补充允许字段
schema: {
  title: z.string().optional(),
  summary: z.string().optional(),
  order: z.number().int().optional(),
  // ... 已有 content 等
}
```

> **为什么需要：** 详情页内的章节框架编辑（标题/梗概/排序）直接调这个端点，不进 Monaco 编辑器。

### 2. 前端：`WorkDetailPage.tsx`

#### 2.1 API 层

`frontend/src/services/api.ts` — 新增 workApi：

```typescript
export const workApi = {
  async getDetail(id: string): Promise<WorkDetailResponse> {
    const response = await api.get(`/work/${id}`)
    return response.data
  }
}

export interface WorkDetailResponse {
  project: Project
  chapters: Chapter[]
  characters: Character[]
  timelineEntries: TimelineEntry[]
  creativeFlows: CreativeFlow[]
  proposal?: Proposal
}
```

#### 2.2 页面整体结构

`frontend/src/pages/WorkDetailPage.tsx`：

```
┌─────────────────────────────────────────────────┐
│ ← 返回  [作品标题]  [状态标签]     [操作栏]     │  ← 顶部栏
├─────────────────────────────────────────────────┤
│  ┌─ Tab 导航 ───────────────────────────────┐  │
│  │ [作品设定] [章节列表] [元数据]            │  │  ← L3 子导航
│  └───────────────────────────────────────────┘  │
│                                                 │
│  ┌─ 内容区（按 activeTab 切换）────────────┐  │
│  │                                           │  │
│  │  作品设定 Tab → WorldBuilding 面板复用    │  │
│  │  章节列表 Tab → 章节框架管理              │  │
│  │  元数据 Tab   → ContentMetadataCard       │  │
│  │                                           │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

#### 2.3 顶部栏

```typescript
// 状态标签
const statusBadge = (
  <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
    {PROJECT_STATUS_LABEL[project.status] || project.status}
  </span>
)
```

**操作栏内容按 status 切换：**

| status | 操作按钮 |
|--------|---------|
| `draft` | [编辑作品设定]（如有关联 proposal 则显示提案数据，可编辑） |
| `planning` | [管理章节规划] [编辑元数据] |
| `writing` | [进入创作室]（首个有内容的章节 / 上次编辑的章节）[管理章节规划] |
| `reviewing` | 占位（以后放审阅操作） |
| `completed` | [导出] |
| `archived` | 无操作（纯展示） |
| `shelved` | [还原] [彻底删除] |

**"进入创作室"按钮逻辑：**
```typescript
// 定位到最近编辑的章节，或第一个有内容的章节，或第一章
const lastEdited = chapters.sort((a, b) => 
  new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
)[0]
const targetChapter = lastEdited || chapters[0]
// 按钮跳转：navigate(`/writing/${project.id}/${targetChapter.id}`)
```

#### 2.4 Tab 内容

**Tab 1：作品设定**（`activeTab === 'setting'`）
- 复用 TASK-006~010 的 WorldBuilding 面板（在 VPS 上）
- 包含：角色 / 故事线 / 创作心流 三个子面板
- **权限控制**：`draft` 阶段可编辑（调用 worldApi），其他阶段只读

如果 WorldBuilding 组件暂不可用（本地没有），先用占位文案：
```
作品设定（角色 / 故事线 / 创作心流）
— 数据已加载，组件在 VPS 上，下一轮同步后可见 —
```

**Tab 2：章节列表**（`activeTab === 'chapters'`）
- 复用 TASK-011 完成后 `ProjectDetailPage.tsx` 的章节列表渲染逻辑
- 列表项：`第 N 章 · 标题` + 字数 + 更新时间 + 状态标签
- 操作：每个章节行有 [梗概] [正文] [写作] 三个按钮
- **新增：章节框架行内编辑**
  - 点击章节标题 → 变为行内 `<input>`，失焦保存（调 `chaptersApi.update(id, { title })`）
  - 每个章节有拖拽手柄（预留，拖拽排序暂不做，用上下箭头替代）
  - [↑] [↓] 按钮调整 order（调 `chaptersApi.update(id, { order })`）

**Tab 3：元数据**（`activeTab === 'metadata'`）
- 复用 `ContentMetadataCard` 组件
- 如有编辑权限（`draft` / `planning`），显示编辑入口
- 无编辑权限时只读展示

#### 2.5 加载态与错误态

```typescript
if (loading) return <LoadingOverlay />
if (error || !data) return <ErrorState message={error} onBack={() => navigate('/')} />
if (!data.project) return <NotFoundState />
```

### 3. 前端：恢复页面不阻塞

`chapterPlanningEditor` 作为弹窗复用——点击"管理章节规划"弹出（与 `ProjectDetailPage` 现有一致的行为）。

### 4. 路由确认

TASK-011 已配置：
```typescript
{ path: '/work/:id', element: <WorkDetailPage /> }
```
本卡不需要改路由，只需要让 `<WorkDetailPage />` 不再是占位。

---

## 修改清单

### 后端（1~2 个文件）

| 文件 | 改动 |
|------|------|
| `backend/src/routes/work.ts` | **新建** — `/api/v2/work/:id` 聚合端点 |
| `backend/src/app.ts` | 注册 workRoutes |

### 前端（3~4 个文件）

| 文件 | 改动 |
|------|------|
| `frontend/src/pages/WorkDetailPage.tsx` | **重写** — 从占位页改为完整详情页 |
| `frontend/src/services/api.ts` | 新增 `workApi` + `WorkDetailResponse` 接口 |
| `frontend/src/services/api.ts` | 补充 `Character` / `TimelineEntry` / `CreativeFlow` / `Proposal` 接口定义（如缺失） |

### 依赖组件（复用不改）

| 组件 | 来源 | 用途 |
|------|------|------|
| `ChapterContentModal` | TASK-011 已有 | 查看章节梗概/正文弹窗 |
| `ChapterPlanningEditor` | TASK-011 已有 | 章节规划弹窗 |
| `ContentMetadataCard` | TASK-011 已有 | 元数据展示 |
| `ProjectMetadataPanel` | TASK-011 已有 | 元数据编辑弹窗 |
| `LoadingOverlay` | 已有 | 加载态 |
| `ErrorBoundary` | 已有 | 错误边界 |

---

## 验收标准

1. 访问 `/work/:id` 显示完整作品详情页（正确加载 project + chapters + characters + timeline + creative flows）
2. 顶部显示作品标题 + 状态标签（中文，如"暂存阁"）
3. 操作栏按 status 显示不同按钮：
   - `draft` → [编辑作品设定]
   - `planning` → [管理章节规划] [编辑元数据]
   - `writing` → [进入创作室] [管理章节规划]
   - `completed` → [导出]
   - `shelved` → [还原] [彻底删除]
4. 三个 Tab 可切换：作品设定 / 章节列表 / 元数据
5. 章节列表中每行可操作（梗概查看 / 正文查看 / 进入写作）
6. 章节标题行内可编辑（点击变 input，失焦保存）
7. [↑] [↓] 按钮调整章节排序
8. "进入创作室"按钮跳转到 `/writing/:projectId/:chapterId`
9. "管理章节规划"弹窗可正常打开和保存
10. `tsc --noEmit` 通过 + 前端构建成功
11. 从 `/creative/proposals/:id` 可以导航到 `/work/:id`（提案阶段）
12. 从 `/planning/projects` 列表点击作品可进入 `/work/:id`

---

## 提交

```
git add -A && git commit -m "feat: /work/:id 统一作品详情页 — 聚合 API + 按 status 操作栏 + 章节框架编辑 + 三 Tab 布局"
```
