# TASK-204（M1-A）：#12 move-to-planning + 墓园 API + `/shelf` 308

> **里程碑**：M1-A  
> **执行顺序**：200 → 201 → 202 → 203 → **204**  
> **§0**：`move-to-planning`（#12）归属 **TASK-204 完整实现**；与 TASK-202.md §0 一致。

---

## 目标

`POST /projects/:id/move-to-planning`（#12）；`GET /api/v2/graveyard`；`/shelf` 308 迁墓园；`move-to-draft` 410 + successor；**不改前端**。

---

## In-scope / Out-of-scope

| In-scope | Out-of-scope |
|----------|----------------|
| `projects.ts` #12 `move-to-planning`（`imported`→`planning` + `_planningPhase=setup`） | `App.tsx` `/shelf` 跳转（M3 C-22） |
| `backend/src/routes/graveyard.ts`（新建） | Layout 墓园 L1（M1-B） |
| `backend/src/routes/shelf.ts`（308 + Deprecation） | C-20/C-21 UI |
| `index.ts` 注册 `prefix: '/api/v2/graveyard'`、`/api/v2/shelf` | `prisma migrate` apply |
| `move-to-draft` 410 + Link successor（L490~495） | |

---

## 关联冲突点

[C-05](../design/code-conflict-analysis.md) [C-06](../design/code-conflict-analysis.md) [C-22](../design/code-conflict-analysis.md)

---

## 具体改动

### 1. `move-to-planning`（#12 — **本卡完整实现**）

- 主路径：`imported` → `planning` + `metadata._planningPhase=setup`
- Legacy：`draft` + import 标记（`_sourceFrom=import` / `_fromImport`）读兼容
- INSERT 于 `confirm-greenlight` 之前；不走 stage-guard / transition

### 2. `graveyard.ts`（~60 行）

`deletedAt IS NOT NULL` 的 Project + Proposal；`GET ?type=project|proposal|all`；`status=shelved` 且无 `deletedAt` **不**入列表。

### 3. `GET /shelf` → 308 `/api/v2/graveyard` + `Deprecation` + `Warning: 299`

### 4. 与 TASK-202 #8/#9 联调

graveyard 列表与 `restore` / `soft-delete` 一致。

---

## 依赖前置

- **TASK-200**（`deletedAt`）  
- **TASK-202**（`soft-delete`/`restore` 等语义端点）  
- **TASK-203**（transition 硬拒，无强依赖）

---

## 验证清单

1. `curl POST .../move-to-planning` → `planning` + `_planningPhase=setup`  
2. `GET /api/v2/graveyard` 仅 `deletedAt != null`  
3. `GET /api/v2/shelf` → 308 + `Location` + Deprecation  
4. `POST .../move-to-draft` → 410 + Link successor  
5. `confirm-greenlight` 回归 200  

---

## 预估改动行数

~160 行（含 `projects.ts` move-to-planning + graveyard + shelf + docs）

---

## 不变量验证

墓园与 status 解耦；`shelved` ≠ 墓园。

---

## 回滚方案

`git revert <TASK-204-commit>`
