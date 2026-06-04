# Day 1 Handoff 简报（给 Cursor 的 5 分钟入门）

> 用法：发给 Cursor 第一句发「读 `docs/design/day1-handoff-brief.md` 入门」即可  
> **权威全文**：`docs/design/overall-architecture.md` **v4.1**（2026-06-04）  
> **第 0 步（发卡前）**：`docs/design/v2-migration-map.md`  
> 冲突分析：`docs/design/code-conflict-analysis.md`（C-01~C-18）  
> VPS 代码对照：`docs/design/day1-vps-code-index.md`

---

## 项目一句话

**一个人的小说创作器**（老板=作者本人，5 个身份 = 5 个部门）。重点打磨**创意组 + 创作室**，其他阶段流程化。

## 5 部门（权力模型，v4.1）

| 部门 | 状态范围 | 三选一节点 |
|------|---------|-----------|
| 创意组 | creating/created/**approved**/shelved | **created**（提案决策） |
| 企划课 | planning/planned | **planning**（立项决策） |
| 创作室 | planned/writing/written | **written**（提交审阅） |
| 编审部 | reviewing/reviewed | **reviewed**（文集入库） |
| 文集库 | archived | — |

**v4.1 语义**：

- `approved` = 企划课 Tab② 通过（**不是** `shelved`）
- `shelved` = 主动暂存（「先放一放」）
- 墓园 = `deletedAt`（**不改** status）

**3 条不变量**：

1. 跨阶段不退回（撤回只能回本阶段 in-progress）
2. 三选一只在 4 个节点（不是每个状态切换）
3. 删除 = 软删除（`deletedAt` 落入全局墓园）

## 7 个时间戳（不可变历史）

```
submittedToPlanningAt → greenlitAt → writingStartedAt → workCompletedAt
       → submittedToReviewAt → archivedAt
                            → deletedAt（任何阶段可设）
```

**API 去歧义**：`accept-into-planning`（提案进企划）≠ `confirm-greenlight`（正式立项 → `planned`）

## Day 1 关键变化（vs v3）

| 变化 | 内容 |
|------|------|
| 企划课 Tab ④ | 「立项总账」，与 status 解耦，按 `greenlitAt IS NOT NULL` 筛选 |
| 编辑器 | pure-ified；work-level 仅 `WorkDetailPage.tsx` |
| 笔记 | 只保留/删除（无「转灵感手记」） |
| 写作风格 | `Project.writingStyle` 顶层字段 |
| Chapter | 仅 `draft/writing/completed`；`written` 仅 Project 级 |
| 状态机 | 11 值 + 7 时间戳 |
| 墓园 | 取代审查池 + 旧 `/shelf` 语义（M3） |

## 必读文件（按顺序）

1. `docs/design/overall-architecture.md` — **v4.1 权威全文**
2. `docs/design/v2-migration-map.md` — 资产映射（**TASK-200 前必审**）
3. `docs/design/code-conflict-analysis.md` — C-01~C-18 + 10 步顺序
4. `docs/design/day1-vps-code-index.md` — VPS 实际路径对照

> `day1-design.md` 为 2026-06-03 快照，与 v4.1 冲突时以 `overall-architecture.md` 为准。

## 里程碑（v4.1 §十）

| 里程碑 | TASK | 规则 |
|--------|------|------|
| **M1** | 200~209 | 状态机 + 企划课；**验收不过不开 M2** |
| **M2** | 210~217 | 创作室 + 编辑器 pure |
| **M3** | 218~221 | 废弃旧 transition、`/shelf`→墓园、文档同步 |

**发卡前**：勿发 TASK-200，直至迁移表 §3/§4 评审通过。

## 不讨论的已锁决策

- 5 部门权力模型 / 4 三选一 / 跨阶段不退回 / 墓园 / 编辑器 pure / 笔记二选一 / `writingStyle` 顶层 — 锁

## 待 Day 2 / Day 3

- Day 2：编审部（TASK-240~242）
- Day 3：AI 策略（TASK-230~233）
