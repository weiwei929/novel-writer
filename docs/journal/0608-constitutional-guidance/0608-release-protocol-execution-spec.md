# 0608-release-protocol-execution-spec.md — 放行协议执行规格（最小 diff / 零迁移）

> **文档角色**：把 `0608-release-protocol.md`（语义）+ `0608-amendment-org-tier-model.md`（放行模型 A）+ `0608-audit-pipeline-handoff.md`（缺陷）翻译成**逐文件、逐枪、可直接发给 Cursor 执行**的最小改动规格。
> **优先级**：P1 执行规格。
> **状态**：Spec v1.1（2026-06-11）— **可逐枪执行**（当前：枪0 docs → 枪1 → 枪2 进行中）
> **基线**：HEAD `8f165d6` + 当前工作树。`npx tsc --noEmit` 干净通过。

---

## §0 总原则

1. **零数据库迁移**：放行标记一律写入 `Project.metadata`（JSON），不新增 Prisma 列。归档复用**已存在**的 `archivedAt` 列。
2. **放行不改 status**（模型 A）：放行只写 metadata 时间戳。下游"待处理"过滤 = 上游完成态 + 放行标记。
3. **每枪小而可审**（原则 #10）：7 枪，每枪 1~2 文件、可独立构建、可独立验收、可随时停。
4. **修正既有错误**：`release-protocol.md §1.1/§2.2` 提议用 `greenlitAt/currentDept` 区分放行——但 `greenlitAt` 已被 `confirm-greenlight`（确认企划完成）占用，`currentDept` 列不存在。本规格以本文为准：统一用 metadata 键。

### 放行标记键（写入 `Project.metadata`）

| 键 | 含义 | 写入端点 |
|----|------|---------|
| `_releasedToStudioAt` | 企划课已放行至创作室 | `release-to-studio` |
| `_releasedToEditorialAt` | 创作室已放行至编审部 | `release-to-editorial` |
| `_releasedToLibraryAt` | 编审部已放行至文集库 | `release-to-library` |

### 文案约定（Codex 复盘 2026-06-11 确认）

> **架构层 / 端点名 / metadata 键**用 `release` / `handoff`（交接事实）。
> **UI 用户文案一律用「提交」**，不回到"放行"这类工程/审批味的词：
> - 按钮：`提交创作室` / `提交编审部` / `提交文集库`
> - toast：`已提交创作室` / `已提交编审部` / `已提交文集库`

后端 `ApiResponse` 文案不直接面向用户（前端用自有 toast 覆盖），保持 `release` 语义即可。

---

## §1 枪表总览

| 枪 | 目标 | 缺陷项 | 文件数 | 规模 | 依赖 |
|---|------|-------|:--:|------|------|
| 枪0 | 固化当前工作树为可审 commit | 治理 | — | 仅 commit，0 逻辑 | 无 |
| 枪1 | 企划课「退回企划中」可用 | H02 | 1 | 1 词 | 无 |
| 枪2 | 编审部/文集库待处理标签 | H05 | 1 | 3 行 | 无 |
| 枪3 | 文集库「归入文集库」可用 | H01 | 3 | 1 端点+2 接线 | 无 |
| 枪4 | 3 个放行后端端点 + api 包装 | H03 | 2 | 3 端点+3 包装 | 无 |
| 枪5 | 4 处放行按钮接真实端点 | H03 | 4 | 每文件 1~2 行 | 枪4 |
| 枪6 | 下游放行门禁过滤 + 按钮去重 | H04 | 4 | 每文件 1~2 行 | 枪4/5 |
| 枪7 | 清死代码 + 同步 stale 文档 | D01/D02/D03 | 3 | 删除+文档 | 无 |

枪1~枪3 互相独立，可任意顺序、单独发。枪4→枪5→枪6 有依赖链。

---

## §2 枪0 — 固化工作树（治理前置，无逻辑改动）

当前约 50 文件大重构停留在未提交工作树（违反封版复盘 §5）。建议按层切成可审 commit，**不改任何代码**：

```
commit A  docs: 0608 本轮修正案 + 审计（constitutional-guidance/*）
commit B  refactor(frontend): WorkDetailPage 四区 + 双态编辑 + 内容模型
commit C  refactor(frontend): 删除流程决策组件（work/*Actions, StageTransitionModal, ChapterPlanningEditor, ProjectMetadataPanel）
commit D  feat(frontend): 五部门列表页流程动作（Writing/Editorial/Library/Planning Page）
commit E  chore(frontend): statusLabels / departments / api 调整
```

**验收**：`git status` 干净；`npx tsc --noEmit` 通过；`npx vite build` 通过。

---

## §3 枪1 — H02 企划课「退回企划中」

**文件**：`backend/src/middleware/stage-guard.ts`

```diff
  export const IN_BUCKET_TRANSITIONS: Record<string, readonly string[]> = {
    planning: ['planning'],
    writing: ['writing'],
    written: [],
    reviewing: ['reviewed', 'reviewing', 'completed'],
    reviewed: ['reviewing'],
    completed: ['reviewing'],
    imported: [],
-   planned: [],
+   planned: ['planning'],   // 0608 原则#4：允许部门内退回 planned→planning
    archived: [],
  }
```

前端 `PlanningPage.tsx` / `PlanningProjectsPage.tsx` 已调用 `transition(id, 'planning')`，无需改动。

**验收**：企划课已完成区点「退回企划中」→ 作品回到企划进行中，无"操作失败"。

---

## §4 枪2 — H05 下游边界态标签

**文件**：`frontend/src/services/statusLabels.ts`

```diff
    if (phase === 'editorial') {
      switch (s) {
-       case 'writing':
-         return '待审阅作品'
+       case 'written':
+         return '待审阅作品'
        case 'reviewing':
          return '审阅中作品'
        case 'reviewed':
          return '已审阅作品'
        default:
          return s
      }
    }
    if (phase === 'library') {
      switch (s) {
+       case 'reviewed':
+         return '待归库作品'
        case 'archived':
          return '已归档作品'
        default:
          return s
      }
    }
```

**验收**：编审部「待审阅」徽章显示"待审阅作品"、文集库「待归库」显示"待归库作品"，不再漏英文。

---

## §5 枪3 — H01 文集库归档端点

### 5.1 后端 `backend/src/routes/projects.ts`（仿 `mark-written` 模子，复用已存在的 `archivedAt` 列）

在 `undo-written`（#9）之后新增：

```ts
// #10 archive（编审部 reviewed → 文集库 archived，终态）
app.post('/:id/archive', async (req: FastifyRequest<GetByIdParams>, reply) => {
  try {
    const project = await loadActiveProject(req.params.id)
    assertStatusFor(project.status, ['reviewed'])
    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        status: 'archived',
        archivedAt: project.archivedAt ?? new Date(),
      },
    })
    return ApiResponse.success(withMappedProjectStatus(updated), '已归档')
  } catch (e: unknown) {
    if (e instanceof ProjectNotFoundError) return reply.status(404).send(ApiResponse.error(e.message, 404))
    if (e instanceof StatusNotAllowedError) return reply.status(400).send(ApiResponse.error(e.message, 400))
    const message = e instanceof Error ? e.message : 'archive failed'
    return reply.status(500).send(ApiResponse.error(message, 500))
  }
})
```

> 走语义端点（`assertStatusFor`）而非 `transition`，绕过桶守卫——`stage-guard.ts` 注释本就规定"跨桶应走语义端点"。

### 5.2 前端 `frontend/src/services/api.ts`（projectsApi 内新增）

```ts
async archive(id: string): Promise<Project> {
  const response = await api.post(`/projects/${id}/archive`)
  return response.data
},
```

### 5.3 前端 `frontend/src/pages/LibraryPage.tsx`

```diff
    if (action === 'archive') {
-     await projectsApi.transition(id, 'archived')
+     await projectsApi.archive(id)
      notifySuccess('已归入文集库', '作品已归档')
```

**验收**：文集库「待归库」点「归入文集库」→ 作品进入「已归档」，无跨桶报错。

---

## §6 枪4 — 3 个放行后端端点 + api 包装

### 6.1 后端 `backend/src/routes/projects.ts`（仿 `mark-written`，用 `mergeMetadata` 写标记，**不改 status**）

```ts
// #11 release-to-studio（企划课 planned 放行至创作室）
app.post('/:id/release-to-studio', async (req: FastifyRequest<GetByIdParams>, reply) => {
  try {
    const project = await loadActiveProject(req.params.id)
    assertStatusFor(project.status, ['planned'])
    const metadata = (project.metadata as Record<string, unknown>) || {}
    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data: { metadata: mergeMetadata(metadata, { _releasedToStudioAt: new Date().toISOString() }) },
    })
    return ApiResponse.success(withMappedProjectStatus(updated), '已放行至创作室')
  } catch (e: unknown) {
    if (e instanceof ProjectNotFoundError) return reply.status(404).send(ApiResponse.error(e.message, 404))
    if (e instanceof StatusNotAllowedError) return reply.status(400).send(ApiResponse.error(e.message, 400))
    return reply.status(500).send(ApiResponse.error(e instanceof Error ? e.message : 'release-to-studio failed', 500))
  }
})

// #12 release-to-editorial（创作室 written 放行至编审部）
app.post('/:id/release-to-editorial', async (req: FastifyRequest<GetByIdParams>, reply) => {
  try {
    const project = await loadActiveProject(req.params.id)
    assertStatusFor(project.status, ['written'])
    const metadata = (project.metadata as Record<string, unknown>) || {}
    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data: { metadata: mergeMetadata(metadata, { _releasedToEditorialAt: new Date().toISOString() }) },
    })
    return ApiResponse.success(withMappedProjectStatus(updated), '已放行至编审部')
  } catch (e: unknown) {
    if (e instanceof ProjectNotFoundError) return reply.status(404).send(ApiResponse.error(e.message, 404))
    if (e instanceof StatusNotAllowedError) return reply.status(400).send(ApiResponse.error(e.message, 400))
    return reply.status(500).send(ApiResponse.error(e instanceof Error ? e.message : 'release-to-editorial failed', 500))
  }
})

// #13 release-to-library（编审部 reviewed 放行至文集库）
app.post('/:id/release-to-library', async (req: FastifyRequest<GetByIdParams>, reply) => {
  try {
    const project = await loadActiveProject(req.params.id)
    assertStatusFor(project.status, ['reviewed'])
    const metadata = (project.metadata as Record<string, unknown>) || {}
    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data: { metadata: mergeMetadata(metadata, { _releasedToLibraryAt: new Date().toISOString() }) },
    })
    return ApiResponse.success(withMappedProjectStatus(updated), '已放行至文集库')
  } catch (e: unknown) {
    if (e instanceof ProjectNotFoundError) return reply.status(404).send(ApiResponse.error(e.message, 404))
    if (e instanceof StatusNotAllowedError) return reply.status(400).send(ApiResponse.error(e.message, 400))
    return reply.status(500).send(ApiResponse.error(e instanceof Error ? e.message : 'release-to-library failed', 500))
  }
})
```

> `mergeMetadata` 已在 `projects.ts` 内使用（见 `confirm-greenlight`），无需新增 import。

### 6.2 前端 `frontend/src/services/api.ts`（projectsApi 内新增 3 个）

```ts
async releaseToStudio(id: string): Promise<Project> {
  return (await api.post(`/projects/${id}/release-to-studio`)).data
},
async releaseToEditorial(id: string): Promise<Project> {
  return (await api.post(`/projects/${id}/release-to-editorial`)).data
},
async releaseToLibrary(id: string): Promise<Project> {
  return (await api.post(`/projects/${id}/release-to-library`)).data
},
```

**验收**：`tsc --noEmit` 通过；3 个端点可被调用（暂未接按钮）。

---

## §7 枪5 — 4 处放行按钮接真实端点（替换假提示）

### 7.1 `frontend/src/pages/planning/PlanningPage.tsx` + `PlanningProjectsPage.tsx`

```diff
        case 'release-to-studio':
+         await projectsApi.releaseToStudio(id)
          addNotification({ type: 'success', title: '已提交创作室' })
          break
```

### 7.2 `frontend/src/pages/writing/WritingProjectsPage.tsx`

```diff
      else if (a === 'soft-delete') await projectsApi.softDelete(id)
+     else if (a === 'submit-to-editorial') await projectsApi.releaseToEditorial(id)
```

### 7.3 `frontend/src/pages/EditorialPage.tsx`

```diff
      else if (a === 'soft-delete') await projectsApi.softDelete(id)
+     else if (a === 'submit-to-library') await projectsApi.releaseToLibrary(id)
```

**验收**：四个放行按钮点击后产生真实交接事实（metadata 标记），不再是假成功提示。此时下游仍按纯 status 显示（枪6 收口门禁）。

---

## §8 枪6 — 下游放行门禁 + 源端按钮去重（H04）

目标：下游"待处理"只显示**已提交（已放行）**的；源端"已完成"对**已提交**的隐藏提交按钮（防重复提交，不变量 #2）。

> **门禁强度（Codex 复盘确认）：采用严格门禁。** 下游待处理**必须**要求 `_releasedToXAt`，否则"确认完成"与"提交下一部门"又会粘回一起。
> **不做**"科长一键确认并提交"的合并捷径——它会把刚分清的员工层/科长层再次粘连。待流水线稳定后，再设计"明确记录两个事件的快捷操作"。
> **枪4 + 枪6 是本规格的核心**：提交端点写交接事实、下游列表按交接事实显示。这两枪落地，"确认完成 ≠ 提交下一部门"才从文档变成系统行为。

辅助读取（各文件内联即可）：`const rel = (p: Project) => (p.metadata as Record<string, any>) || {}`

### 8.1 下游待处理过滤

```diff
// WritingProjectsPage.tsx
- const planned = useMemo(() => projects.filter(p => p.status === 'planned'), [projects])
+ const planned = useMemo(() => projects.filter(p => p.status === 'planned' && rel(p)._releasedToStudioAt), [projects])

// EditorialPage.tsx
- const pending = useMemo(() => projects.filter(p => p.status === 'written'), [projects])
+ const pending = useMemo(() => projects.filter(p => p.status === 'written' && rel(p)._releasedToEditorialAt), [projects])

// LibraryPage.tsx
- const pending = useMemo(() => projects.filter(p => p.status === 'reviewed'), [projects])
+ const pending = useMemo(() => projects.filter(p => p.status === 'reviewed' && rel(p)._releasedToLibraryAt), [projects])
```

### 8.2 源端已放行的隐藏放行按钮

- 企划课已完成（planned）：`getActionsForStatus` 中 `release-to-studio` 仅在 `!rel(p)._releasedToStudioAt` 时出现；已放行则显示静态"已放行至创作室"。
- 创作室已完成（written）：`submit-to-editorial` 仅在未放行时出现。
- 编审部已完成（reviewed）：`submit-to-library` 仅在未放行时出现。

> 实现方式：把 `getActions(status)` 改为 `getActions(p)`，读 metadata 决定是否含放行项。每文件约 +2 行。

**验收**：mark-written 的作品**不再**同时出现在创作室已完成和编审部待审阅；只有点了「提交编审部」后才进编审部待审阅。`reviewed`/`planned` 同理。

---

## §9 枪7 — 清死代码 + 同步文档

1. **删 `softShelve` 死代码**（D02）：`api.ts` `softShelve()` + 后端 `/soft-shelve`（已无调用方）。⚠️ 删前 grep 全仓确认零引用。
2. **同步 `audit-legacy-10-residuals.md`**（D01）：§5.1/§5.4 删除对已删 `*Actions` 组件的引用，与 §4 对齐。
3. **同步 `design-workdetail-restructure.md §2`**（D03）：`ProjectMetadataPanel` → `WorkMetadataPanel`。
4. **更新 `release-protocol.md §1.1/§2.2`**：`greenlitAt/currentDept` 方案改为 metadata 键，与本规格一致。

**验收**：`tsc`/`build` 通过；文档无 stale 引用。

---

## §10 全局验收（全部枪完成后）

走通一部作品全生命周期，每步无报错、无重影、无假提示：

```
构思 → 提交企划 → 接收 → 企划中 →(科长)确认企划完成 →(科长)放行创作室
→ 创作室待创作 → 开始创作 → 创作中 → 作品已完成 →(科长)放行编审部
→ 编审部待审阅 → 开始审阅 → 审阅中 → 确认审阅完成 →(科长)放行文集库
→ 文集库待归库 →(科长)归入文集库 → 已归档
```

- `npx tsc --noEmit` ✅ / `npx vite build` ✅
- 退回（planned→planning、reviewed→reviewing）可用
- 暂存（soft-delete / deletedAt）可用，墓园可还原（总经理裁决）

---

## §11 记录

| 时间 | 事件 |
|------|------|
| 2026-06-11 | Spec v1。放行模型 A 的最小 diff / 零迁移执行规格，7 枪。修正 release-protocol 的 greenlitAt/currentDept 误用，统一改 metadata 键。⛔ 暂不执行。 |
| 2026-06-11 | Spec v1.1。Codex 复盘确认：UI 文案锁「提交」（端点/架构用 release）；枪6 严格门禁、不做"科长一键确认并提交"捷径；明确枪4+枪6 为核心；逐枪执行（枪1→7），不一次性发 7 枪。 |
