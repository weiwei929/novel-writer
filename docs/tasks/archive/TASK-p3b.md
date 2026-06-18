# TASK P3-B：ReviewDetailPage 整理

> **来源**：0608-editorial-workspace.md §4
> **基线**：VPS HEAD（P3-A 5022026 已在 VPS）
> **前提**：P3-A+ 完成后执行（需要 `mark-reviewed` 端点可用）

---

## 修改清单（1 文件）

### `frontend/src/pages/ReviewDetailPage.tsx`

#### 1. ProjectStatusBadge 传 phase (L87, L133, L242)

```typescript
// 全部 ProjectStatusBadge 加 phase="editorial"
<ProjectStatusBadge status={p.status} phase="editorial" />
```

三处修改：
- L87 (卡片列表 — 但 P3-A 已改为 EditorialPage 渲染，ReviewDetailPage 只显示单项目标状态)
- L133 (`不在编审队列` 提示)
- L242 (详情页标题栏)

#### 2. "标记已审" → 真实 API 调用 (L79-81)

```typescript
const handleMarkReviewed = async () => {
  if (!project) return
  try {
    await projectsApi.markReviewed(project.id)
    notifySuccess('审阅完成', '作品已标记为已审阅')
    await load()
  } catch (e: unknown) {
    notifyError(
      '操作失败',
      e instanceof Error ? e.message : '无法标记审阅完成'
    )
  }
}
```

同时更新按钮文案（L261）：
```typescript
"标记已审" → "确认审阅完成"
```

#### 3. handleGenerateReport 保留占位 (L83-85)

```typescript
// 保持现有占位不变，仅更新注释
const handleGenerateReport = () => {
  notifyInfo('生成报告', 'AI 审查（Day 3 接入）')
}
```

---

## 影响范围

| 文件 | 变更类型 | 行数 |
|------|---------|------|
| `ReviewDetailPage.tsx` | badge phase + API 调用 + 文案 | ~15 行 |

---

## 不变量检查

- [ ] `mark-reviewed` 端点已在 P3-A+ 后可用
- [ ] 确认审阅完成后状态变为 `reviewed`
- [ ] 审阅报告生成按钮仍为 Day 3 占位（不提前接入 AI）
- [ ] 文件暂存按钮保持现有行为不变
