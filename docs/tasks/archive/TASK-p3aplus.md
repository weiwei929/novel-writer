# TASK P3-A+：WorkDetailPage 编审部上下文 + G6 折叠 + 后端 mark-reviewed

> **来源**：0608-editorial-workspace.md §3 / §4.3（已修正 G4）
> **基线**：VPS HEAD（含 P2-A+ 8ba7c16 的 isWritingContext + 开始创作 + P3-A 5022026 的 EditorialPage 三区）
> **部门**：编审部（P3-A+）+ 创作室（G6 折叠）
> **设计文档修正**：0608-editorial-workspace.md §4.3 已修正 `transition` → `submit-review`/`mark-reviewed`

---

## 设计上下文

编审部三工作区（P3-A，5022026）已在 VPS 交付。当前阶段需要：
- WorkDetailPage 支持 `from=editorial` 上下文（语义动作 + 导航）
- 创作室 `written` 状态的"确认创作完成"按钮（G6 折叠进此卡，否则编审部无 `written` 作品可测试）
- 后端 `mark-reviewed` 端点 + 前端 `submitReview`/`markReviewed` wrapper
- statusLabels.ts G1 bug fix

**G4 已修复**：设计文档中编审部端点映射已从 `transition` 改为专用端点。

---

## 修改清单

### Backend — 新增 1 端点

**#12 mark-reviewed** (`POST /projects/:id/mark-reviewed`)

与 #8 submit-review 对称，绕开 stage-guard 跨桶拦截：

```typescript
// #12 mark-reviewed
app.post('/:id/mark-reviewed', async (req, reply) => {
  const project = await loadActiveProject(req.params.id)
  assertStatusFor(project.status, ['reviewing'])
  const updated = await prisma.project.update({
    where: { id: req.params.id },
    data: {
      status: 'reviewed',
      reviewedAt: project.reviewedAt ?? new Date(),
    },
  })
  return ApiResponse.success(withMappedProjectStatus(updated), '审阅已完成')
})
```

**文件**: `backend/src/routes/projects.ts` — 追加在 `#11 restore`（约 L917）之后，`#12 soft-shelve` 之前

---

### Frontend — 3 文件修改

#### 1. `frontend/src/services/api.ts` — 新增 2 wrapper（G5）

在 `startWriting` 之后（约 L577）追加：

```typescript
async submitReview(id: string): Promise<Project> {
  const response = await api.post(`/projects/${id}/submit-review`)
  return response.data
},

async markReviewed(id: string): Promise<Project> {
  const response = await api.post(`/projects/${id}/mark-reviewed`)
  return response.data
},
```

#### 2. `frontend/src/services/statusLabels.ts` — G1 修正

L36: `case 'writing':` → `case 'written':`

```typescript
if (phase === 'editorial') {
  switch (s) {
    case 'written':       // ← G1 修正: writing→written
      return '待审阅作品'
    case 'reviewing':
      return '审阅中作品'
    case 'reviewed':
      return '已审阅作品'
    ...
```

#### 3. `frontend/src/pages/WorkDetailPage.tsx` — 核心修改

##### 3a. 上下文变量（约 L129）

```typescript
const isPlanningContext = from === 'planning'
const isWritingContext = from === 'writing'     // 已有（P2-A+）
const isEditorialContext = from === 'editorial'  // 新增
```

##### 3b. badgePhase 扩展（约 L130）

```typescript
const badgePhase: PhaseContext = isPlanningContext
  ? 'planning'
  : isWritingContext
    ? 'studio'
    : isEditorialContext
      ? 'editorial'
      : 'studio'
```

##### 3c. handleBack 新增分支

在 `if (from === 'writing')` 分支之后追加：

```typescript
if (isEditorialContext) {
  navigate('/editorial')
  return
}
```

##### 3d. stageManageButton 条件扩展

```typescript
const stageManageButton = !isPlanningContext && !isWritingContext && !isEditorialContext
  ? (...)
  : null
```

##### 3e. renderActions 新增 branch: `case 'written'`

在 `case 'planned'` 之后、`case 'writing'` 之前插入 `case 'written'`（G6 + G3）：

```typescript
case 'written':
  if (isWritingContext) {
    return (
      <>
        <button
          onClick={() => void handleStageAction('确认创作完成', () => projectsApi.markWritten(project.id))}
          className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          确认创作完成
        </button>
      </>
    )
  }
  if (isEditorialContext) {
    return (
      <>
        <button
          onClick={() => void handleStageAction('开始审阅', () => projectsApi.submitReview(project.id))}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          开始审阅
        </button>
      </>
    )
  }
  return stageManageButton
```

**`markWritten` 检查：** api.ts 中已有 `markWritten` 则直接用；否则使用 `projectsApi.markWritten(id)`（查看后端 `#7 mark-written` 是否存在）。

##### 3f. `case 'reviewing'` 新增编审部分支

```typescript
case 'reviewing':
  if (isEditorialContext) {
    return (
      <>
        <button
          onClick={() => void handleStageAction('确认审阅完成', () => projectsApi.markReviewed(project.id))}
          className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          确认审阅完成
        </button>
        <button
          onClick={() => navigate(`/editorial/${project.id}`)}
          className="px-3 py-1.5 text-sm border border-amber-200 text-amber-800 rounded-lg hover:bg-amber-50"
        >
          进入审阅
        </button>
      </>
    )
  }
  return stageManageButton
```

保留原 `case 'reviewing': return stageManageButton` 逻辑为默认 fallback。

---

## 影响范围

| 文件 | 变更类型 | 行数估计 |
|------|---------|---------|
| `backend/src/routes/projects.ts` | 新增 #12 mark-reviewed | ~20 行 |
| `frontend/src/services/api.ts` | 新增 2 wrapper | ~8 行 |
| `frontend/src/services/statusLabels.ts` | 1 行修正 | ~1 行 |
| `frontend/src/pages/WorkDetailPage.tsx` | 上下文 + actions + handleBack | ~40 行 |

**总计**：~70 行，4 文件，零新依赖。

---

## 不变量检查

- [ ] 编审部上下文**不**显示全局 StageTransitionModal（`stageManageButton` 在 editorial context 为 null）
- [ ] 编审部上下文**不**出现"阶段管理"按钮（同上）
- [ ] `mark-reviewed` 绕开 stage-guard（专用端点直接 update status）
- [ ] `from=editorial` 返回导航到 `/editorial`，不丢失上下文
- [ ] G6 "确认创作完成"在 `from=writing` 且 `status=written` 时显示
- [ ] G6 完成后作品进入编审部待处理区，端到端可测
- [ ] statusLabels `written` 在 editorial 下显示"待审阅作品"（G1 修正）
- [ ] 非编审部/非创作室上下文中 `case 'written'` 行为不变（fallback stageManageButton）
- [ ] 非编审部上下文中 `case 'reviewing'` 行为不变（fallback stageManageButton）

---

## 验收步骤

1. 创作室：打开 `from=writing` 的 `status=written` 作品 → 看到"确认创作完成"按钮
2. 点击"确认创作完成" → status 保持在 `written`，通知成功
3. 编审部：打开 `from=editorial` 的 `status=written` 作品 → 看到"开始审阅"按钮，**没有**"阶段管理"
4. 点击"开始审阅" → status → `reviewing`，出现在编审部进行中区
5. 打开 `from=editorial` 的 `status=reviewing` 作品 → 看到"确认审阅完成"+"进入审阅"
6. 点击"进入审阅" → 跳转到 `ReviewDetailPage` 三栏布局
7. 点击"确认审阅完成" → status → `reviewed`
8. 返回编审部 → 作品出现在已完成区，标签显示"已审阅作品"

---

## 提交建议

每枪控制在 1 文件量级：

```
# 第一枪：后端 mark-reviewed
git commit -m "feat(backend): #12 mark-reviewed endpoint for editorial dept

- POST /projects/:id/mark-reviewed (reviewing→reviewed)
- bypasses stage-guard for cross-bucket transition
- symmetric to #8 submit-review
"

# 第二枪：api.ts wrappers + statusLabels G1 fix
git commit -m "fix(frontend): add submitReview/markReviewed wrappers, fix editorial statusLabels G1

- api.ts: submitReview(id), markReviewed(id)
- statusLabels.ts: case 'writing' → case 'written' in editorial branch
"

# 第三枪：WorkDetailPage editorial context + G6
git commit -m "feat(frontend): WorkDetailPage editorial context + G6 confirm-complete

- isEditorialContext, badgePhase editorial, handleBack editorial
- stageManageButton excludes editorial context
- case 'written': G6 confirm-complete (studio) + start-review (editorial)
- case 'reviewing': mark-reviewed + enter-review (editorial)
"
```
