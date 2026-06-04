# TASK-200（M1-A）：Prisma Schema 扩展 — 时间戳 / 字段 / 状态枚举

> **里程碑**：M1-A（纯后端）  
> **执行顺序**：**200 → 201 → 202 → 203 → 204**（本卡第一）  
> **权威设计**：[`overall-architecture.md`](../design/overall-architecture.md) §0、[`v2-migration-map.md`](../design/v2-migration-map.md) §0

---

## §0 契约（审阅必读）

### 状态字面量计数

| 模型 | 主体 | 兼容别名（仅存量读） | 合计 |
|------|------|----------------------|------|
| **Project.status** | 10：`imported` `planning` `planned` `writing` `written` `reviewing` `reviewed` `archived` `shelved` | 2：`draft` `completed` | **12** |
| **Proposal.status** | 4：`creating` `created` `approved` `shelved` | 4：`draft` `submitted` `evaluated` `rejected` | **8** |

新写入禁止 `draft`/`completed`（Project）及 Proposal 兼容别名。

### `META_KEYS_DAY1`（与 201/202 共用）

实现文件：`backend/src/constants/metadata-keys.ts`（本里程碑随文档提交契约，TASK-201/202 实现时 `import { META_KEYS_DAY1 } from '../constants/metadata-keys'`）。

| 键常量 | JSON 路径 | 类型 |
|--------|-----------|------|
| `FROM_EVALUATE` | `_fromEvaluate` | boolean |
| `SOURCE_FROM` | `_sourceFrom` | `'proposal' \| 'import' \| 'seed' \| ...` |
| `PROPOSAL_ID_LEGACY` | `_proposalId` | string（迁移期） |
| `PLANNING_PHASE` | `_planningPhase` | `'evaluating' \| 'setup' \| 'deferred'` |
| `DISCUSSION_SUBMITTED` | `_discussionSubmitted` | boolean |
| `SHELVED` | `_shelved` | `{ previousStatus, shelvedAt, source }` |
| `REJECTED_AT` | `_rejectedAt` | ISO Date string |

### Proposal ↔ Project 关系（VPS 现状 + Day 1 扩展）

| 字段 | 模型 | 现状 | Day 1 |
|------|------|------|-------|
| `projectId` | Proposal | 可选 FK → `Project.id`；`project Project? @relation(fields: [projectId], references: [id])`（**无** relation 名） | **保留**；立项后「本提案创建的作品」 |
| `proposals` | Project | `Proposal[]` 反向集合（一对多：一项目可被多提案引用，实际通常 1 条） | **保留** |
| `proposalId` | Project | **无** | **新增** `@unique`；「主提案」FK → `Proposal.id` |
| `primaryForProject` | Proposal | **无** | **新增** `@relation("ProposalPrimaryProject")` 反向 1:1 |

**语义**：`accept-into-planning` 后应满足 `Proposal.projectId === Project.id` **且** `Project.proposalId === Proposal.id`（双向一致）。与 `proposals[]` 不冲突：主提案仍出现在 `proposals` 集合中。

**Prisma 双 relation 命名**：

- 既有：`Proposal.project` / `Project.proposals`（默认名）
- 新增：`Proposal.primaryForProject` / `Project.proposal`（`"ProposalPrimaryProject"`）

---

## 目标

在 **不跑** `prisma migrate dev` 的前提下，提交可被 TASK-201 引用的 schema 定稿：Project 增加 7 个时间戳 + `writingStyle` + `deletedAt` + `proposalId`；status 注释对齐上表 12+8 字面量。

---

## In-scope / Out-of-scope

| In-scope | Out-of-scope |
|----------|----------------|
| `backend/prisma/schema.prisma` | 任何 `frontend/**` |
| `backend/src/constants/metadata-keys.ts`（契约） | SQL DML（→ TASK-201） |
| `backend/src/constants/statuses.ts` | HTTP 路由（→ TASK-202~204） |
| `migration.sql` DDL 骨架 | `Chapter.notes`；`migrate dev` |

---

## 关联冲突点

| 编号 | 说明 |
|------|------|
| [C-01](../design/code-conflict-analysis.md) | 7 时间戳 + `writingStyle` + `deletedAt` + `proposalId` |
| [C-02](../design/code-conflict-analysis.md) | Proposal **扩展** |
| [C-03](../design/code-conflict-analysis.md) | Project.status 扩表 |

---

## 具体改动

### 1. `backend/prisma/schema.prisma` — `Project`（约 L26~61）

```prisma
  submittedToPlanningAt DateTime?
  greenlitAt              DateTime?
  writingStartedAt      DateTime?
  workCompletedAt       DateTime?
  submittedToReviewAt   DateTime?
  archivedAt            DateTime?
  deletedAt             DateTime?

  writingStyle String?
  proposalId   String?  @unique
  proposal     Proposal? @relation("ProposalPrimaryProject", fields: [proposalId], references: [id], onDelete: SetNull)

  // Project.status — 12 字面量（10 主体 + 2 兼容别名 draft|completed，新写入禁止别名）
  // imported | planning | planned | writing | written | reviewing | reviewed | archived | shelved
```

**默认 status**：TASK-200 **仅**改 schema `@default` 与注释；创建时 status 由 TASK-202 各端点**显式传入**（不依赖默认值）。

### 2. `model Proposal`（约 L222~242）

```prisma
  deletedAt DateTime?

  // Proposal.status — 8 字面量（4 主体 + 4 兼容别名，新写入禁止别名）
  // creating | created | approved | shelved

  projectId   String?
  project     Project?  @relation(fields: [projectId], references: [id], onDelete: SetNull)

  primaryForProject Project? @relation("ProposalPrimaryProject")
```

### 3. `backend/src/constants/statuses.ts`（~40 行）

与 §0 表一致；Zod 在 TASK-202 引用。

### 4. `migration.sql`（仅 DDL）

---

## 依赖前置

无。

---

## 验证清单

1. `npx prisma validate`  
2. DDL 与 TASK-201 交叉引用  
3. `Project.proposal` 含 `onDelete: SetNull`；双 relation 名不冲突  

---

## 预估改动行数

~110 行（含 `metadata-keys.ts`）。

---

## 不变量验证

时间戳只增不减；墓园 `deletedAt` 与 status 解耦；`greenlitAt` 独立。

---

## 回滚方案

`git revert <TASK-200-commit>`
