# 执行指令：战役 A + B（含 §0 命名规范）

> 顺序：第一枪 → 战役 A（状态契约）→ 战役 B（提案隔离）
> `npm run build` 每步通过

---

## 第一枪：ProposalReviewPage filter + Badge 补 `creating`/`created`

### 1a. `frontend/src/services/api.ts` — ProposalStatusBadge 补新状态

在 `PROPOSAL_STATUS_LABEL`（:83-90）中新增：
```typescript
creating: '待提交',
created: '已提交',
```

### 1b. `frontend/src/pages/planning/ProposalReviewPage.tsx:29`

```typescript
// 改前
const submitted = useMemo(() => proposals.filter(p => p.status !== 'draft'), [proposals])

// 改后
// 兼容 canonical + legacy：已提交审阅（含 evaluated、created）且未审批
const submitted = useMemo(
  () => proposals.filter(p => {
    const s = p.status
    return (s === 'submitted' || s === 'evaluated' || s === 'created')
      && s !== 'approved'
  }),
  [proposals]
)
```

> 先做这个是为了立刻解决「approved 提案出现在待评估列表」的问题。战役 A 完整映射层落地后再统一换 helper。

---

## 战役 A — 状态契约统一

### A1. 新建 `frontend/src/services/status-migration.ts`

镜像后端 `backend/src/services/status-migration.ts`：

```typescript
/**
 * 前端状态映射 — 与后端 status-migration.ts 一一对应
 * 所有 proposalsApi / projectsApi ingest 层统一应用
 */

export const PROJECT_STATUS_MAP: Record<string, string> = {
  imported: 'imported',
  published: 'reviewed',
  pooled: 'shelved',
  trashed: 'shelved',
  draft: 'planning',
  completed: 'reviewed',
}

export const PROPOSAL_STATUS_MAP: Record<string, string> = {
  draft: 'creating',
  submitted: 'created',
  evaluated: 'created',
  rejected: 'creating',
  approved: 'approved',
  shelved: 'shelved',
}

export function mapProjectStatus(status: string): string {
  return PROJECT_STATUS_MAP[status] ?? status
}

export function mapProposalStatus(status: string): string {
  return PROPOSAL_STATUS_MAP[status] ?? status
}
```

### A2. 新建 `frontend/src/services/statusLabels.ts` — §0 分阶段 label

```typescript
import { mapProjectStatus } from './status-migration'

export type PhaseContext = 'planning' | 'studio' | 'editorial' | 'library'

/**
 * 按阶段上下文返回 project 状态标签
 * §0 约定：同一 status 在不同阶段显示不同标签
 */
export function getProjectStatusLabel(status: string, phase: PhaseContext): string {
  const s = mapProjectStatus(status)

  if (phase === 'planning') {
    switch (s) {
      case 'planning': return '审核中立项作品'
      case 'planned':  return '已立项作品'
      default:         return s
    }
  }
  if (phase === 'studio') {
    switch (s) {
      case 'planned':  return '待创作作品'
      case 'writing':  return '创作中作品'
      case 'written':  return '已创作作品'
      default:         return s
    }
  }
  if (phase === 'editorial') {
    switch (s) {
      case 'writing':  return '待审阅作品'
      case 'reviewing': return '审阅中作品'
      case 'reviewed':  return '已审阅作品'
      default:          return s
    }
  }
  if (phase === 'library') {
    switch (s) {
      case 'archived':  return '已归档作品'
      default:          return s
    }
  }

  return s
}

export function getProposalStatusLabel(status: string): string {
  const s = mapProposalStatus(status)
  const labels: Record<string, string> = {
    creating: '待提交',
    created: '已提交',
    approved: '已通过评估',
    rejected: '已驳回',
    shelved: '作品暂存',
  }
  return labels[s] ?? s
}
```

### A3. 新建 `frontend/src/services/filters.ts` — 统一过滤 helper

```typescript
import { mapProposalStatus, mapProjectStatus } from './status-migration'
import type { Proposal, Project } from './api'

/** 提案是否处于「可提交到企划课评估」的状态 */
export function isProposalSubmittable(p: Proposal): boolean {
  const s = mapProposalStatus(p.status)
  return s === 'creating'
}

/** 提案是否处于「企划课待评估」状态 */
export function isProposalPendingReview(p: Proposal): boolean {
  const s = mapProposalStatus(p.status)
  return (s === 'created' || s === 'submitted' || s === 'evaluated') && s !== 'approved'
}

/** 提案是否已审批通过 */
export function isProposalApproved(p: Proposal): boolean {
  return mapProposalStatus(p.status) === 'approved'
}

/** Project 是否处于企划课阶段 */
export function isProjectPlanning(p: Project): boolean {
  const s = mapProjectStatus(p.status)
  return s === 'planning' || s === 'planned'
}

/** Project 是否处于创作室阶段 */
export function isProjectStudio(p: Project): boolean {
  const s = mapProjectStatus(p.status)
  return s === 'planned' || s === 'writing' || s === 'written'
}
```

### A4. `frontend/src/services/api.ts` — proposalsApi ingest 映射

在 `proposalsApi.getAll`（:849）和 `getById` 加映射：

```typescript
// getAll 内，map 后返回
async getAll(): Promise<Proposal[]> {
  const response = await api.get('/proposals')
  return (response.data || []).map((p: any) => ({
    ...p,
    metadata: p.metadata || {},
  }))
},
```

> **注意**：Proposal API 当前不做 status 映射（后端返回原始值），所以前端 ingest 不需要 map。等后端 `withMappedProposalStatus` 对齐后，在 ingest 层加 `status: mapProposalStatus(p.status)`。

### A5. 替换散落 filter — 分批

**第一批（紧邻第一枪）**：
- `ProposalReviewPage.tsx:29` → 用 `isProposalPendingReview`
- `PlanningProposal.tsx:36-40` → 用 `isProposalSubmittable` / `isProposalPendingReview`
- `CreativeDiscussion.tsx:15,22` → 用 `isProposalSubmittable`

**第二批**：
- `dashboard.ts:71-82` → 用 mapped filter
- `MetadataListPage.tsx:35` → 补 `planned`/`written`/`reviewed`

---

## 战役 B — 提案阶段隔离

### B1. Layout 改名（3 处）

| 文件 | 行 | 当前 | 改为 |
|------|-----|------|------|
| `Layout.tsx` | 41 | 企划建议书 | **创意提案** |
| `Layout.tsx` | 52 | 企划建议书 | **企划建议书评估** |
| `CreativePage.tsx` | 7 | 企划建议书 | **创意提案** |

### B2. `ProjectStatusBadge.tsx` — 加 `phase` prop

```typescript
// 改前
export default function ProjectStatusBadge({ status }: { status: Project['status'] })

// 改后
export default function ProjectStatusBadge({ status, phase }: { status: Project['status']; phase?: PhaseContext })
```

渲染用 `getProjectStatusLabel(status, phase || 'studio')` 替代 `PROJECT_STATUS_LABEL[status]`。

在调用点加 `phase`：
- `PlanningProjectsPage.tsx` → `phase="planning"`
- `WritingProjectsPage.tsx` → `phase="studio"`
- `ProjectPickerView.tsx` → 传入或默认

### B3. `PlanningProposal.tsx` — 移除 evaluate 弹窗

- 删「评估」按钮（~:120-124）
- 删 `handleEvaluate` 中 reject/shelve 分支
- 删弹窗 JSX（~:165-213）
- 保留列表只读 +「送审」+ 链接到详情
- 可选：保留 `submitToReview` 按钮

### B4. `ProposalEvalPage.tsx` — 补 reject/shelve

当前仅有 approve（:63）+ `updateStatus('draft')` 退回（:49）。改为：

- 退回按钮（:49）改调 `proposalsApi.reject()`：需先在 `api.ts` 加：
  ```typescript
  async reject(id: string, note?: string): Promise<Proposal> {
    const response = await api.post(`/proposals/${id}/reject`, { note })
    return response.data
  },
  ```
- 补「暂存审查池」shelve 功能
- 删除 `updateStatus('draft')` 调用

### B5.「查看作品」链接（`PlanningProposal.tsx:147-150`）

加 `approved` 判断：
```typescript
// 改前
{p.projectId ? <Link ...>查看作品</Link> : ...}

// 改后
{isProposalApproved(p) && p.projectId ? <Link ...>查看作品</Link> : ...}
```

---

## 验证路径

修完后用这条金路径回归：

```
创意讨论 → 提交 → 企划课 /planning/proposals → 列表正确显示（approved 不在内）
→ /planning/proposals/:id approve → /work/:id?from=planning → 徽章「审核中立项作品」
→ 正式立项 → /planning/projects → 徽章「已立项作品」
→ 开始写作 → /writing/projects → 徽章「待创作作品」
→ 编辑器 → 返回 → /writing/projects → 徽章「创作中作品」
```

---

## 执行顺序

```
Step 0: 第一枪（ProposalReviewPage filter + Badge）
Step 1: A1 + A2 + A3（三个新文件）
Step 2: A4 + A5（ingest + 替换 filter）
Step 3: npm run build
Step 4: B1 + B2（Layout 改名 + Badge phase prop）
Step 5: B3 + B4 + B5（创意组降级 + 企划课补能力）
Step 6: npm run build
```
