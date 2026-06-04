# Day 1 Handoff 简报（给 Cursor 的 5 分钟入门）

> 用法：发给 Cursor 第一句发「读 `docs/design/day1-handoff-brief.md` 入门」即可  
> 完整设计：`docs/design/day1-design.md`  
> 冲突分析：`docs/design/code-conflict-analysis.md`  
> VPS 代码对照（修正版）：`docs/design/day1-vps-code-index.md`

---

## 项目一句话

**一个人的小说创作器**（老板=作者本人，5 个身份 = 5 个部门）。重点打磨**创意组 + 创作室**，其他阶段流程化。

## 5 部门（权力模型）

| 部门 | 状态范围 | 三选一节点 |
|------|---------|-----------|
| 创意组 | creating/created/shelved | **created**（提案决策） |
| 企划课 | planning/planned | **planning**（立项决策） |
| 创作室 | planned/writing/written | **written**（提交审阅） |
| 编审部 | reviewing/reviewed | **reviewed**（文集入库） |
| 文集库 | archived | — |

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

## Day 1 关键变化（vs v3）

| 变化 | 内容 |
|------|------|
| 企划课 Tab ④ | 改名「立项总账」，与 status 解耦，按 `greenlitAt IS NOT NULL` 筛选 |
| 编辑器 | pure-ified：移除 AI/审阅/状态下拉框，所有 work-level 操作去作品详情页 |
| 作品详情页 | 成为所有 work-level 动作的**唯一场所** |
| 笔记 | 只保留/删除（**无「转灵感手记」**） |
| 写作风格 | 从 `metadata.writingStyle` 提到 `Project.writingStyle`（顶层字段） |
| 状态机 | 11 个状态值：imported/creating/created/planning/planned/writing/written/reviewing/reviewed/archived/shelved |
| 跨阶段退回 | ❌ 禁止 |
| 全局墓园 | 取代「审查池」，独立 L1 导航入口 🗑️ |

## Day 1 必读文件（按顺序）

1. `docs/design/day1-design.md` — Day 1 设计全文（本仓库）
2. `docs/design/code-conflict-analysis.md` — C-01~C-13 + 落地顺序
3. `docs/design/day1-vps-code-index.md` — 与 VPS v2-dev 实际代码对照
4. `docs/plan/DAY1-DESIGN-REVIEW-2026-06-03.md` — 执行端审阅意见（可选）

> 历史文档 `docs/design/overall-architecture.md` 为 **v3**，Day 1 以 `day1-design.md` 为准。

## Day 1 待出卡片

- TASK-200~209：Phase 1a 企划课 + 状态机
- TASK-210~220：Phase 1b 创作室纯化
- TASK-230~233：Phase 1c AI 集成（Day 3 设计后）
- TASK-240~242：Phase 1d 编审部（Day 2 设计后）

## 不讨论的已锁决策

- 5 部门权力模型 — 锁
- 4 三选一节点 — 锁
- 跨阶段不退回 — 锁
- 软删除 + 全局墓园 — 锁
- 写作风格独立字段 — 锁
- 编辑器 pure-ified — 锁
- 笔记保留/删除二选一 — 锁

## 待 Day 2 / Day 3 讨论

- Day 2：编审部（连续阅读/审阅清单/修订快照）
- Day 3：AI 策略（创意合伙人/写作助手/审校官）
- C-14~C-19 冲突点待对应 Day 讨论后补
