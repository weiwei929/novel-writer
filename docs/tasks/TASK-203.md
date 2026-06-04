# TASK-203（M1-A）：跨阶段服务端硬拒 + transition 接入 + 前端 Modal TODO

> **里程碑**：M1-A  
> **执行顺序**：200 → 201 → 202 → **203** → 204  
> **权威设计**：[`overall-architecture.md`](../design/overall-architecture.md) §二「跨阶段不退回」

---

## 目标

新增 `assertSameStage` 中间件/服务，禁止部门间 status 跳转；`POST /projects/:id/transition` 接入校验并对跨阶段请求返回 **400**；旧 transition 保留并打 **Deprecation** warning。前端仅文档级 TODO，**零** TSX 改动。

---

## In-scope / Out-of-scope

| In-scope | Out-of-scope |
|----------|----------------|
| `backend/src/middleware/stage-guard.ts`（新建） | 任何 `frontend/src/**` 实现 |
| `projects.ts` L609~658 `transition`  handler 改造 | `ProposalEvaluateModal` 等组件代码 |
| `docs/tasks/M1-B-STAGE-MODAL-TODO.md`（新建，纯清单） | AuthGuard（C-13） |
| `index.ts` 可选 `preHandler` 注册（若全局） | 删除 `transition` 路由（M3 TASK-218） |

---

## 关联冲突点

| 编号 | 说明 |
|------|------|
| [C-04](../design/code-conflict-analysis.md) | 与 `projects.ts` transition 耦合 |
| [C-14](../design/code-conflict-analysis.md) | `projects.ts` ~816 行；本卡抽取阶段校验 |

---

## 具体改动

### 1. `backend/src/middleware/stage-guard.ts`（新建，~90 行）

```typescript
/** 部门阶段桶 — 同桶内允许 transition；跨桶禁止 */
export const STAGE_BUCKETS: Record<string, readonly string[]> = {
  intake: ['imported'],
  planning: ['planning', 'planned'],
  studio: ['writing', 'written'],      // planned 在 planning 桶 — 见下
  editorial: ['reviewing', 'reviewed'],
  terminal: ['archived'],
  pause: ['shelved'],
}

// v4.1.1: planned 属企划课产出、创作室消费 — 桶边界：
// planning 桶: imported, planning, planned
// studio 桶: writing, written
// 禁止: writing→planning, written→planned, reviewing→writing, ...

export function assertSameStage(from: string, to: string): void {
  if (bucketOf(from) !== bucketOf(to)) {
    throw new StageTransitionError('CROSS_STAGE_FORBIDDEN', { from, to })
  }
}

export function assertAllowedTransition(from: string, to: string): void {
  assertSameStage(from, to)
  // 桶内白名单，如 written→writing ✓；planning→draft ✗
}
```

**桶内白名单**（替换 `ALLOWED_TRANSITIONS` L250~257 的跨桶项）：

| from | 允许 to |
|------|---------|
| `planning` | `planning`（仅 metadata）、`planned` 由 **confirm-greenlight** 专端点 |
| `planned` | `writing`（start-writing） |
| `writing` | `written`、`writing` |
| `written` | `writing`（undo-written）、`reviewing`（submit-review 专端点） |
| `reviewing` | `reviewed`、`reviewing` |
| `reviewed` | `reviewing`（撤销定稿） |

`transition` 通用端点：仅允许**同桶**且在该白名单内；否则 400。

### 2. `projects.ts` L609~658 改造骨架

```typescript
import { assertAllowedTransition, StageTransitionError } from '../middleware/stage-guard'

// 在 from/to 解析后：
try {
  assertAllowedTransition(from, to)
} catch (e) {
  if (e instanceof StageTransitionError) {
    return reply.status(400).send(ApiResponse.error(
      `跨阶段流转已禁止，请使用语义端点（${e.code}）`, 400))
  }
  throw e
}
reply.header('Deprecation', 'true')
reply.header('Warning', '299 - "Use POST /confirm-greenlight, /start-writing, ..."')
```

删除或收窄 L250~257 中 `planning→draft`、`writing→planning` 等跨阶段项。

### 3. `docs/tasks/M1-B-STAGE-MODAL-TODO.md`（新建，~25 行，**非代码**）

```markdown
# M1-B 前端 Modal 拆解（本里程碑不做）

| 旧 StageTransitionModal | 新组件 | 调用端点 |
|-------------------------|--------|----------|
| 企划评估 | ProposalEvaluateModal | accept-into-planning / reject |
| 正式立项 | ConfirmGreenlightModal | confirm-greenlight |
| 提交审阅 | SubmitReviewModal | submit-review |
| 文集入库 | ArchiveModal | archived（M1-B+） |
```

### 4. TASK-202 新端点

各语义端点**不经过** `transition`，但内部可复用 `assertSameStage` 防止误用（如 `mark-written` 仅允许 `writing`→`written`）。

---

## 依赖前置

- **TASK-202**（语义端点存在，transition 降级为兼容层）。

---

## 验证清单

1. `curl POST .../transition -d '{"to":"planning"}'` 当 `from=writing` → **400** + body 含 `CROSS_STAGE_FORBIDDEN`  
2. `curl POST .../transition -d '{"to":"writing"}'` 当 `from=written` → **200**（同创作室桶内撤销型，若白名单允许）或引导 `undo-written`  
3. 响应头 `Deprecation: true` 存在于 `transition` 成功与失败路径  

---

## 预估改动行数

| 文件 | 约 |
|------|-----|
| `stage-guard.ts` | +90 |
| `projects.ts` | +40 / 删 15 |
| `M1-B-STAGE-MODAL-TODO.md` | +25 |
| **合计** | **~130 行** |

---

## 不变量验证

- **跨阶段不退回**（§二）：400 文案明确指向语义端点。  
- **三选一节点**：transition 不得替代 `accept-into-planning` / `confirm-greenlight` / `submit-review` / 归档。  
- **软删除**：transition 不得把作品移入墓园（用 `soft-delete`）。

---

## 回滚方案

`git revert <TASK-203-commit>`；恢复 `ALLOWED_TRANSITIONS` 旧表。
