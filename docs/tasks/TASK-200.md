# TASK-200（M1-A）：Prisma Schema 扩展 — 时间戳 / 字段 / 状态枚举

> **里程碑**：M1-A（纯后端）  
> **执行顺序**：**200 → 201 → 202 → 203 → 204**（本卡第一）  
> **权威设计**：[`overall-architecture.md`](../design/overall-architecture.md) §0、[`v2-migration-map.md`](../design/v2-migration-map.md) §0

---

## 目标

在 **不跑** `prisma migrate dev` 的前提下，提交可被 TASK-201 引用的 schema 定稿：Project 增加 7 个时间戳字段 + `writingStyle` + `deletedAt` + `proposalId`；Project/Proposal 的 `status` 字符串枚举扩至 v4.1.1 白名单（含只读兼容别名）。

---

## In-scope / Out-of-scope

| In-scope | Out-of-scope |
|----------|----------------|
| `backend/prisma/schema.prisma` 字段与注释 | 任何 `frontend/**` |
| `Proposal` / `Project` 关系字段（`proposalId`） | SQL 数据迁移（→ TASK-201） |
| 生成/提交 `migration.sql` **文本**（可选空迁移占位，由 201 填数据步） | HTTP 路由（→ TASK-202~204） |
| 后端 Zod 常量**仅注释引用**（实现在 202） | `Chapter.notes` 列（→ M2 TASK-213） |
| | `npx prisma migrate dev` **禁止执行** |

---

## 关联冲突点

| 编号 | 说明 |
|------|------|
| [C-01](../design/code-conflict-analysis.md) | Project 缺 7 时间戳 + `writingStyle` + `deletedAt` + `proposalId` |
| [C-02](../design/code-conflict-analysis.md) | Proposal **扩展**已有模型，非新建 |
| [C-03](../design/code-conflict-analysis.md) | Project.status 7 值 → v4.1 目标集 |

---

## 具体改动

### 1. `backend/prisma/schema.prisma` — `Project`（约 L26~61）

在 `model Project` 内 `status` 行后追加：

```prisma
  // --- Day 1 事件时间戳（只增不减，见 overall-architecture §0）---
  submittedToPlanningAt DateTime?
  greenlitAt              DateTime?
  writingStartedAt      DateTime?
  workCompletedAt       DateTime?
  submittedToReviewAt   DateTime?
  archivedAt            DateTime?
  deletedAt             DateTime?  // 墓园软删除；非 status

  writingStyle String?
  proposalId   String?  @unique
  proposal     Proposal? @relation("ProposalPrimaryProject", fields: [proposalId], references: [id])

  // status 注释更新为 v4.1.1 白名单（13 字面量，含 2 个只读别名）:
  // imported | planning | planned | writing | written | reviewing | reviewed | archived | shelved
  // draft | completed  -- 仅存量兼容，新写入禁止
```

**默认 status**：新创建默认建议改为 `imported`（导入流）或保持 `planning`（由端点写入）；**本卡只改 schema 默认注释**，默认字面量在 TASK-202 端点统一。

### 2. `model Proposal`（约 L222~242）

```prisma
  deletedAt DateTime?  // 提案墓园；不改 status

  // status: creating | created | approved | shelved
  // 兼容只读别名: draft | submitted | evaluated | rejected
```

在 `Proposal` 上增加反向关系（与 `projectId` 并存）：

```prisma
  primaryForProject Project? @relation("ProposalPrimaryProject")
```

### 3. 新建常量文件（供 202/203 引用）

`backend/src/constants/statuses.ts`（新建，~40 行）：

```typescript
export const PROJECT_STATUSES_V4 = [
  'imported','planning','planned','writing','written',
  'reviewing','reviewed','archived','shelved',
  'draft','completed', // @deprecated read-only aliases
] as const

export const PROPOSAL_STATUSES_V4 = [
  'creating','created','approved','shelved',
  'draft','submitted','evaluated','rejected', // @deprecated
] as const
```

### 4. 迁移目录（仅骨架，数据步在 TASK-201）

`backend/prisma/migrations/YYYYMMDD_day1_schema/migration.sql`：

- `ALTER TABLE` 添加列（SQLite）
- **不含** `UPDATE` 回填（→ TASK-201）

---

## 依赖前置

无（M1-A 首张卡）。

---

## 验证清单（审阅用，执行者**不要**在本卡跑 migrate dev）

1. `cd backend && npx prisma validate` 成功  
2. `migration.sql` 仅 DDL，与 TASK-201 脚本文档交叉引用一致  
3. `schema.prisma` 中 `proposalId` ↔ `Proposal.projectId` 双向关系无循环删除错误（`onDelete` 用 `SetNull`）

---

## 预估改动行数

| 文件 | 约 |
|------|-----|
| `schema.prisma` | +35~45 |
| `constants/statuses.ts` | +40（新） |
| `migration.sql`（DDL） | +25 |
| **合计** | **~100 行** |

---

## 不变量验证

- **时间戳只增不减**：schema 字段 nullable；业务层禁止 `null` 覆盖已有时间戳（TASK-202 实现）。  
- **墓园**：`deletedAt` 与 `status` 解耦（§0 / §8.2）。  
- **立项总账**：`greenlitAt` 独立字段，非 status 派生（§4.6）。

---

## 回滚方案

`git revert <TASK-200-commit>`；若已 apply 迁移则由运维按备份还原 DB（本阶段不应 apply）。
