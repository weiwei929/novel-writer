# TASK P4-A：LibraryPage 三工作区

> **来源**：0608-library-workspace.md §1
> **部门**：文集库（5 部门管线的终态部门）
> **模式**：对标 P3-A EditorialPage 三区改造

---

## 设计上下文

文集库是 5 部门管线的终态部门。编审部审阅完成（`reviewed`）的作品进入文集库，作者在此将其归入文集、归档。

**0608 三工作区映射**：

| 三工作区 | `Project.status` | 上下文标签 | 含义 |
|---------|-----------------|-----------|------|
| 待处理 | `reviewed` | 待归库作品 | 编审部审阅完成，等待归入文集并归档 |
| 进行中 | — | 归类操作 | 文集列表（Collection），创建/编辑文集元数据 |
| 已完成 | `archived` | 已归档作品 | 已归入文集并归档 |

**与现有 LibraryPage 的区别**：
- 当前 LibraryPage 只显示 `archived`（单层列表 + 文集过滤器）
- P4-A 增加 `reviewed` 待处理区 + Collection 进行中区
- P4-A 不改变文集库的只读定位

---

## 修改清单

### `frontend/src/pages/LibraryPage.tsx`

#### 1. 数据加载改为三区

```typescript
const load = useCallback(async () => {
  setLoading(true)
  try {
    const [cols, allProjects] = await Promise.all([
      collectionsApi.getAll(),
      projectsApi.getAll(), // 改为 getAll() 前端过滤
    ])
    setCollections(cols)

    const pending = allProjects.filter(p => p.status === 'reviewed')
    const completed = allProjects.filter(p => p.status === 'archived')
    setPendingProjects(pending)
    setArchivedProjects(completed)
  } catch {
    notifyError('加载失败', '无法获取文集库数据')
  } finally {
    setLoading(false)
  }
}, [notifyError])
```

新增 state:
```typescript
const [pendingProjects, setPendingProjects] = useState<Project[]>([])
const [archivedProjects, setArchivedProjects] = useState<Project[]>([])
```

#### 2. 三区渲染

```
┌─ 文集库 ──────────────────────────┐
│                                     │
│  ├ 待处理（reviewed）               │
│  │   └ 待归库作品卡片               │
│  │   └ 动作：[归入文集→] [📂 文件暂存]│
│  │                                   │
│  ├ 进行中（Collection 列表）          │
│  │   └ 创建/编辑文集                 │
│  │   └ 查看文集内作品                 │
│  │                                   │
│  └ 已完成（archived）                │
│      └ 已归档作品卡片                │
│      └ 动作：[只读查看] [导出] [📂 文件暂存]│
└─────────────────────────────────────┘
```

采用与 WritingProjectsPage / EditorialPage 一致的 Section 组件模式：

```tsx
// 待处理区
<Section title="待归库" count={pendingProjects.length} icon={...}>
  {pendingProjects.map(p => (
    <PendingProjectCard key={p.id} project={p} onOpen={openPending} onStage={...} />
  ))}
</Section>

// 进行中区 — 文集操作（Collection 管理）
<Section title="文集管理" icon={...}>
  <CollectionManagement
    collections={collections}
    onCreate={openCreate}
    onEdit={openEdit}
    onDelete={...}
  />
</Section>

// 已完成区
<Section title="已归档" count={archivedProjects.length} icon={...}>
  {archivedProjects.map(p => (
    <ArchivedProjectCard key={p.id} project={p} onOpen={openArchived} />
  ))}
</Section>
```

#### 3. 导航

| 工作区 | 点击导航 | 目标页面 |
|--------|---------|---------|
| 待处理（reviewed） | `/work/:id?from=library` | WorkDetailPage（文集库上下文） |
| 已完成（archived） | `/library/:id` | LibraryDetailPage（只读详情） |

```typescript
const openPending = (id: string) => navigate(`/work/${id}?from=library`)
const openArchived = (id: string) => navigate(`/library/${id}`)
```

#### 4. 标签

待处理区和已完成区的卡片均使用 `ProjectStatusBadge phase="library"`。

#### 5. 文件暂存按钮

待处理区和已完成区的卡片均保留「📂 放入文件暂存」按钮。

待处理区的文件暂存: `POST /projects/:id/soft-delete` → 从待处理区消失
已完成区的文件暂存: `POST /projects/:id/soft-delete` → 从已完成区消失，可 restore 回 `archived`

---

## 影响范围

| 文件 | 变更类型 | 行数 |
|------|---------|------|
| `LibraryPage.tsx` | 重构为三区布局 | ~100-150 行（从 379 行重构） |

**不新建文件** — 保持在 LibraryPage.tsx 内改造，维持单一文件入口。

---

## 不变量检查

- [ ] 待处理区仅显示 `status=reviewed` 的作品
- [ ] 已完成区仅显示 `status=archived` 的作品
- [ ] 待处理区作品点击跳转 `/work/:id?from=library`
- [ ] 已完成区作品点击跳转 `/library/:id`
- [ ] 进行中区展示 Collection 列表，可创建/编辑/删除文集
- [ ] 文件暂存按钮不影响 status（仅设 `deletedAt`）
- [ ] ProjectStatusBadge 全部使用 `phase="library"`
- [ ] 不显示全局 StageTransitionModal（待 P4-A+ 加 `stageManageButton` 排除）
- [ ] 不出现正文编辑入口（文集库只读定位）
- [ ] 空状态文案合理（"暂无待归库作品" / "暂无已归档作品"）

---

## 参考

- WritingProjectsPage.tsx — 三区 Section 模式（P2-A 已交付）
- EditorialPage.tsx — P3-A 三区改造（5022026 已交付，可参考 VPS 版本）
- 0608-library-workspace.md §1 — 完整信息架构
