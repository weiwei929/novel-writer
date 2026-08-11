# Novel Writer 文档

> **状态**：现役 · 最后核对 2026-08-11

---

## 读哪一份

| 你想知道 | 读这份 |
|---------|--------|
| 项目现在是什么、能做什么、往哪走 | **[ROADMAP.md](./ROADMAP.md)** |
| 当前分支、已合并内容、暂不做清单 | **[CURRENT_BASELINE.md](./CURRENT_BASELINE.md)** |
| 现役文档有哪些 | **[INDEX.md](./INDEX.md)** |
| 多工具协作规则 | **[../AGENTS.md](../AGENTS.md)** |
| 5 分钟跑起来 | [guides/QUICK_START.md](./guides/QUICK_START.md) |
| 系统架构 | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| 开发流程 | [DEVELOPMENT.md](./DEVELOPMENT.md) |

**AI 工具开工读前三份即可。**

---

## 目录怎么分

| 位置 | 装什么 | 能否照做 |
|------|--------|---------|
| `docs/` 顶层 + `guides/` `specs/` `tasks/` `design/` | 现役 | ✅ |
| [`journal/`](./journal/) | 学习档案：思考、讨论、会诊、复盘、随笔 | ❌ 只作参考 |
| [`archive/`](./archive/) | 历史归档：已完成事项 | ❌ 只作溯源 |

学习档案有独立索引 → **[journal/INDEX.md](./journal/INDEX.md)**（按主题 / 时间 / 结论是否仍成立三维检索）

---

## 维护约定

- 每份现役文档标题下需有**状态行**；**无状态行的文档不得作为操作依据**（见 [`../AGENTS.md`](../AGENTS.md)）
- 文档失效时**改状态行**，而不是等着谁来更新索引
- 过程性记录直接放 `journal/`，不进现役区
- **历史文档中的旧 branch / SHA**（如 `v2-dev`、`task-710-720-followup`、`master@b60eaf8`）描述**当时**执行环境，**不是当前操作指令**；开工以实际 `origin/master` 为准
- 已结案任务卡应进入 [`tasks/archive/`](./tasks/archive/)（待办登记，不批量搬迁）
