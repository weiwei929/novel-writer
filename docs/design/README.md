# 设计文档索引

## Day 1（v4.1.1，2026-06-04 定案）— 当前权威（以 VPS `v2-dev` 提交为准）

| 顺序 | 文件 | 用途 |
|------|------|------|
| 0 | [day1-handoff-brief.md](./day1-handoff-brief.md) | 5 分钟入门（Cursor 第一句读这个） |
| 1 | [overall-architecture.md](./overall-architecture.md) | **v4.1.1 权威全文** |
| 2 | [v2-migration-map.md](./v2-migration-map.md) | 资产迁移表 §2.2 决策子表（TASK-200 前必审） |
| 3 | [code-conflict-analysis.md](./code-conflict-analysis.md) | C-01~C-18 + M1/M2/M3 |
| 4 | [day1-vps-code-index.md](./day1-vps-code-index.md) | VPS 代码对照 |
| — | [../plan/DAY1-DESIGN-REVIEW-v4.1-addendum.md](../plan/DAY1-DESIGN-REVIEW-v4.1-addendum.md) | v4.1 冷评落库说明 |
| — | [cursor-scout-prompt.md](./cursor-scout-prompt.md) | 侦察任务书 |

**Cursor 入门口令**：`读 docs/design/day1-handoff-brief.md 入门`

## 历史 / 参考

| 文件 | 说明 |
|------|------|
| [day1-design.md](./day1-design.md) | 2026-06-03 快照；冲突时以 overall-architecture v4.1 为准 |
| [creation-workflow-redesign.md](./creation-workflow-redesign.md) | 早期流程讨论 |
| [ai-integration-design.md](./ai-integration-design.md) | AI（Day 3 再动） |
| [../plan/DAY1-DESIGN-REVIEW-2026-06-03.md](../plan/DAY1-DESIGN-REVIEW-2026-06-03.md) | 06-03 审阅（已被 v4.1 addendum 补充） |

## Design Mode 试验（2026-06-20，活跃）

| 文件 | 说明 |
|------|------|
| [design-mode-trial-2026-06-20.md](./design-mode-trial-2026-06-20.md) | Cursor Design Mode 视觉抛光试验记录 |
| 分支 `ui/design-mode-trial` | 代码提交：`ee2d55d`（换行符归一化）+ `9b07129`（HomePage / Layout / icons） |
| `handoffs/opendesign-ui-audit-2026-06-18/` | Open Design 冻结战役材料（工作区未入库） |

约束：仅改视觉，不动 state / 路由 / 保存逻辑。详见试验记录 §2.1。

## 0608 立宪指导

- [0608-constitutional-guidance/](./0608-constitutional-guidance/) — workspace 模型、release protocol、legacy freeze 等

## 协作

- [../plan/ALIGNMENT-2026-06-02.md](../plan/ALIGNMENT-2026-06-02.md) — Claude ↔ Cursor 对齐
- [../tasks/CURSOR_REFERENCE.md](../tasks/CURSOR_REFERENCE.md) — 实现规范 + VPS §十一
