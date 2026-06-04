# TASK-204（M1-A）：墓园列表 API + `/shelf` 后端别名（无前端、无 move-to-planning）

> **里程碑**：M1-A  
> **执行顺序**：200 → 201 → 202 → 203 → **204**  
> **§0**：`move-to-planning` 归属 **TASK-202 #12 完整**；本卡 **不**实现该端点。

---

## 目标

`GET /api/v2/graveyard`；`/shelf` 后端 Deprecation/308；**不**改前端；**不**重复 `move-to-planning`。

---

## In-scope / Out-of-scope

| In-scope | Out-of-scope |
|----------|----------------|
| `backend/src/routes/graveyard.ts`（新建） | `POST .../move-to-planning`（→ **TASK-202 #12**） |
| `index.ts` 注册 `prefix: '/api/v2/graveyard'` | `App.tsx` `/shelf` 跳转（M3 C-22） |
| `GET /graveyard`、`GET /graveyard/shelf` 别名 | Layout 墓园 L1（M1-B） |
| `move-to-draft` 注释 successor（L480~485） | C-20/C-21 |

---

## 关联冲突点

[C-05](../design/code-conflict-analysis.md) [C-06](../design/code-conflict-analysis.md) [C-22](../design/code-conflict-analysis.md)

---

## 具体改动

### 1. ~~move-to-planning~~ — **不在本卡**

验收 #12 见 TASK-202：`curl POST .../move-to-planning`。

### 2. `graveyard.ts`（~70 行）

`deletedAt IS NOT NULL` 的 Project + Proposal；返回 `greenlitAt` 供后续总账只读。

### 3. `GET /shelf` → 308 `/api/v2/graveyard` + `Deprecation`

### 4. 与 TASK-202 #8/#9 联调

graveyard 列表与 `restore` 一致；`status=shelved` 且无 `deletedAt` **不**入列表（默认）。

---

## 依赖前置

- **TASK-200**（`deletedAt`）  
- **TASK-202**（`soft-delete`/`restore`、**#12**）— 验收需 202 已含 #12  

**不依赖** TASK-203。

---

## 验证清单

1. **TASK-202** 已验 #12 `move-to-planning`  
2. `GET /api/v2/graveyard` 仅 `deletedAt != null`  
3. `GET /api/v2/graveyard/shelf` → `Deprecation` + 同 payload 或 308  

---

## 预估改动行数

~75 行（无 `projects.ts` move-to-planning 增量）

---

## 不变量验证

墓园与 status 解耦；`shelved` ≠ 墓园。

---

## 回滚方案

`git revert <TASK-204-commit>`
