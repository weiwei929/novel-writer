# TASK P4-A+：WorkDetailPage 文集库上下文 + Archive 端点

> **来源**：0608-library-workspace.md §2.1
> **前提**：P4-A 完成后执行

---

## 设计上下文

文集库的`from=library`上下文在 WorkDetailPage 中需要两个能力：
1. **待处理区**（`status=reviewed` + `from=library`）：显示"归入文集"→"归档"操作
2. **`reviewed → archived` 是跨桶转换**（`reviewed` 属 editorial 桶，`archived` 属 terminal 桶），需专用端点绕开 stage-guard

---

## 修改清单

### Backend — 新增 1 端点

**#14 archive** (`POST /projects/:id/archive`)

```typescript
// #14 archive — reviewed → archived，绕开 stage-guard 跨桶拦截
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
    return ApiResponse.success(withMappedProjectStatus(updated), '作品已归档')
  } catch (e: unknown) {
    if (e instanceof ProjectNotFoundError) {
      return reply.status(404).send(ApiResponse.error(e.message, 404))
    }
    if (e instanceof StatusNotAllowedError) {
      return reply.status(400).send(ApiResponse.error(e.message, 400))
    }
    const message = e instanceof Error ? e.message : 'archive failed'
    return reply.status(500).send(ApiResponse.error(message, 500))
  }
})
```

**文件**: `backend/src/routes/projects.ts` — 追加在 `#13 unshelve` 之后

---

### Frontend — 2 文件修改

#### 1. `frontend/src/services/api.ts` — 新增 1 wrapper

在 `markReviewed` 之后追加：

```typescript
async archiveProject(id: string): Promise<Project> {
  const response = await api.post(`/projects/${id}/archive`)
  return response.data
},
```

#### 2. `frontend/src/pages/WorkDetailPage.tsx` — 文集库上下文

##### 2a. 上下文变量（约 L130）

```typescript
const isLibraryContext = from === 'library'
```

##### 2b. badgePhase 扩展

```typescript
const badgePhase: PhaseContext = isPlanningContext
  ? 'planning'
  : isWritingContext
    ? 'studio'
    : isEditorialContext
      ? 'editorial'
      : isLibraryContext
        ? 'library'
        : 'studio'
```

##### 2c. handleBack 新增分支

在 `if (isEditorialContext)` 分支后追加：

```typescript
if (isLibraryContext) {
  navigate('/library')
  return
}
```

##### 2d. stageManageButton 条件扩展

```typescript
const stageManageButton = !isPlanningContext && !isWritingContext && !isEditorialContext && !isLibraryContext
  ? (...)
  : null
```

##### 2e. `case 'reviewed'` 新增文集库分支

在 `case 'reviewing'` 之后、`case 'completed'` 之前插入：

```typescript
case 'reviewed':
  if (isLibraryContext) {
    return (
      <>
        <button
          onClick={() => void handleStageAction('归入文集', () => {
            setShowLibraryPicker(true)
            return Promise.resolve()
          })}
          className="px-3 py-1.5 text-sm border border-emerald-200 text-emerald-800 rounded-lg hover:bg-emerald-50"
        >
          归入文集
        </button>
        <button
          onClick={() => void handleStageAction('归档', () => projectsApi.archiveProject(project.id))}
          className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          归档
        </button>
      </>
    )
  }
  return stageManageButton
```

**流程**：用户先选"归入文集"→ 选择/创建 Collection → 再点"归档"→ `reviewed → archived`

##### 2f. `case 'archived'` — 保持现有（只在文集库可见，不额外渲染）

`archived` 当前返回 `null`（L454），保持不动。已归档作品直接通过 `/library/:id` 查看，不走 WorkDetailPage。

---

## 影响范围

| 文件 | 变更类型 | 行数 |
|------|---------|------|
| `backend/src/routes/projects.ts` | 新增 #14 archive | ~20 行 |
| `frontend/src/services/api.ts` | 新增 archiveProject wrapper | ~4 行 |
| `frontend/src/pages/WorkDetailPage.tsx` | 上下文 + actions + handleBack | ~30 行 |

**总计**：~55 行，3 文件。

---

## 不变量检查

- [ ] `archive` 端点仅接受 `status=['reviewed']`
- [ ] `archived` 是状态机终态（不回流）
- [ ] 文件暂存 restore 仍回到 `archived`（不改 status）
- [ ] 文集库上下文**不**显示 StageTransitionModal
- [ ] 非文集库上下文的 `case 'reviewed'` 行为不变（fallback）
- [ ] `from=library` 返回导航到 `/library`，不丢失上下文
- [ ] badgePhase `library` 标签显示"已归档作品"
