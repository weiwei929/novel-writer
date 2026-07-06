# TASK-201（M1-A）：数据迁移脚本 — status 重命名 / 字段上提 / Q1·Q2 / proposalId 回填

> **里程碑**：M1-A  
> **执行顺序**：200 → **201** → 202 → 203 → 204  
> **§0**：[`metadata-keys.ts`](../../backend/src/constants/metadata-keys.ts)（`META_KEYS_DAY1`）— 脚本内用常量，禁止裸字符串。

---

## 目标

交付可审阅 SQL/TS 迁移文本；**不执行** `prisma migrate dev`。

---

## In-scope / Out-of-scope

| In-scope | Out-of-scope |
|----------|----------------|
| DML + `migrate-day1.ts` + `status-migration.ts` | 前端、HTTP 端点 |

---

## 关联冲突点

[C-03](../design/code-conflict-analysis.md) [C-07](../design/code-conflict-analysis.md) · [v2-migration-map §2.2~2.3](../design/v2-migration-map.md)

---

## 具体改动

### 1. `status-migration.ts` — 引用 `META_KEYS_DAY1`

### 2. SQL 分段

**§A — Proposal.status**（`META_KEYS_DAY1.DISCUSSION_SUBMITTED`）

```sql
UPDATE Proposal SET status = 'creating' WHERE status = 'draft'
  AND (json_extract(metadata, '$._discussionSubmitted') IS NULL OR json_extract(metadata, '$._discussionSubmitted') = false);
UPDATE Proposal SET status = 'created' WHERE status IN ('submitted','evaluated')
  AND json_extract(metadata, '$._discussionSubmitted') = true;
-- draft + _discussionSubmitted=true 已由第一条与第二条边界覆盖；勿再 IN ('draft',...)
UPDATE Proposal SET status = 'creating' WHERE status = 'rejected';
```

**§B — Project.status（Q2）** — 使用 `_sourceFrom` / `META_KEYS_DAY1.SOURCE_FROM`

**§C — writingStyle 上提**

**§D — proposalId 回填（Q1）** — 带 EXISTS 预过滤

```sql
UPDATE Project
SET proposalId = (
  SELECT p.id FROM Proposal p
  WHERE p.projectId = Project.id
     OR p.id = json_extract(Project.metadata, '$._proposalId')
  LIMIT 1
)
WHERE proposalId IS NULL
  AND EXISTS (
    SELECT 1 FROM Proposal p
    WHERE p.projectId = Project.id
       OR p.id = json_extract(Project.metadata, '$._proposalId')
  )
  AND (
    json_extract(metadata, '$._sourceFrom') = 'proposal'
    OR json_extract(metadata, '$._proposalId') IS NOT NULL
  );
-- orphan：metadata 有 _proposalId 但 Proposal 表无行 → 本 UPDATE 跳过；dry-run 记日志交运维
```

**§E — `_fromEvaluate` 标记**

```sql
UPDATE Project SET metadata = json_set(COALESCE(metadata,'{}'), '$._fromEvaluate', true)
WHERE proposalId IS NOT NULL
  AND json_extract(metadata, '$._sourceFrom') = 'proposal';
```

**§F — 半迁移自检**（§B 已 `planning` 但 §D 未填 `proposalId`）

```sql
SELECT id, title, status, proposalId, metadata
FROM Project
WHERE status = 'planning'
  AND proposalId IS NULL
  AND json_extract(metadata, '$._sourceFrom') = 'proposal';
-- migrate-day1.ts: 非空则 console.warn('[day1] semi-migrated projects', rows) 并 exit 1（可 --force 跳过）
```

### 3. `migrate-day1.ts` — dry-run / §F 门禁

### 4. 不变量查询（末尾）

```sql
SELECT id FROM Proposal WHERE status = 'approved' AND projectId IS NULL;
```

---

## 依赖前置

**TASK-200**

---

## 验证清单

1. §A~F 在副本 DB 跑通；`GROUP BY status`：**无新写入的** `draft`/`completed`（兼容别名仅允许存量读映射，计数可为 0 行）  
2. Q1：`proposalId IS NOT NULL` 与 `_sourceFrom=proposal` 行数一致（orphan 已日志）  
3. §F 返回 0 行（或 `--force` 文档化例外）  
4. `npm run build`（backend）

---

## 预估改动行数

~250 行

---

## 不变量验证

Q1/Q2 已锁；不批量 `shelved`→墓园；时间戳 COALESCE 不覆盖非 NULL。

---

## 回滚方案

`git revert <TASK-201-commit>` + DB 快照还原
