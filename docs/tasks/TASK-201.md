# TASK-201（M1-A）：数据迁移脚本 — status 重命名 / 字段上提 / Q1·Q2 / proposalId 回填

> **里程碑**：M1-A  
> **执行顺序**：200 → **201** → 202 → 203 → 204  
> **依据**：TASK-200 schema；[`v2-migration-map.md`](../design/v2-migration-map.md) §2.2、§2.3、§4、§5

---

## 目标

交付**可审阅**的 SQL/TS 迁移脚本（文本），完成存量数据从 VPS 7 值 → v4.1.1 映射，并执行 `writingStyle` 上提与 `proposalId` 回填；**不执行** `prisma migrate dev`。

---

## In-scope / Out-of-scope

| In-scope | Out-of-scope |
|----------|----------------|
| `backend/prisma/migrations/.../migration.sql` 内 **DML**（UPDATE） | 前端 |
| `backend/scripts/migrate-day1.ts`（或 `prisma/seed-day1-migrate.ts`）可重复 dry-run 逻辑 | 新 HTTP 端点（→ TASK-202） |
| `status-migration.ts` 映射表扩展（L3~15 区间） | `Chapter.notes` |
| 迁移后 `metadata` 键清理（`_fromEvaluate` 保留至 M1 验收） | 自动跑 migrate |

---

## 关联冲突点

| 编号 | 说明 |
|------|------|
| [C-03](../design/code-conflict-analysis.md) | Project.status 存量映射 |
| [C-07](../design/code-conflict-analysis.md) | `metadata.writingStyle` → `Project.writingStyle` |
| §2.2 Q1/Q2 | [`v2-migration-map.md`](../design/v2-migration-map.md#22-存量迁移决策子表m1-第-0-步--已锁) |
| §2.3 | `proposalId` 回填 SQL |

---

## 具体改动

### 1. `backend/src/services/status-migration.ts`（L1~20 扩写）

```typescript
const PROJECT_STATUS_MAP: Record<string, string> = {
  imported: 'imported',
  draft: 'imported',        // Q2: 无 _fromEvaluate → imported（或保留标记供 TASK-220）
  completed: 'reviewed',
  published: 'reviewed',
  pooled: 'archived',       // 旧审查池 → 墓园用 deletedAt 另脚本
  trashed: 'archived',
  // ... 保持 mapProjectStatus 出口
}

const PROPOSAL_STATUS_MAP: Record<string, string> = {
  draft: 'creating',
  submitted: 'created',
  evaluated: 'created',
  rejected: 'creating',
  approved: 'approved',
  shelved: 'shelved',
}
```

### 2. SQL 脚本分段（写入同一 migration 或 `scripts/day1-data.sql`）

**§A — Proposal.status**

```sql
UPDATE Proposal SET status = 'creating' WHERE status = 'draft'
  AND (json_extract(metadata, '$._discussionSubmitted') IS NULL OR json_extract(metadata, '$._discussionSubmitted') = false);
UPDATE Proposal SET status = 'created' WHERE status IN ('draft','submitted','evaluated')
  AND json_extract(metadata, '$._discussionSubmitted') = true;
UPDATE Proposal SET status = 'creating' WHERE status = 'rejected';
-- approved / shelved 保持
```

**§B — Project.status（Q2）**

```sql
UPDATE Project SET status = 'planning', submittedToPlanningAt = COALESCE(submittedToPlanningAt, createdAt)
WHERE status = 'draft' AND json_extract(metadata, '$._sourceFrom') = 'proposal';
UPDATE Project SET status = 'imported'
WHERE status = 'draft' AND (json_extract(metadata, '$._sourceFrom') IS NULL OR json_extract(metadata, '$._sourceFrom') != 'proposal');
UPDATE Project SET status = 'reviewed' WHERE status = 'completed';
-- planning/writing/reviewing/archived/shelved 同名保留
```

**§C — writingStyle 上提（C-07）**

```sql
UPDATE Project SET writingStyle = json_extract(metadata, '$.writingStyle')
WHERE writingStyle IS NULL AND json_extract(metadata, '$.writingStyle') IS NOT NULL;
```

**§D — proposalId 回填（Q1，§2.3）**

```sql
UPDATE Project SET proposalId = (
  SELECT p.id FROM Proposal p WHERE p.projectId = Project.id LIMIT 1
) WHERE proposalId IS NULL AND (
  json_extract(metadata, '$._sourceFrom') = 'proposal'
  OR json_extract(metadata, '$._proposalId') IS NOT NULL
);
-- 新 evaluate 路径在 TASK-202 写入 metadata._fromEvaluate = true
```

**§E — 标记**

```sql
UPDATE Project SET metadata = json_set(COALESCE(metadata,'{}'), '$._fromEvaluate', true)
WHERE json_extract(metadata, '$._sourceFrom') = 'proposal' AND proposalId IS NOT NULL;
```

### 3. `backend/scripts/migrate-day1.ts`（新建，~120 行）

- `dryRun: boolean` 打印将改动的 id 计数  
- 调用 Prisma `$executeRawUnsafe` 或分步 `updateMany`  
- **入口注释**：「审阅通过后由人执行 `npx prisma migrate deploy`」

### 4. 不变量自检查询（脚本末尾）

```sql
-- 不应存在：approved 提案无 projectId
SELECT id FROM Proposal WHERE status = 'approved' AND projectId IS NULL;
-- 不应存在：planning 且 greenlitAt 非空但 status 仍为 planning（应 planned，由 202 修复）
```

---

## 依赖前置

- **TASK-200** 已合并（schema 列存在）。

---

## 验证清单

1. 在**副本 DB** 或 `sqlite3` 只读事务：跑 §A~D 后 `SELECT status, COUNT(*) FROM Project GROUP BY status` 无 `draft`/`completed`（除非别名策略保留只读）  
2. `grep -c "_proposalId" metadata` 与 `proposalId IS NOT NULL` 计数差为 0（Q1）  
3. `npm run build`（backend）通过 — 类型不依赖 migrate 生成时可 `prisma generate` only

---

## 预估改动行数

| 文件 | 约 |
|------|-----|
| `migration.sql`（DML） | +80~120 |
| `status-migration.ts` | +30 |
| `scripts/migrate-day1.ts` | +120 |
| **合计** | **~230 行** |

---

## 不变量验证

- **Q1/Q2 已锁**：§2.2 决策子表；脚本不得把跨阶段退回写进数据。  
- **软删除**：本卡**不**把 `shelved` 批量改为 `deletedAt`（D2 / M3 C-22）。  
- **时间戳只增不减**：UPDATE 用 `COALESCE(字段, createdAt)`，禁止覆盖非 NULL。

---

## 回滚方案

`git revert <TASK-201-commit>`；DB 从迁移前快照还原（本卡要求迁移前备份 `dev.db`）。
