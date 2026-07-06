# TASK-015（设置统计卡）：系统设置 + 数据统计

> 填充 `/settings` 与 `/stats` 全局入口。

## 实现要点

- `settingsStore.ts` — Zustand persist（`novel-settings`）
- `SettingsPage` — AI 四开关、编辑器偏好、服务状态
- `StatsPage` — 四统计卡、状态分布、近期活跃
- 联动：`Layout` 创意 Tab、`WritingEditorPage`、`MarkdownEditor`、`ReviewPage`、`ProposalEvalPage`

## 备注（TASK-016）

「暂存阁」→「作品暂存」三处改动留待 TASK-016。
