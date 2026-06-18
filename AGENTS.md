# AGENTS.md — Agent 入口

## 先读这些

1. [CURRENT_BASELINE.md](docs/CURRENT_BASELINE.md) — 当前做到哪了、暂不做
2. [CURSOR_REFERENCE.md](docs/tasks/CURSOR_REFERENCE.md) — 编码规范
3. [ARCHITECTURE.md](docs/ARCHITECTURE.md) — 系统架构

## 开任务卡之前

- 读 CURRENT_BASELINE.md 的「暂不做」清单
- 任务卡放在 `docs/tasks/`，用 `TASK-NNN-描述.md` 命名
- 模板：`docs/tasks/TEMPLATE.md`

## Cursor 写码纪律

- Cursor 默认启用 [Ponytail](https://github.com/DietrichGebert/ponytail)（`.cursor/rules/ponytail.mdc`）
- 与 `CURRENT_BASELINE.md`、`CURSOR_REFERENCE.md`、当前 TASK 卡冲突时，以项目文档为准（见 `novel-writer-baseline.mdc`）
- Ponytail 的「无框架单测」在本项目不适用；统一用 Jest + `npm run test:backend`
- 执行已授权任务卡时说「按任务卡执行，normal mode」可暂时抑制过度 YAGNI
- Cursor 不支持 `/ponytail-review`；需要时用 prompt：「按 Ponytail 标准 review 当前 diff」

## 提交之前

- `npm run lint` 通过
- `npm run test:backend` 通过
- `npm run build` 通过
