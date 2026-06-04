# TASK-202（M1-A）：语义化端点 — 13 条流转 API + evaluate 内化

> **里程碑**：M1-A  
> **执行顺序**：200 → 201 → **202** → 203 → 204  
> **§0**：[`metadata-keys.ts`](../../backend/src/constants/metadata-keys.ts) · 下表为 13 端点契约

---

## §0 — 13 端点契约表

| # | 路径 | 方法 | from→to | 时间戳 / 副作用 | TASK-203 | 实现卡 |
|---|------|------|---------|-----------------|----------|--------|
| 1 | `/proposals/:id/accept-into-planning` | POST | `created`→`approved` + 新建 Project `planning` | `submittedToPlanningAt`；双向 `proposalId`/`projectId`；`META_KEYS` | 专端点，不走 transition | **202** |
| 2 | `/proposals/:id/reject` | POST | `created`→`creating` | `_rejectedAt` | 专端点 | **202** |
| 3 | `/projects/:id/confirm-greenlight` | POST | `planning`→`planned` | `greenlitAt` | 专端点 | **202** |
| 4 | `/projects/:id/start-writing` | POST | `planned`→`writing` | `writingStartedAt` | 专端点 | **202** |
| 5 | `/projects/:id/mark-written` | POST | `writing`→`written` | `workCompletedAt`；章节 completed 兜底 | 专端点 | **202** |
| 6 | `/projects/:id/submit-review` | POST | `written`→`reviewing` | `submittedToReviewAt` | 专端点 | **202** |
| 7 | `/projects/:id/undo-written` | POST | `written`→`writing` | `workCompletedAt=null` | 专端点 | **202** |
| 8 | `/projects/:id/soft-delete` | POST | 任意（墓园） | `deletedAt=now` | 专端点 | **202** |
| 9 | `/projects/:id/restore` | POST | 墓园恢复 | `deletedAt=null` | 专端点 | **202** |
| 10 | `/projects/:id/soft-shelve` | POST | →`shelved` | `_shelved` | 专端点 | **202** |
| 11 | `/projects/:id/unshelve` | POST | `shelved`→前状态 | 清 `_shelved` | 专端点 | **202** |
| 12 | `/projects/:id/move-to-planning` | POST | `imported`→`planning` | `_planningPhase=setup` | 专端点 | **202 完整实现** |
| 13 | `/proposals/:id/evaluate` | PUT | `approve` 内化 | Deprecation → #1 | 保留+警告 | **202** |

**责任划分**：#12 **`move-to-planning` 在 202 完整实现**；TASK-204 **仅** graveyard GET + `/shelf` API 别名，**不**重复实现 #12。

**默认 status**：TASK-200 只改 schema 注释；本卡所有 `create`/`update` **显式传** status，禁止依赖 `@default("draft")`。

---

## 目标

`proposals.ts` / `projects.ts` 实现上表；`approveProposal` → `Project(planning)` + `META_KEYS_DAY1`。

---

## In-scope / Out-of-scope

| In-scope | Out-of-scope |
|----------|----------------|
| `proposals.ts` L51~127、L218~284 | 前端 |
| `projects.ts` 新增 POST（含 **#12 完整**） | `GET /graveyard`（→ 204） |
| `project-transitions.ts` | C-20/C-21 UI |
| `metadata-keys` + `statuses` 引用 | 203 中间件接入 |

---

## 关联冲突点

[C-04](../design/code-conflict-analysis.md) [C-15](../design/code-conflict-analysis.md) [C-17](../design/code-conflict-analysis.md)

---

## 具体改动

### 1. `proposals.ts` — #1 #2 #13

`accept-into-planning` / `reject`；`evaluate` → 调 #1 + `Deprecation` header。

### 2. `projects.ts` — #3~#12

`move-to-planning` 骨架：

```typescript
import { META_KEYS_DAY1 } from '../constants/metadata-keys'
// POST /:id/move-to-planning — 202 完整；204 不重复
if (project.status !== 'imported') return 400
await prisma.project.update({
  data: {
    status: 'planning',
    metadata: { ...meta, [META_KEYS_DAY1.PLANNING_PHASE]: 'setup' },
  },
})
```

### 3. `GET /projects` — `deletedAt: null`

---

## 依赖前置

TASK-200、TASK-201（脚本已审阅）

---

## 验证清单

1. #1 curl → `approved` + `planning` + `submittedToPlanningAt`  
2. #13 → 同 #1 + `Deprecation`  
3. #3 confirm-greenlight 缺架构 → 400  
4. #12 `imported` → `planning` + `_planningPhase=setup`（**202**，非 204）  
5. #4 前 transition `writing`→`planning` → 422/400

---

## 预估改动行数

~430 行

---

## 不变量验证

跨阶段不退回；`submit-review` 唯一进编审；`soft-delete` 只动 `deletedAt`。

---

## 回滚方案

`git revert <TASK-202-commit>`
