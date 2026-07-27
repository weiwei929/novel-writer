# 0608-editorial-workspace.md — 编审部三工作区前端实现蓝图

> **文档角色**：编审部三工作区（待处理/进行中/已完成）的前端实现蓝图。
> **优先级**：P3 — 编审部阶段。
> **关系**：引用 `0608-dept-workspace-model.md` §2（编审部）、`0608-status-context-labeling.md` §3.3（编审部标签）、`0608-file-staging-pool.md` §2（UI 文案）。本文是 `day2-editorial-anchors.md` 的 0608 对齐版本。

---

## §0 文档元信息

### 0.1 术语表

| 术语 | 含义 |
|------|------|
| 编审部 | 5 部门 L1 平级入口之一，对应"责任编辑"角色 |
| 待审阅 | 创作室已完成（`written`）、等待编审部接收的作品 |
| 审阅中 | 正在审阅中的作品（`reviewing`） |
| 已审阅 | 审阅已完成的作品（`reviewed`） |
| 开始审阅 | `written → reviewing` 的部门语义动作 |
| 确认审阅完成 | `reviewing → reviewed` 的部门语义动作 |
| 退回审阅 | `reviewed → reviewing` 的部门内部退回 |

### 0.2 与现有 ReviewDetailPage 的关系

P3 不推翻 `ReviewDetailPage.tsx`（三栏审阅布局：章节导航 | 正文 | AI 报告区），而是：
- `EditorialPage.tsx` → 改为三工作区列表（对应 P2-A 的 `WritingProjectsPage`）
- `ReviewDetailPage.tsx` → 保留，作为"进入审阅"的详情页
- `WorkDetailPage.tsx` → 新增 `from=editorial` 上下文，只做内容查看，不显示流程决策按钮

---

## §1 编审部三工作区映射

| 0608 三工作区 | `Project.status` | 编审部上下文标签 | 来源 |
|--------------|-----------------|-----------------|------|
| 待处理 | `written` | 待审阅作品 | 创作室标记全本完成 |
| 进行中 | `reviewing` | 审阅中作品 | 开始审阅后 |
| 已完成 | `reviewed` | 已审阅作品 | 确认审阅完成 |

### 1.1 信息架构

```
L1: 编审部
  ├ 待处理工作区（来源：Project.status='written'）
  │   └ 每项：作品名/字数/章节数/创作完成时间
  │   └ 按钮：[🔍 开始审阅] [📂 放入文件暂存]
  │
  ├ 进行中工作区（来源：Project.status='reviewing'）
  │   ├ 每项：作品名/审阅开始时间
  │   ├ 按钮：[🔍 进入审阅] [✅ 确认审阅完成] [📂 放入文件暂存]
  │   └ [进入审阅] → ReviewDetailPage（三栏审阅布局，只做内容决策）
  │
  └ 已完成工作区（来源：Project.status='reviewed'）
      └ 每项：作品名/审阅完成时间
      └ 按钮：[📚 放行文集库] [↩ 退回审阅] [📂 放入文件暂存]
```

**关键**：[开始审阅] 和 [确认审阅完成] 是流程决策，只出现在列表条目上，不进入 WorkDetailPage 或 ReviewDetailPage。

### 1.2 命名约定

| 上下文 | 文案 | 说明 |
|--------|------|------|
| L1 导航标题 | 编审部 | 独立 L1 |
| 待处理区标题 | 待审阅 | 创作室完成的作品 |
| 进行中区标题 | 审阅中 | 正在审阅 |
| 已完成区标题 | 已审阅 | 审阅完成 |
| 开始审阅按钮 | 开始审阅 | `written → reviewing`，位于待处理列表条目上 |
| 进入审阅按钮 | 进入审阅 | 进入 ReviewDetailPage，位于进行中列表条目上 |
| 确认完成按钮 | 确认审阅完成 | `reviewing → reviewed`，位于进行中列表条目上 |
| 放行按钮 | 放行文集库 | 位于已完成列表条目上 |
| 退回按钮 | 退回审阅 | 部门内退回 `reviewed → reviewing`，位于已完成列表条目上 |

---

## §2 EditorialPage.tsx → 三工作区列表

### 2.1 当前状态

`EditorialPage.tsx`（100 行）当前为单层列表，`getEditorialProjects()` 返回 `written,reviewing` 两个状态，缺少 `reviewed`。

### 2.2 目标状态

参考 `WritingProjectsPage.tsx` 的三区模式，改为：

```tsx
export default function EditorialPage() {
  // ... load all projects, filter by status
  
  const pending = projects.filter(p => p.status === 'written')
  const active = projects.filter(p => p.status === 'reviewing')
  const completed = projects.filter(p => p.status === 'reviewed')

  return (
    <div>
      <Header title="编审部" total={...} />
      <Section title="待审阅" projects={pending} onOpen={openWork} />    {/* → /work/:id?from=editorial */}
      <Section title="审阅中" projects={active} onOpen={openWork} />
      <Section title="已审阅" projects={completed} onOpen={openReview} /> {/* → /editorial/:id */}
    </div>
  )
}
```

### 2.3 导航目标

| 工作区 | 点击条目导航 | 目标页面 | 说明 |
|--------|-------------|---------|------|
| 待处理（written） | `/work/:id?from=editorial` | WorkDetailPage（编审部上下文） | 只读/内容查看。流程按钮在列表上。 |
| 进行中（reviewing） | `/editorial/:id` | ReviewDetailPage（三栏审阅） | 只做内容决策（批注）。[确认审阅完成] 在列表上。 |
| 已完成（reviewed） | `/editorial/:id` | ReviewDetailPage（审阅报告只读） | 只读。流程按钮在列表上。 |

---

## §3 WorkDetailPage 编审部上下文

### 3.1 上下文变量

```typescript
const isEditorialContext = from === 'editorial'
```

### 3.2 renderActions — 修正案对齐

修正案要求：**详情页不承载流程决策。** 所有阶段转换按钮（开始审阅、确认审阅完成等）属于部门列表条目。

```typescript
// WorkDetailPage?from=editorial 的 renderActions：
// 不显示 [开始审阅]、[确认审阅完成] 等流程决策按钮。
// 这些按钮在 EditorialPage 列表的条目上。

case 'written':
  if (isEditorialContext) {
    // 只读内容视图。流程决策（开始审阅）在 EditorialPage 待处理列表上。
    return null
  }

case 'reviewing':
  if (isEditorialContext) {
    // 只读内容视图。流程决策（确认审阅完成）在 EditorialPage 进行中列表上。
    return null
  }
```

### 3.3 对应的列表页流程按钮

流程按钮必须在 `EditorialPage.tsx` 的列表条目上实现：

```typescript
// EditorialPage.tsx — 待处理区条目
<ProjectCard>
  <Button onClick={() => projectsApi.submitReview(id)}>🔍 开始审阅</Button>
  <Button onClick={() => projectsApi.softDelete(id)}>📂 放入文件暂存</Button>
</ProjectCard>

// EditorialPage.tsx — 进行中区条目
<ProjectCard>
  <Button onClick={() => navigate(`/editorial/${id}`)}>🔍 进入审阅</Button>
  <Button onClick={() => projectsApi.markReviewed(id)}>✅ 确认审阅完成</Button>
  <Button onClick={() => projectsApi.softDelete(id)}>📂 放入文件暂存</Button>
</ProjectCard>

// EditorialPage.tsx — 已完成区条目
<ProjectCard>
  <Button onClick={() => projectsApi.releaseToLibrary(id)}>📚 放行文集库</Button>
  <Button onClick={() => projectsApi.transition(id, 'reviewing')}>↩ 退回审阅</Button>
  <Button onClick={() => projectsApi.softDelete(id)}>📂 放入文件暂存</Button>
</ProjectCard>
```

**注意**：[进入审阅] 不是流程决策——它只是导航到详情页。详情页内只有 [保存批注]（内容决策）。

### 3.4 handleBack 新增分支

```typescript
if (from === 'editorial') {
  navigate('/editorial')
  return
}
```

### 3.5 禁止

- ❌ 不显示任何阶段转换按钮（开始审阅、确认审阅完成等——这些在列表上）
- ❌ 不显示全局 StageTransitionModal
- ❌ 不出现在详情页修改 Project.status 的入口
- ❌ 不从编审部退回创意组/企划课（跨部门退回）

---

## §4 ReviewDetailPage.tsx 编审部详情页

### 4.1 当前状态

`ReviewDetailPage.tsx`（295 行）已具备三栏布局（章节导航 | 正文 | AI 审阅报告区），但存在需要修正的问题：

| 问题 | 位置 | 需要 |
|------|------|------|
| `ProjectStatusBadge` 无 `phase` | L242 | 传 `phase="editorial"` |
| "标记已审" 按钮 | L79-81 | **移除。** [确认审阅完成] 是流程决策，属于 EditorialPage 进行中列表条目 |
| "生成报告" 为 AI 占位 | L83-85 | 保留占位，标记 P3-C（AI 集成） |

### 4.2 修改内容 — 修正案对齐

1. `ProjectStatusBadge` 传入 `phase="editorial"`
2. **移除** [标记已审] / [确认审阅完成] 按钮——这是流程决策，在 EditorialPage 列表上
3. ReviewDetailPage 内只保留 [保存批注]（内容决策）
4. 保留"生成报告"占位，标注 `Day 3 AI 接入`

### 4.3 编审部端点映射

| 动作 | 状态转换 | 后端端点 | 发生位置 | 状态 |
|------|---------|---------|---------|------|
| 开始审阅 | `written → reviewing` | `POST /projects/:id/submit-review` | EditorialPage 待处理列表 | 🎯 |
| 确认审阅完成 | `reviewing → reviewed` | `POST /projects/:id/mark-reviewed` | EditorialPage 进行中列表 | 🎯 |
| 退回审阅 | `reviewed → reviewing` | `POST /projects/:id/transition {to: 'reviewing'}` | EditorialPage 已完成列表 | ✅ |
| 放行文集库 | `reviewed` 不变 | `POST /projects/:id/release-to-library` | EditorialPage 已完成列表 | 🎯 |
| 放入文件暂存 | 设 `deletedAt` | `POST /projects/:id/soft-delete` | 列表条目 | ✅ |
| 生成审阅报告 | — | 🎯 AI 集成（Day 3） | 本阶段占位 | — |

**注意：** `written→reviewing` 和 `reviewing→reviewed` 是**跨桶转换**（`written` 属创作室桶，`reviewing`/`reviewed` 属编审部桶），**不可**直接使用 `transition` 端点——`stage-guard.ts` 的 `CROSS_STAGE_FORBIDDEN` 会拦截此类转换。必须走专用端点（类似 `startWriting` 绕开 stage-guard 的模式），在端点内部执行 `project.status = to` 并设置 `currentDept = 'editorial'`。

`reviewing→written` 不作为编审部用户路径保留，避免形成"退回创作室"的跨部门语义。若后续确实需要撤销开始审阅，应另设"撤销开始审阅"并证明它仍停留在编审部上下文内。

---

## §5 前后端依赖项

### 5.1 现有可用（✅）

| 端点/函数 | 说明 | 使用位置 |
|-----------|------|---------|
| `projectsApi.getAll()` | 获取所有 projects，前端过滤 | EditorialPage |
| `projectsApi.getEditorialProjects()` | 当前 filter `written,reviewing`，P3 需改为不过滤 | EditorialPage |
| `projectsApi.submitReview(id)` | 开始审阅（written→reviewing） | EditorialPage 待处理列表 |
| `projectsApi.markReviewed(id)` | 确认审阅完成（reviewing→reviewed） | EditorialPage 进行中列表 |
| `projectsApi.transition(id, to)` | 通用状态转换（仅限部门内退回） | EditorialPage 已完成列表 |
| `projectsApi.releaseToLibrary(id)` | 放行文集库 | EditorialPage 已完成列表 |
| `projectsApi.getById(id)` | 作品详情 | WorkDetailPage |
| `projectsApi.softDelete(id)` | 放入文件暂存 | EditorialPage 列表条目 |
| `projectsApi.restore(id)` | 从暂存捞回 | 暂存池 |
| `chaptersApi.getByProjectId(id)` | 章节列表 | ReviewDetailPage |
| `statusLabels.ts` `editorial` 标签 | 已定义「待审阅作品」「审阅中作品」「已审阅作品」 | ProjectStatusBadge |

### 5.2 需要注意

| 项 | 说明 |
|----|------|
| `getEditorialProjects()` | 当前写死 `'written,reviewing'`，P3 需增加 `reviewed` 或改用 `getAll()` 前端过滤。推荐改用 `getAll()` 前端过滤，与 `WritingProjectsPage` 一致的 `getAll().filter()` 模式 |
| `PROJECT_STATUS_LABEL` 全局字典 | `api.ts` L72-83 中的全局标签仍有 `reviewing: '审阅中'` 等值。编审部上下文中不应使用全局标签，而应使用 `getProjectStatusLabel(status, 'editorial')` |

---

## §6 预期 P3 执行顺序

### P3-A：编审部三工作区列表

- 改 `EditorialPage.tsx` → 三区（待审阅/审阅中/已审阅）
- **每个列表条目上实现流程决策按钮**（开始审阅 / 确认审阅完成 / 放行文集库 / 退回 / 暂存）
- 标签改用 `phase="editorial"`

### P3-A+：WorkDetailPage 编审部上下文

- 新增 `isEditorialContext` 用于 badgePhase 和只读视图切换
- `handleBack` 新增 `from=editorial` 分支
- **不添加流程决策按钮到 renderActions**（修正案 §1.1）

### P3-B：ReviewDetailPage 整理

- `ProjectStatusBadge` 传 `phase="editorial"`
- **移除** [标记已审] / [确认审阅完成] 按钮
- ReviewDetailPage 内只保留 [保存批注]（内容决策）
- 保留 AI 占位，标注 Day 3

### P3-C（Day 3）：AI 审阅报告集成

- `handleGenerateReport` → 调用 `aiApi` 生成报告
- 5 维度评估结果展示
- Prompt 配置界面

---

## §7 验收标准

P3 完成后，用户应能：

1. 在编审部 L1 看到三工作区：待审阅 / 审阅中 / 已审阅
2. 在待审阅列表条目上看到 [🔍 开始审阅] 按钮，点击后条目移入审阅中
3. 在审阅中列表条目上看到 [🔍 进入审阅] 和 [✅ 确认审阅完成] 按钮
4. [进入审阅] → 进入 ReviewDetailPage 三栏布局查看正文、保存批注（内容决策）
5. [确认审阅完成] → 条目移入已审阅列表
6. 在已审阅列表条目上看到 [📚 放行文集库] [↩ 退回审阅] [📂 暂存]
7. 已审阅作品点击 → 进入 ReviewDetailPage 查看审阅报告

不应出现：

1. ❌ 详情页（WorkDetailPage / ReviewDetailPage）中的阶段转换按钮
2. ❌ 跨部门退回（编审部 → 企划课/创作室）
3. ❌ 全局 StageTransitionModal
4. ❌ 1.0 章节审阅流程
5. ❌ AI 功能作为 P3 主流程依赖（AI 是 P3-C/Day 3）
