# TASK: P0-A — WorkDetailPage 上下文守卫补全（范围评估）

> **模式**：范围评估（只读）→ 司令部确认后执行
> **基线**：`v2-dev` @ `2e0e7a7`（HEAD）
> **类型**：P0（阻塞级修复）
> **范围**：仅评估 `frontend/src/pages/WorkDetailPage.tsx`，不动任何入口

---

## 第一步：范围评估（本次执行）

请在 WorkDetailPage.tsx 中找到以下代码位置，逐条汇报当前代码和修改建议。**不要修改代码，只报告评估结果。**

### 评估项 1 — 上下文字段（当前 L127-129 附近）

找到 `const from = searchParams.get('from')`，确认：
- 当前是否只有 `isPlanningContext` 和 `badgePhase` 的二元判断
- 四守卫（isWritingContext / isEditorialContext / isLibraryContext）是否存在
- badgePhase 是否只有 `planning` / `studio` 两个分支

### 评估项 2 — stageManageButton 守卫（当前 L299 附近）

找到 `const stageManageButton = !isPlanningContext ? ( ... ) : null`，确认：
- 当前守卫条件
- 无 `from=` 时 `isPlanningContext` 为 false，stageManageButton 是否显示
- `renderActions` 中哪些 status case 使用了 stageManageButton

### 评估项 3 — handleBack 回退逻辑（当前 L131-148 附近）

找到 `const handleBack` 函数，确认：
- 当前是否仅识别 `isPlanningContext` 和 `from === 'writing'`
- 没有 `from === 'editorial'` 和 `from === 'library'` 路径

### 评估项 4 — badge 展示（当前 L519 附近）

找到 `<ProjectStatusBadge status={project.status} phase={badgePhase} />`，确认：
- 当前 badge 只有 `planning`/`studio` 相位
- 无 `from=` 时 badge 的展示效果

### 评估项 5 — 无 from= 时的动作区（renderActions 全量）

确认无 `from=` 时，根据当前代码，renderActions 会返回哪些按钮。

---

## 第二步：实施边界（司令部裁定，评估后执行）

### 边界 1 — 不扩展 editorial/library 为完整详情页

P0-A 的目标**不是**把 WorkDetailPage 扩展为四部门详情页。editorial/library 已有独立路由（`/editorial/:id`、`/library/:id`），WorkDetailPage 只需对齐以下底线：

| 要求 | 说明 |
|------|------|
| 识别 | 能识别 `from=editorial` / `from=library` 为有效上下文 |
| badgePhase | 不误落到 `'studio'`，正确映射为 `'editorial'` / `'library'` |
| 阶段管理 | 不暴露 planning/studio 的阶段推进动作（stageManageButton 守卫） |
| 返回路径 | 如有明确列表页可最小补齐（`/editorial` / `/library`） |
| ❌ 不新增动作 | 不为 editorial/library 新增动作区 |
| ❌ 不引入新功能 | 不改动 renderActions 的 status case 逻辑 |

### 边界 2 — 无 `from=` 的安全兜底（禁止仅留 TODO）

无 `from=` 时**不能**只加 TODO 注释后继续 fallback 为 `studio`。最小要求：

| 保护措施 | 实现方式 |
|---------|---------|
| 不显示 `stageManageButton` | `hasValidContext` 守卫 |
| 不显示部门推进按钮 | renderActions 中 status case 不暴露推进动作 |
| 不暴露创作室动作 | "进入创作室"等按钮由上下文守卫 |
| badge 可用通用/raw 状态 | 使用 `ProjectStatusBadge` 无 phase 或 'studio' 但精简动作 |
| 返回保持 navigate(-1) | 无 from= → handleBack 走 navigate(-1) |
| TODO 只用于后续优化 | 不允许 "TODO: 以后改" 作为安全兜底 |

---

## 修改方案（参考，待评估后确认）

### 修改 1 — 上下文字段（L127-129 附近）

```
const from = searchParams.get('from')
const isPlanningContext = from === 'planning'
const isWritingContext = from === 'writing'
const isEditorialContext = from === 'editorial'
const isLibraryContext = from === 'library'
const hasValidContext = isPlanningContext || isWritingContext || isEditorialContext || isLibraryContext

const badgePhase: PhaseContext =
  isPlanningContext ? 'planning' :
  isWritingContext ? 'studio' :
  isEditorialContext ? 'editorial' :
  isLibraryContext ? 'library' :
  'studio'  // 无 from= 时 badgePhase 仍为 'studio'，但动作区已受 hasValidContext 保护
```

### 修改 2 — stageManageButton 守卫（L299 附近）

```
// 前: const stageManageButton = !isPlanningContext ? (...) : null
// 后: 仅在 writing/editorial/library 上下文中显示阶段管理
const stageManageButton = (isWritingContext || isEditorialContext || isLibraryContext) ? (...) : null
```

**效果**：
- `from=planning` → 不显示（与现有一致）
- `from=writing/editorial/library` → 显示（与现有一致）
- **无 `from=`** → 不显示（修复当前默认暴露的问题）

### 修改 3 — handleBack 回退补全（L131-148 附近）

```
const handleBack = useCallback(() => {
  if (isPlanningContext) {
    if (project?.status === 'planning') navigate('/planning/in-progress')
    else if (project?.status === 'planned') navigate('/planning/projects')
    else navigate('/planning/proposals')
    return
  }
  if (isWritingContext) {
    navigate('/writing/projects')
    return
  }
  if (isEditorialContext) {
    navigate('/editorial')
    return
  }
  if (isLibraryContext) {
    navigate('/library')
    return
  }
  navigate(-1)  // 无 from= → navigate(-1)
}, [isPlanningContext, isWritingContext, isEditorialContext, isLibraryContext, project?.status, navigate])
```

### 修改 4 — 动作区保护（renderActions）

不对 renderActions 的 status case 逻辑做结构性修改，但需确认：
- 无 `from=` 时，renderActions 中暴露的按钮是否依赖 `stageManageButton` 守卫
- 是否存在无条件展示"进入创作室"等 studio 动作的路径

---

## 验证标准

| # | 检查项 | 预期 |
|---|--------|------|
| 1 | `from=planning` | 与现在一致，无回归 |
| 2 | `from=writing` | badgePhase='studio'，handleBack→/writing/projects |
| 3 | `from=editorial` | badgePhase='editorial'，handleBack→/editorial |
| 4 | `from=library` | badgePhase='library'，handleBack→/library |
| 5 | 无 `from=` stageManageButton | 不显示 |
| 6 | 无 `from=` 推进按钮 | 不显示规划/创作室动作 |
| 7 | editorial/library | 不新增动作区，不改 renderActions status case |
| 8 | build | ✅ 通过 |

---

## 约束

- ✅ 只改 `WorkDetailPage.tsx` 一个文件
- ❌ 不改任何入口代码（不补 from=、不改文案）
- ❌ 不为 editorial/library 新增动作区或新功能
- ❌ 不改 backend / Schema
- ❌ 本次仅评估，不 commit

---

## 产出回报格式（第一步 → 评估）

```
=== P0-A 范围评估 ===

## 评估项 1 — 上下文字段
当前代码: ...
建议修改: ...
diff 行数: ~N 行

## 评估项 2 — stageManageButton
当前守卫: ...
无 from= 时的行为: ...
建议: ...

## 评估项 3 — handleBack
当前路径: ...
缺失路径: ...
建议: ...

## 评估项 4 — badge
当前相位: ...
无 from= 时的展示: ...

## 评估项 5 — 无 from= 动作区
暴露的按钮: ...
是否受 hasValidContext 保护: ...

## 预估总 diff
文件: WorkDetailPage.tsx
行数: ~N 行
涉及区域: 上下文字段 / stageManageButton / handleBack / badgePhase / 动作区守卫
风险: 低-中
```
