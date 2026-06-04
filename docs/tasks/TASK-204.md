# TASK-204（M1-A）：imported 入企划 + 墓园/暂存后端路由（无前端跳转）

> **里程碑**：M1-A  
> **执行顺序**：200 → 201 → 202 → 203 → **204**（可与 203 并行开发，但合并顺序在 203 之后）  
> **权威设计**：[`overall-architecture.md`](../design/overall-architecture.md) §8.2 墓园、§4 `imported`

---

## 目标

实现 `imported`→`planning` 的 `move-to-planning` 语义（与 TASK-202 契约一致）；提供墓园 **只读列表** API；`/shelf` 后端别名重定向到 graveyard 查询；**不**改前端路由与 Layout。

---

## In-scope / Out-of-scope

| In-scope | Out-of-scope |
|----------|----------------|
| `projects.ts` `move-to-planning` 实现体（若 202 仅 stub，本卡补全） | `App.tsx` `/shelf`→`/graveyard` 跳转（M3 **C-22**） |
| `backend/src/routes/graveyard.ts`（新建）或 `projects.ts` 子路由 | `Layout.tsx` 墓园 L1（M1-B **C-11**） |
| `GET /api/v2/graveyard`（`deletedAt IS NOT NULL`） | `WorkDetailPage` 墓园 UI |
| `POST /api/v2/shelf` → 308/rewrite 到 graveyard 逻辑（**仅 API 层**） | 批量永久 DELETE UI |
| `move-to-draft` 保持 **410**（L480~485） | C-20/C-21 |

---

## 关联冲突点

| 编号 | 说明 |
|------|------|
| [C-05](../design/code-conflict-analysis.md) | `imported` 状态保留 |
| [C-06](../design/code-conflict-analysis.md) | `move-to-draft` 废弃 → `move-to-planning` |
| [C-22](../design/code-conflict-analysis.md) | `/shelf` 与墓园语义（本卡仅后端） |

---

## 具体改动

### 1. `move-to-planning`（`projects.ts`，与 TASK-202 对齐）

```typescript
// POST /projects/:id/move-to-planning
// 前置: status === 'imported', deletedAt == null
// 后置: status = 'planning', metadata._planningPhase = 'setup'
app.post('/:id/move-to-planning', async (req, reply) => {
  // ...
})
```

替换 `move-to-draft`（L480~485）文档注释为「 successor: move-to-planning」。

### 2. 新建 `backend/src/routes/graveyard.ts`（~70 行）

```typescript
export async function graveyardRoutes(app: FastifyInstance) {
  // GET / — Project + Proposal where deletedAt != null
  app.get('/', async (req, reply) => {
    const projects = await prisma.project.findMany({
      where: { deletedAt: { not: null } },
      select: { id, title, status, deletedAt, metadata, proposalId },
    })
    const proposals = await prisma.proposal.findMany({
      where: { deletedAt: { not: null } },
      ...
    })
    return ApiResponse.success({ projects, proposals })
  })
}
```

注册：`backend/src/index.ts` L47 后：

```typescript
server.register(graveyardRoutes, { prefix: '/api/v2/graveyard' })
```

### 3. `/shelf` 后端兼容（不碰前端）

方案 A（推荐）：`graveyard.ts` 内

```typescript
app.get('/shelf', async (_req, reply) => {
  reply.header('Deprecation', 'true')
  reply.redirect(308, '/api/v2/graveyard')
})
```

方案 B：`projects.ts` 保留 `POST /:id/shelve`（L566~607）但文档标记 Deprecated；新墓园删除走 TASK-202 `soft-delete`。

**OR 查询**（设计债，本卡注释即可）：旧数据 `status=shelved` 且无 `deletedAt` 是否在 graveyard 列表合并展示 — 默认 **否**，仅 `deletedAt`。

### 4. `soft-delete` / `restore`（TASK-202）与本卡联调

- graveyard GET 与 `restore` 端点行为一致  
- `restore` 禁止恢复已物理删除记录  

---

## 依赖前置

- **TASK-200**（`deletedAt` 列）  
- **TASK-202** 推荐（`soft-delete`/`restore`）；本卡可独立 merge，但验收需 202  

**不依赖** TASK-203（阶段守卫与墓园正交）。

---

## 验证清单

1. `curl POST .../projects/:id/move-to-planning`（`imported`）→ `planning` + `_planningPhase=setup`  
2. `curl GET /api/v2/graveyard` 仅含 `deletedAt != null` 记录  
3. `curl GET /api/v2/graveyard/shelf`（若实现）→ `Deprecation` + 与 graveyard 同 payload 或 308  

---

## 预估改动行数

| 文件 | 约 |
|------|-----|
| `graveyard.ts` | +70（新） |
| `index.ts` | +2 |
| `projects.ts` | +50 |
| **合计** | **~120 行** |

---

## 不变量验证

- **墓园**：`deletedAt` 与 `status` 解耦；列表不按 stage 过滤（§8.2）。  
- **主动暂存**：`status=shelved` **≠** 墓园（`soft-shelve` vs `soft-delete`）。  
- **立项总账**：graveyard 作品若 `greenlitAt` 非空，仍可在总账查询（M1-B 208；本卡 API 返回 `greenlitAt` 字段即可）。

---

## 回滚方案

`git revert <TASK-204-commit>`；`unregister` graveyard 路由。
