# Day 1 Handoff 简报（给 Cursor 的 5 分钟入门）

> 用法：发给 Cursor 第一句发「读 `docs/design/day1-handoff-brief.md` 入门」即可  
> **权威全文**：`docs/design/overall-architecture.md` **v4.1.1**（VPS `v2-dev` 为准，勿用本机草稿）  
> **第 0 步（发卡前）**：`docs/design/v2-migration-map.md`  
> 冲突分析：`docs/design/code-conflict-analysis.md`（C-01~C-18）  
> VPS 代码对照：`docs/design/day1-vps-code-index.md`

---

## 项目一句话

**一个人的小说创作器**（老板=作者本人，5 个身份 = 5 个部门）。重点打磨**创意组 + 创作室**，其他阶段流程化。

## 5 部门（权力模型，v4.1）

| 部门 | 状态范围 | 三选一节点 |
|------|---------|-----------|
| 创意组 | creating/created/**approved** | **created**（提案决策）；L2 Tab「**灵感手记**」 |
| 企划课 | planning/planned | **planning**（立项决策） |
| 创作室 | planned/writing/written | **written**（提交审阅） |
| 编审部 | reviewing/reviewed | **reviewed**（文集入库） |
| 文集库 | archived | — |

**v4.1 → Day 2 语义**：

- `approved` = 企划课 Tab② 通过
- ~~`shelved`~~ = **Day 2 方案 C 取消**（详见 `file-staging-v2.md`）
- 文件暂存 = `deletedAt`（**不改** status）

**3 条不变量**：

1. 跨阶段不退回（撤回只能回本阶段 in-progress）
2. 三选一只在 4 个节点（不是每个状态切换）
3. 删除 = 软删除（`deletedAt` 落入全局文件暂存）

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
| Chapter | 仅 `draft/written`（**Day 2 校准**：原 v4.1 写 `draft/writing/completed` 是错的，已改 2 态）|
| 状态机 | 9 值 + 7 时间戳（**Day 2 移除 `imported` + `shelved`**） |
| 文件暂存 | 取代审查池 + 旧 `/shelf` 语义（M3） |

## 必读文件（按顺序）

1. `docs/design/overall-architecture.md` — **v4.1 权威全文**
2. `docs/design/v2-migration-map.md` — 资产映射（**TASK-200 前必审**）
3. `docs/design/code-conflict-analysis.md` — C-01~C-22（C-19~21 为 schema/UI 裂缝）
4. `docs/design/day1-vps-code-index.md` — VPS 实际路径对照

> `day1-design.md` 为 2026-06-03 快照，与 v4.1 冲突时以 `overall-architecture.md` 为准。

## 里程碑（v4.1 §十）

| 里程碑 | TASK | 规则 |
|--------|------|------|
| **M1** | 200~209 | 状态机 + 企划课；**验收不过不开 M2** |
| **M2** | 210~217 | 创作室 + 编辑器 pure |
| **M3** | 218~221 | 废弃旧 transition、`/shelf`→文件暂存、文档同步 |

## TASK-200 门禁 checklist（v4.1.1）

| 项 | 状态 |
|----|------|
| v4.1.1 修订已 commit (`b579fb0`) | ✅ |
| §2.2 Q1/Q2 + §2.3 SQL | ✅ |
| §四企划课 / §五创作室 与 §0 一致 | ✅ |
| C-01~C-22 全列（含 C-19~21） | ✅ |
| C-20/C-21 UI | ⏳ M1-B 验收项（**不阻塞** TASK-200 发卡） |

**发卡**：可先发 **M1-A TASK-200~204**（纯后端，正文见 `docs/tasks/TASK-200.md`~`TASK-204.md`）；**M1-B 205~209** 含 C-20/C-21，M1 总验收前必须绿。

## 不讨论的已锁决策

- 5 部门权力模型 / 4 三选一 / 跨阶段不退回 / 文件暂存（软删 only）/ 编辑器 pure / 笔记二选一 / `writingStyle` 顶层 — 锁

## 待 Day 2 / Day 3

- Day 2：编审部（TASK-240~242）
- Day 3：AI 策略（TASK-230~233）
