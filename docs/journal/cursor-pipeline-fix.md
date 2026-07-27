# Pipeline 断裂修复（P0 × 3）

---

## P0-1: 创意讨论提交设 `submitted` 而非 `draft`

### 文件
`frontend/src/components/creative/CreativeDiscussion.tsx`

### 改动
`:160` 将 `status: 'draft'` 改为 `status: 'submitted'`

```typescript
// 改前
await proposalsApi.update(selectedId, {
  title: title.trim() || '未命名提案',
  synopsis: evaluation.slice(0, 500),
  references,
  metadata: {
    _evaluation: evaluation,
    _tags: tags,
    _discussionSubmitted: true,
    ...(type1Ref ? { _sourceRef: { type: 'file_ref', id: type1Ref.id, title: type1Ref.title } } : {}),
  },
  status: 'draft',
})

// 改后
await proposalsApi.update(selectedId, {
  title: title.trim() || '未命名提案',
  synopsis: evaluation.slice(0, 500),
  references,
  metadata: {
    _evaluation: evaluation,
    _tags: tags,
    _discussionSubmitted: true,
    ...(type1Ref ? { _sourceRef: { type: 'file_ref', id: type1Ref.id, title: type1Ref.title } } : {}),
  },
  status: 'submitted',
})
```

### 验证
- `PROPOSAL_STATUSES`（`proposals.ts:9`）包含 `'submitted'` ✅
- `canAcceptIntoPlanning('submitted')` → `mapProposalStatus('submitted')` = `'created'` → 返回 true ✅
- `ProposalReviewPage.tsx:29` 过滤 `status !== 'draft'` → 提交后立即可见 ✅

---

## P0-2: 从创意组 `PlanningProposal` 移除 approve 按钮

### 文件
`frontend/src/components/creative/PlanningProposal.tsx`

### 改动
删除 approve 逻辑和 UI，保留 reject（退回创意讨论）、shelve（暂存审查池）、submitToReview（送审）。

#### 具体：
1. 删除 `handleEvaluate` 中 `action === 'approve'` 分支（`:42-56` 区域）
2. 删除 "同意立项" 按钮 JSX（`:126-135` 附近）
3. 可选：删除 `proposalsApi.evaluate` 调用（如果只剩 reject/shelve 则保留）
4. 清理不再使用的 import（`IconCheckCircle` 如果只剩 reject/shelve）

#### 效果
创意组 `PlanningProposal` 组件只能：
- 送审（submitToReview）→ 提案进入企划课评估列表
- 退回（reject）→ 退回创意讨论
- 暂存（shelve）→ 移入作品暂存

立项评估（approve/accept-into-planning）只能通过企划课的 `ProposalEvalPage` 操作。

---

## P0-3: 文案修正 — 消除"已立项"错觉

### 文件
`frontend/src/services/api.ts`

### 改动
`:89` 附近 `PROPOSAL_STATUS_LABEL`：

```typescript
// 改前
approved: '已立项',
// 改后
approved: '已通过评估',
```

### 补充
确认 `Project` 各 status 的标签（`getStatusLabel` 或类似函数），确保 `planning` 显示为「企划中」而非「已立项」：

| status | 应有中文标签 |
|--------|------------|
| `planning` | 企划中 |
| `planned` | 已立项 |
| `writing` | 创作中 |
| `written` | 已完成 |
| `reviewing` | 审阅中 |
| `reviewed` | 审阅完成 |
| `archived` | 已归档 |

在相应标签映射文件中查找并修正。

---

## 验证

```
npm run build → exit 0
```

手动验证路径：
1. 创意组提交提案 → 企划课 `/planning/proposals` 立即可见
2. 创意组 `PlanningProposal` 无「同意立项」按钮
3. 企划课 `ProposalEvalPage` 可 approve → Project `planning`
4. 文案显示「已通过评估」而非「已立项」
