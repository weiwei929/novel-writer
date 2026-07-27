# TASK-011（地基卡）：状态枚举 + 模型清理 + Layout 改造

> 前情：TASK-006~010 已完成创意组→企划课提案链路。后续编辑器卡（TASK-013）依赖正确的导航骨架和状态枚举。
> 目标：一次性把 2.0 的地基打稳，后续卡只增不减。

---

## 前置状态

- `v2-dev` 分支，包含 `7ebfdaf`（TASK-010）在内的全部提交
- 本地（Claude）与 VPS（Cursor）已通过对齐简报（`ALIGNMENT-2026-06-01.md`），全盘方向已确认
- `Project.status` 当前为 `String`，代码中存在 `draft/writing/completed/archived/imported/published` 等值
- `Proposal.status` 当前为 `String`，代码中存在 `draft/submitted/evaluated/approved/rejected`
- Collection 在导入流程和转入创作流程中有硬编码（"导入文集"/"原创构思"）
- Layout 导航仍是 1.0 平铺结构
- 部分代码中仍有「世界观」文案残留

## 约束

1. **结构性改造，行为保持等价** — 本卡改造数据模型和导航骨架，不改业务行为。存量数据兼容，旧值映射为新值
2. **兼容存量数据** — 旧状态值不直接丢弃，通过映射层翻译
3. **保绿** — `tsc --noEmit` + 前端/后端构建通过

---

## 任务

### 1. 状态枚举收口

#### 1.1 前端唯一状态源

在 `frontend/src/services/api.ts` 中定义，**直接替换现存的 status 字面量类型**，避免双源问题：

```typescript
// ===== 状态枚举（唯一源） =====
export const PROJECT_STATUSES = [
  'draft',       // 创意阶段（草稿）
  'planning',    // 企划阶段（已立项）
  'writing',     // 创作阶段（写作中）
  'reviewing',   // 审阅阶段（编审中）
  'completed',   // 已完成
  'archived',    // 已归档（文集库）
  'shelved',     // 暂存阁（软删除）
] as const

export type ProjectStatus = typeof PROJECT_STATUSES[number]

export const PROPOSAL_STATUSES = [
  'draft',
  'submitted',
  'evaluated',
  'approved',
  'rejected',
  'shelved',
] as const

export type ProposalStatus = typeof PROPOSAL_STATUSES[number]

export const PROJECT_STATUS_LABEL: Record<string, string> = {
  draft:     '草稿',
  planning:  '企划中',
  writing:   '创作中',
  reviewing: '审阅中',
  completed: '已完成',
  archived:  '已归档',
  shelved:   '暂存阁',
}
```

现有 `Project` 和 `Proposal` 接口中的 `status` 字段类型改为引用 `ProjectStatus` / `ProposalStatus`，**移除** `'imported' | 'published'` 等旧字面量。

#### 1.2 后端 Prisma schema

```prisma
// Project.status 注释更新
status String @default("draft") // draft | planning | writing | reviewing | completed | archived | shelved

// Proposal.status 注释更新（如果已有）
status String @default("draft") // draft | submitted | evaluated | approved | rejected | shelved
```

> Prisma SQLite 不支持 enum，String + 注释约束就够了。前后端一致性通过 Zod 白名单保证。

#### 1.3 后端 Zod 验证

`backend/src/routes/projects.ts`：

```typescript
status: z.enum(['draft', 'planning', 'writing', 'reviewing', 'completed', 'archived', 'shelved']).optional()
```

`backend/src/routes/proposals.ts` 同理，用 `PROPOSAL_STATUSES` 白名单。

> **注意：** `imported` 不再是合法状态值。导入的作品创建时 status 直接用 `draft`。

### 2. 兼容映射层

**关键：明确接入点**，否则映射层建了没人调，前端仍收旧值。

#### 2.1 后端映射

新建 `backend/src/services/status-migration.ts`：

```typescript
// 存量数据兼容映射 — 集中管理，不散落在页面
const PROJECT_STATUS_MAP: Record<string, string> = {
  imported:  'draft',     // 导入的 → 草稿
  published: 'completed', // 已发布 → 已完成
  pooled:    'shelved',   // 审查池 → 暂存阁
  trashed:   'shelved',   // 回收站 → 暂存阁
}

export function mapProjectStatus(status: string): string {
  return PROJECT_STATUS_MAP[status] || status
}
```

**映射层接入点（卡里必须写死，否则就是死代码）：**

| 接入点 | 位置 | 改动 |
|--------|------|------|
| GET /projects | projects.ts 列表查询后 | `data.map(p => ({...p, status: mapProjectStatus(p.status)}))` |
| GET /projects/:id | projects.ts 详情查询后 | `status: mapProjectStatus(project.status)` |
| PUT /projects/:id | projects.ts 更新前 | `body.status = mapProjectStatus(body.status)` |
| 导入流程 POST /import | projects.ts | 创建时直接 `status: 'draft'`，不再写 `imported` |
| 转入创作 POST /move-to-draft | projects.ts | 废弃该端点（见 3.5） |

#### 2.2 前端映射

前端 `getStatusLabel` 已涵盖新值（定义在 `api.ts` 中）。旧值不会被后端发出（后端的映射层在出口处拦截），但为防缓存等边界情况，`getStatusLabel` 降级为入参原样返回即可。

### 3. Collection 前置依赖移除

#### 3.1 后端：移除硬编码 Collection

`backend/src/routes/projects.ts`：

- **导入流程**（POST `/import`）：移除"查找/创建导入文集"逻辑。直接创建 Project，`collectionId` 留空，`status` 设为 `draft`
- **`CreateProjectSchema`**：移除对 `collectionId` 的依赖

#### 3.2 前端：创建作品不再关联 Collection

`frontend/src/components/projects/CreateProjectModal.tsx`：
- 移除"所属文集"下拉框
- 移除 `collections: Collection[]` prop
- 提交 body 中移除 `collectionId`

`frontend/src/components/projects/ProjectsList.tsx`：
- 移除 `selectedCollection` 状态、`collectionId` URL 参数读取逻辑
- 移除 `collectionsApi.getAll()` 调用（本页不再需要文集数据）
- 不再向 `CreateProjectModal` 传 `collections` prop

#### 3.3 KanbanBoard 移除 imported 列

`frontend/src/components/projects/KanbanBoard.tsx`：
- 移除 `columns.imported` 定义
- 移除 `imported` 列的渲染区块
- 导入作品现在归类到 `draft` 列

#### 3.4 导入文案调整

`frontend/src/components/FileImportExport/FileImportExport.tsx`：
- "已存入《导入文集》" → "作品已导入，状态为草稿"

`frontend/src/components/import/ImportedProjectCard.tsx`：
- 移除"导入文集"相关文案

#### 3.5 move-to-draft 端点废弃

导入后直接 status = `draft`，不再需要"转入创作"中转。`POST /:id/move-to-draft` 端点**保留但做空操作返回 410 Gone**，确保旧流程调用方不报错。前端 `ImportedProjectCard` 中的"转入创作"按钮移除。

### 4. Layout 导航改造

#### 4.1 主导航改为五段管道

`frontend/src/components/Layout.tsx`（或新建 `frontend/src/components/layout/MainNav.tsx`）：

```typescript
const mainNav = [
  { path: '/creative', label: '创意组', icon: Lightbulb },
  { path: '/planning', label: '企划课', icon: ClipboardList },
  { path: '/writing',  label: '创作室', icon: PenSquare },
  { path: '/review',   label: '编审部', icon: Search },
  { path: '/library',  label: '文集库', icon: Archive },
]
```

完全移除旧的 8 项平铺导航。`/editor` 路径仍然全屏不显示导航。

#### 4.2 右上角全局入口

Layout 右上角加入（不占主导航位）：

```typescript
const globalActions = [
  { path: '/stats',    icon: BarChart3, title: '数据统计' },
  { path: '/settings', icon: Settings,  title: '系统设置' },
  { path: '/shelf',    icon: Archive,   title: '暂存阁' },
]
```

#### 4.3 旧页面保留不动

`HomePage.tsx` 和 `CollectionsPage` 在 TASK-014/文集库阶段再改。

### 5. 路由变更

#### 5.1 App.tsx 路由表

```typescript
const routes = [
  // 主页（TASK-014 再改内容）
  { path: '/', element: <HomePage /> },

  // 五阶段
  { path: '/creative/*', element: <CreativePage /> },
  { path: '/planning/*', element: <PlanningPage /> },
  { path: '/writing/*', element: <WritingPage /> },
  { path: '/writing/:projectId/:chapterId', element: <WritingEditorPage /> },
  { path: '/review/*', element: <ReviewPage /> },
  { path: '/library/*', element: <LibraryPage /> },

  // 中枢路由（占位，TASK-012 填内容）
  { path: '/work/:id', element: <WorkDetailPage /> },

  // 全局功能
  { path: '/settings', element: <SettingsPage /> },
  { path: '/stats', element: <StatsPage /> },
  { path: '/shelf', element: <ShelfPage /> },

  // 兼容重定向 — 沿用现有 EditorFallback 模式，<Navigate> 静态传参无法替换参数
  // EditorFallback 已在 App.tsx 中定义（useParams + <Navigate>），复用同一模式
  { path: '/editor/:projectId/:chapterId', element: <EditorWritingRedirect /> },
  { path: '/editor/:projectId', element: <EditorWritingRedirect /> },
  { path: '/editor', element: <Navigate to="/writing/projects" replace /> },

  // 1.0 旧路由降级
  { path: '/collections', element: <Navigate to="/" replace /> },
  { path: '/projects', element: <Navigate to="/" replace /> },
  { path: '/projects/:id', element: <Navigate to="/" replace /> },
  { path: '/scraps', element: <Navigate to="/" replace /> },
  { path: '/files', element: <Navigate to="/" replace /> },
]
```

#### 5.2 重定向组件

```typescript
// 用于 /editor/* → /writing/* 的兼容跳转
const EditorWritingRedirect: React.FC = () => {
  const { projectId, chapterId } = useParams()
  if (chapterId) return <Navigate to={`/writing/${projectId}/${chapterId}`} replace />
  if (projectId) return <Navigate to={`/writing/${projectId}`} replace />
  return <Navigate to="/writing/projects" replace />
}
```

沿用 1.0 `EditorFallback` 的 `useParams` + `Navigate` 模式，不走静态字符串。

#### 5.3 占位页

新建 `frontend/src/pages/WorkDetailPage.tsx` 和 `frontend/src/pages/ShelfPage.tsx`，输出占位。

### 6. 文案治理

搜索并替换 UI 标签中的「世界观」→「作品设定」：

| 文件 | 改动 |
|------|------|
| `frontend/src/components/metadata/ContentMetadataCard.tsx` | "世界观/设定"→"作品设定" |
| `frontend/src/components/editor/ProjectMetadataPanel.tsx` | "世界观/设定"→"作品设定" |
| `frontend/src/components/import/MetadataReviewModal.tsx` | "世界观"→"作品设定" |
| `frontend/src/components/writer/AIAssistantPanel.tsx` | "存为世界观"→"存为作品设定" |
| `frontend/src/types/version.ts` | `worldSetting` 字段名保持英文不动，关联注释更新 |
| `backend/src/services/ai/PromptManager.ts` | 文案带"世界观"的提示词暂不动（AI 输出行为需单独验证） |
| `backend/src/services/ai/ContextManager.ts` | 同上 |

### 7. 其他需要更新的文件（补充遗漏）

| 文件 | 改动 |
|------|------|
| `frontend/src/components/projects/ProjectStatusBadge.tsx` | 状态标签改为引用 `PROJECT_STATUS_LABEL`，移除 `imported`/`published` 分支 |
| `frontend/src/components/projects/ProjectCard.tsx` | 移除 `imported` 状态的颜色/label 映射 |
| `frontend/src/pages/ProjectDetailPage.tsx` | 顶部状态标签引用新枚举 |
| `frontend/src/pages/EnhancedEditorPage.tsx` | 顶部状态标签引用新枚举 |
| `frontend/src/services/api.ts` | `getImportedProjects()` 改为返回所有 `status: 'draft'` 的作品（原 `filter(p => p.status === 'imported')`） |
| `frontend/src/components/chapters/ChapterManager.tsx` | 如有旧路径硬编码，更新 |

---

## 修改清单（完整版）

### 后端（4 个文件）

| 文件 | 改动 |
|------|------|
| `backend/prisma/schema.prisma` | Project/Proposal status 注释更新 |
| `backend/src/routes/projects.ts` | Zod 枚举更新；导入流程移除 Collection 硬编码；所有 GET/PUT 出口接入 `mapProjectStatus` |
| `backend/src/routes/proposals.ts` | Zod 枚举更新 |
| `backend/src/services/status-migration.ts` | **新建** — 兼容映射层 + 接入点列表 |

### 前端（18 个文件）

| 文件 | 改动 |
|------|------|
| `frontend/src/services/api.ts` | **关键** — 定义 PROJECT_STATUSES / PROPOSAL_STATUSES 常量 + 类型 + label 映射；替换旧字面量 |
| `frontend/src/App.tsx` | 路由表更新 + `EditorWritingRedirect` 组件 + 重定向 |
| `frontend/src/components/Layout.tsx` | 五段导航 + 右上角 globalActions |
| `frontend/src/pages/WorkDetailPage.tsx` | **新建** — 占位 |
| `frontend/src/pages/ShelfPage.tsx` | **新建** — 占位 |
| `frontend/src/components/projects/CreateProjectModal.tsx` | 移除 Collection 下拉框 + collections prop |
| `frontend/src/components/projects/ProjectsList.tsx` | 移除 Collection 筛选 + 不再传 collections |
| `frontend/src/components/projects/KanbanBoard.tsx` | 移除 `imported` 列 |
| `frontend/src/components/projects/ProjectStatusBadge.tsx` | 引用新枚举，移除旧状态分支 |
| `frontend/src/components/projects/ProjectCard.tsx` | 移除 `imported` 状态颜色/label |
| `frontend/src/components/import/ImportedProjectCard.tsx` | 移除"转入创作"按钮 + 文案调整 |
| `frontend/src/components/FileImportExport/FileImportExport.tsx` | 文案调整 |
| `frontend/src/pages/ProjectDetailPage.tsx` | 状态标签引用新枚举 |
| `frontend/src/pages/EnhancedEditorPage.tsx` | 状态标签引用新枚举 |
| `frontend/src/components/metadata/ContentMetadataCard.tsx` | "世界观"→"作品设定" |
| `frontend/src/components/editor/ProjectMetadataPanel.tsx` | "世界观/设定"→"作品设定" |
| `frontend/src/components/import/MetadataReviewModal.tsx` | "世界观"→"作品设定" |
| `frontend/src/components/writer/AIAssistantPanel.tsx` | "存为世界观"→"存为作品设定" |

### 文档

| 文件 | 备注 |
|------|------|
| `docs/tasks/CURSOR_REFERENCE.md` | 已更新 ✅ |

---

## 验收标准

1. `tsc --noEmit` 通过（前端 + 后端）
2. 前端构建成功
3. 导航栏显示五段管道 + 右上角三个图标
4. 创建作品弹窗不再有"所属文集"字段
5. 导入作品后状态为 `draft`，不再自动绑 Collection
6. `ImportedProjectCard` 不再显示"转入创作"按钮
7. KanbanBoard 不再显示 `imported` 列
8. **状态映射验收**：任意旧状态数据读取后，前端看到的必须是新状态集合之一（如 `imported` → "草稿"）
9. **路由兼容验收**：从任意旧 `/editor/*`、`/projects/*` 链接进入，不得出现 404 或字面量参数路径
10. **去 Collection 验收**：新建作品不再请求 collections；项目列表不再依赖 collection query param
11. 访问 `/work/:id` 显示占位页
12. 访问 `/editor/:projectId/:chapterId` 重定向到 `/writing/:projectId/:chapterId`
13. 用户可见文案中不再含「世界观」字样（AI Prompt 除外）

---

## 提交

```
git add -A && git commit -m "feat: 2.0 地基 — 状态枚举收口/Collection 清理/Layout 改造/文案治理"
```

---

## 开工前必读

1. `ALIGNMENT-2026-06-01.md` — 2.0 全景对齐
2. `docs/tasks/CURSOR_REFERENCE.md` — 编码规范与数据模型参考

改完跑 `tsc --noEmit` + 构建，保绿再提交。
