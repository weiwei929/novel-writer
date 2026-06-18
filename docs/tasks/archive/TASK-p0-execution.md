# TASK: P0 执行 — WorkDetailPage 上下文守卫 + WritingEditor 回退修复

> **模式**：修改代码，执行后回报 staged diff + build
> **基线**：`v2-dev` @ `2e0e7a7`（HEAD）
> **范围**：`WorkDetailPage.tsx` + `WritingEditorPage.tsx`
> **前置评估**：TASK-p0a-workdetail-context.md（已由 Cursor 完成范围评估）
> **司令部裁定**：Q1→A / Q2→B / Q3→B / P0-B→缩减（已确认）

---

## 背景

P0-A 范围评估已完成，关键发现：HEAD 代码**已有**四守卫和 badgePhase 四分支（与任务卡假设不同），核心缺口集中在**无 `from=` 时仍暴露 studio 动作**。P0-B 范围缩减为仅 WritingEditorPage 2 行。

本任务合并执行两枪。

---

## P0-A: WorkDetailPage.tsx

### 修改 1 — 新增 hasValidContext（L126-140 附近）

当前代码已有四守卫和 badgePhase 映射，只需新增一个守卫变量：

```typescript
// 在 const isLibraryContext = from === 'library' 之后、badgePhase 之前新增:
const hasValidContext = isPlanningContext || isWritingContext || isEditorialContext || isLibraryContext
```

### 修改 2 — stageManageButton 守卫（L318-L327 附近）

当前守卫：
```typescript
// 四守卫全为 false 时显示 — 即无 from= 或无效 from= 时显示 ❌
const stageManageButton = !isPlanningContext && !isWritingContext && !isEditorialContext && !isLibraryContext ? (...) : null
```

改为：
```typescript
// 司令部裁定：仅 from=writing 需要阶段管理按钮
// from=planning → 不显示（现有行为）
// from=writing → 显示（创作室需要推进到编审）
// from=editorial/library → 不显示（边界 1：不暴露 planning/studio 阶段推进）
// 无 from= → 不显示（边界 2）
const stageManageButton = isWritingContext ? (...) : null
```

### 修改 3 — writing fallback 分支（renderActions 中 case 'writing' 附近）

**司令部裁定 Q1→A**：无有效上下文时 `return null`，不显示"进入创作室"，也不保留"管理章节规划"。

当前类似：
```typescript
case 'writing':
  return (
    <>
      <button onClick={handleEnterWriting}>进入创作室</button>
      {stageManageButton}
    </>
  )
```

改为：
```typescript
case 'writing':
  if (!hasValidContext) return null  // 司令部 Q1-A: 无上下文不暴露任何写作动作
  return (
    <>
      <button onClick={handleEnterWriting}>进入创作室</button>
      {stageManageButton}
    </>
  )
```

### 修改 4 — 章节列表"写作"按钮守卫（L818 附近）

当前守卫（无 from= 时条件为 true → 暴露章节写作入口 ❌）：
```typescript
{!isPlanningContext && !isEditorialContext && !isLibraryContext && (
  <button onClick={() => navigate(`/writing/${project.id}/${c.id}`)}>写作</button>
)}
```

改为（司令部边界 2：无上下文不暴露写作入口）：
```typescript
{isWritingContext && (
  <button onClick={() => navigate(`/writing/${project.id}/${c.id}`)}>写作</button>
)}
```

### 修改 5 — completed 动作区守卫（renderActions 中 case 'completed'）

**司令部裁定 Q3→B**：无有效上下文时隐藏"归入文集"，保留"导出"。

当前类似：
```typescript
case 'completed':
  return (
    <>
      <button onClick={openLibraryPicker}>归入文集</button>
      <button onClick={handleExport}>导出</button>
      {stageManageButton}
    </>
  )
```

改为：
```typescript
case 'completed':
  return (
    <>
      {hasValidContext && <button onClick={openLibraryPicker}>归入文集</button>}
      <button onClick={handleExport}>导出</button>
      {stageManageButton}
    </>
  )
```

若代码拆分成本高，可临时对整个 completed 动作区返回 null（需在回报中说明）。

### ✅ 不修改（司令部 Q2→B）

`draft`/`planning` 的"编辑作品设定/元数据"按钮保留，本枪不处理。

---

## P0-B: WritingEditorPage.tsx

**司令部裁定 P0-B 缩减**：仅改 WritingEditorPage.tsx L295/L320，CreateProjectModal.tsx 和 App.tsx 不改。

### 修改

| 行号 | 当前代码 | 改为 |
|------|---------|------|
| L295 | `navigate(\`/work/${projectId}\`)` | `navigate(\`/work/${projectId}?from=writing\`)` |
| L320 | `navigate(\`/work/${projectId}\`)` | `navigate(\`/work/${projectId}?from=writing\`)` |

---

## 不修改范围确认

| 文件 | 原因 |
|------|------|
| `CreateProjectModal.tsx` | 评估确认 HEAD 已合规（已有 `?from=planning`） |
| `App.tsx` | 不修改，仅验证 redirect 有效 |
| `ProposalDetailPage.tsx` | 入口架构类 → P1 |
| `PlanningProposal.tsx` | 同上 |
| `dashboard.ts` | 同上 |
| `ShelfPage.tsx` | 同上 |
| `ProjectCard.tsx` | 同上 |
| 任何 backend/Schema 文件 | 范围外 |

---

## 执行步骤

1. 确认 HEAD 是 `2e0e7a7`
2. 修改 `WorkDetailPage.tsx`（5 处修改，详见上方）
3. 修改 `WritingEditorPage.tsx`（2 行）
4. `git stash` 后 `git add -p` 选择性 stage P0 范围文件（确认无夹带）
5. `npm run build` 验证
6. 确认未修改文件无意外改动
7. 回报 staged diff（不 commit，等司令部确认）

---

## 回报格式

```
=== P0 执行回报 ===

## P0-A: WorkDetailPage.tsx
1. hasValidContext: +1 行 ✅
2. stageManageButton 守卫: 改为 isWritingContext ✅
3. writing fallback: 加 !hasValidContext → return null ✅
4. 章节写作按钮: isWritingContext ✅
5. completed 归入文集: hasValidContext 守卫 ✅
total diff: ~N 行

## P0-B: WritingEditorPage.tsx
L295: +?from=writing ✅
L320: +?from=writing ✅
total diff: ~2 行

## 未修改确认
CreateProjectModal.tsx ✅（已合规）
App.tsx ✅（未修改）
P1 范围 5 文件 ✅（未修改）

## build 验证
staged-only build: ✅ / ❌

## 夹带检查
git diff --cached --name-only: （确认仅上述 2 文件）
