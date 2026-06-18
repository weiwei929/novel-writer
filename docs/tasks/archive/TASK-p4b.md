# TASK P4-B：LibraryDetailPage 整理

> **来源**：0608-library-workspace.md
> **前提**：P4-A / P4-A+ 完成后执行

---

## 修改清单（1 文件）

### `frontend/src/pages/LibraryDetailPage.tsx`

#### 1. ProjectStatusBadge 传 phase (L50, L185, L216)

```typescript
// 全部 ProjectStatusBadge 加 phase="library"
<ProjectStatusBadge status={project.status} phase="library" />
```

三处修改：
- L50（未归档提示）
- L185（加载失败提示）
- L216（详情页标题栏）

#### 2. 确认文件暂存 restore 行为

当前 `soft-delete` 后 `restore` 回到 `archived`（符合设计：文件暂存 restore 不改 status，只清 `deletedAt`）。

现有代码已正确处理（L139-156）：调用 `softDelete` → 导航到 `/library`。

不需要额外修改，但建议在 `handleConfirmFileStaging` 恢复导航后增加 toast 消息确认。

#### 3. 导出按钮确认

当前没有导出按钮（但在 WorkDetailPage 的 `case 'completed'` 有导出）。如果需要，可增加：

```typescript
<button onClick={() => void handleExport()} ...>
  导出
</button>
```

**导出暂不添加** — 保持现有行为不变。

#### 4. AI 书评占位保留

L98 `handleEditReview` 和 L361-380 书评板块保持现有占位，标注 `Day 3 接入`。

---

## 影响范围

| 文件 | 变更类型 | 行数 |
|------|---------|------|
| `LibraryDetailPage.tsx` | badge phase + 确认 restore 行为 | ~3 行 |

---

## 不变量检查

- [ ] `phase="library"` 标签正确显示"已归档作品"
- [ ] 文件暂存 restore 后 status 保持 `archived`
- [ ] 书评板块仍为 Day 3 占位
- [ ] 文集库不提供正文编辑入口
- [ ] 仅 `archived` 作品可在 LibraryDetailPage 查看
