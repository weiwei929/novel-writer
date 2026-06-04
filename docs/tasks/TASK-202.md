# TASK-202（M1-A）：语义化端点 — 13 条流转 API + evaluate 内化

> **里程碑**：M1-A  
> **执行顺序**：200 → 201 → **202** → 203 → 204  
> **权威设计**：[`overall-architecture.md`](../design/overall-architecture.md) §0 端点表、§二 四节点

---

## 目标

在 `proposals.ts` / `projects.ts` 新增 v4.1 语义端点；`approveProposal` 改为创建 `Project(planning)` 并写时间戳与 `proposalId`；旧 `evaluate` / `approve` **保留**但行为对齐新语义。

---

## In-scope / Out-of-scope

| In-scope | Out-of-scope |
|----------|----------------|
| `backend/src/routes/proposals.ts`（全文 ~301 行，重点 L51~127、L218~284） | 前端 `api.ts` / Modal |
| `backend/src/routes/projects.ts`（L566~694 邻域新增；`ALLOWED_TRANSITIONS` 暂保留） | 跨阶段硬拒逻辑细节（→ TASK-203 接入） |
| `backend/src/constants/statuses.ts`（TASK-200）Zod 引用 | 墓园列表 GET（→ TASK-204） |
| 旧端点 `Deprecation` 响应头或 body warning | C-20/C-21 UI |

---

## 关联冲突点

| 编号 | 说明 |
|------|------|
| [C-04](../design/code-conflict-analysis.md) | 缺语义端点；`projects.ts` 体积 |
| [C-15](../design/code-conflict-analysis.md) | Proposal 双轨 / evaluate 路径 |
| [C-17](../design/code-conflict-analysis.md) | `approve` → `Project(draft)` 需改为 `planning` |

---

## 具体改动

### 1. `proposals.ts` — 新增（注册在 `proposalRoutes` 末尾前）

| 方法 | 路径 | 行为骨架 |
|------|------|----------|
| POST | `/:id/accept-into-planning` | `created`→`approved`；`tx.project.create({ status:'planning', proposalId, submittedToPlanningAt: now, metadata:{_fromEvaluate:true} })`；双向 `proposalId`/`projectId` |
| POST | `/:id/reject` | `created`→`creating`（或保持 `created`+metadata `_rejectedAt`）；**不**删提案 |

`approveProposal`（L51~127）改写要点：

```typescript
// L62~72 附近
status: 'planning',
proposalId: proposal.id,  // 待 schema
submittedToPlanningAt: new Date(),
metadata: { _fromEvaluate: true, _sourceFrom: 'proposal', ... },
```

`PUT /:id/evaluate`（L218~270）：`action==='approve'` 内部改调 `acceptIntoPlanning`；响应加：

```typescript
reply.header('Deprecation', 'true')
reply.header('Link', '</api/v2/proposals/:id/accept-into-planning>; rel="successor"')
```

### 2. `projects.ts` — 新增 POST handlers（建议 L695 前集中注册）

| 路径 | from → to | 时间戳 |
|------|-----------|--------|
| `/:id/confirm-greenlight` | `planning`→`planned` | `greenlitAt=now`；校验 3 必填（title/synopsis/metadata 章节架构） |
| `/:id/start-writing` | `planned`→`writing` | `writingStartedAt` |
| `/:id/mark-written` | `writing`→`written` | `workCompletedAt`；`chapter.updateMany({ status:'completed' })` 兜底 |
| `/:id/submit-review` | `written`→`reviewing` | `submittedToReviewAt` |
| `/:id/undo-written` | `written`→`writing` | `workCompletedAt=null` |
| `/:id/soft-delete` | 任意 | `deletedAt=now`（**不改** status） |
| `/:id/restore` | 墓园 | `deletedAt=null`（与 L660~694 旧 shelve-restore **拆分语义**） |
| `/:id/soft-shelve` | 非墓园 | `status=shelved` + `_shelved` metadata（主动暂存，§0） |
| `/:id/unshelve` | `shelved`→`metadata._shelved.previousStatus` | |
| `/:id/move-to-planning` | `imported`→`planning` | 见 TASK-204 |

共享 helper（新建 `backend/src/services/project-transitions.ts`，~80 行）：

```typescript
export async function assertProjectExists(id: string) { ... }
export function setTimestampIfNull(project, field: keyof Project, now = new Date()) { ... }
```

### 3. 默认列表过滤

`GET /projects`（L530~564）：追加 `where: { deletedAt: null }`（墓园条目仅 TASK-204 graveyard 查）。

### 4. 端点计数（13 语义 + 旧 evaluate）

1~2 提案；3~11 作品；12 `move-to-planning`（204 可拆分但 202 定义契约）；13 `evaluate` 内化。  
**本卡至少实现 1~11 + evaluate 改写**；12 可与 204 联调。

---

## 依赖前置

- **TASK-200** schema  
- **TASK-201** 脚本已审阅（端点可在空库集成测试，存量靠 201）

---

## 验证清单

1. `curl -X POST .../proposals/:id/accept-into-planning` → Proposal `approved` + Project `planning` + `submittedToPlanningAt` 非空  
2. `curl -X PUT .../evaluate -d '{"action":"approve"}'` → 同上 + 响应含 `Deprecation`  
3. `curl -X POST .../projects/:id/confirm-greenlight` 在缺章节架构时 **400**；补齐后 **200** 且 `greenlitAt` 非空  
4. `curl -X POST .../transition -d '{"to":"planning"}'` 从 `writing` 仍 **422/400**（203 前可能 422；203 后统一 400 跨阶段）

---

## 预估改动行数

| 文件 | 约 |
|------|-----|
| `proposals.ts` | +90 / 改 40 |
| `projects.ts` | +220 |
| `project-transitions.ts` | +80（新） |
| **合计** | **~430 行** |

---

## 不变量验证

- **跨阶段不退回**：`confirm-greenlight` 后禁止端点把 `planned` 打回 `planning`（仅 metadata 子状态，§0）。  
- **节点 #3**：`submit-review` 是唯一 `written`→`reviewing` 入口。  
- **墓园**：`soft-delete` 只动 `deletedAt`。

---

## 回滚方案

`git revert <TASK-202-commit>`；端点为增量化，旧 `transition` 仍可用。
