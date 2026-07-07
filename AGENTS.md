# AGENTS.md — Agent 入口

> 所有 AI 工具（Codex、Claude、Cursor 等）开工前先读本文。

---

## 先读这些

1. [CURRENT_BASELINE.md](docs/CURRENT_BASELINE.md) — 当前做到哪了、暂不做
2. [CURSOR_REFERENCE.md](docs/tasks/CURSOR_REFERENCE.md) — 编码规范
3. [ARCHITECTURE.md](docs/ARCHITECTURE.md) — 系统架构
4. [docs/INDEX.md](docs/INDEX.md) — 文档总索引

---

## 协作角色

| 角色 | 工具 | 职责 | 禁止 |
|------|------|------|------|
| **参谋长** | Codex（限额时 Claude 替补） | 架构、任务卡、审计、会诊、审 diff | 不直接改代码、不新建 worktree |
| **执行兵** | **Cursor IDE**（本仓库主战场） | 按 TASK 卡写码、测试、提交、push | 不自行扩 scope、不未授权开新战役 |
| **司令官** | 用户 | 拍板授权、合并、工具切换 | — |

**替补规则**：Codex 限额时，Claude 只接「参谋长」角色（只读分析 + 出卡/审计），**代码执行仍由 Cursor 完成**。同一时刻只有一个工具「动仓库」。

---

## 主战场（物理路径）

**唯一日常开发目录**：

```text
D:/workspace/content/docs/novel-writer
```

开工前必须自检（或在会话第一句告知 Agent）：

```powershell
pwd
git branch --show-current
git worktree list
git status -sb
```

### Worktree 纪律

- **不要**在未授权时新建 git worktree 或检出到别的磁盘路径。
- Cursor Agent 窗口 / Cloud Agent 若自动创建了 worktree，任务结束后**合并回主战场或 `git worktree remove`**，不要留着不管。
- 以下路径是历史副本，**不是主战场**，不要在这里开发：

```text
D:/workspace/content/docs/novel-writer.worktrees/*
.../novel-writer/.claude/worktrees/*
C:/Users/Admin/.copilot/repos/copilot-worktrees/novel-writer/*
```

- 完整分支/worktree 盘点见 [2026-07-06 thinklog](docs/thinklogs/2026-07-06_Thinklog_Git_Branch_Audit_and_Hygiene.md)。

---

## 工具切换交接条

从 Codex → Claude → Cursor 切换时，给新 Agent 粘贴：

```text
主战场：D:/workspace/content/docs/novel-writer
当前分支：<填 git branch 输出>
SSOT：docs/CURRENT_BASELINE.md
本次任务：<TASK 卡路径 或 一句话目标>
禁止：新建 worktree / 动冻结分支（见下）
```

---

## 冻结分支（勿合并、勿续作）

| 分支 | 原因 | SSOT |
|------|------|------|
| `feature/writing-editor-ui-slice-1-4` | Open Design 战役已冻结；触及写作器保存架构债 | @ `a5ff728`，stash **勿 apply** |
| `ui/design-mode-trial` | Design Mode 视觉试验，独立 visual 分支 | 见 [design-mode-trial-2026-06-20.md](docs/design/design-mode-trial-2026-06-20.md) |

**主干基线**：`feature/workdetail-p1`（616-D 已收束，见 CURRENT_BASELINE）。

---

## 开任务卡之前

- 读 CURRENT_BASELINE.md 的「暂不做」清单
- 任务卡放在 `docs/tasks/`，用 `TASK-NNN-描述.md` 命名
- 模板：`docs/tasks/TEMPLATE.md`
- **无授权 TASK 卡前不主动开新实现战役**

### UI / 视觉改动额外约束

走独立 visual 分支；**仅改** Tailwind / className / 文案 / 布局。**禁止**动 state、handler、API、路由、保存/autosave。详见 [design-mode-trial-2026-06-20.md](docs/design/design-mode-trial-2026-06-20.md) §2.1。

---

## Cursor 写码纪律

- Cursor 默认启用 [Ponytail](https://github.com/DietrichGebert/ponytail)（`.cursor/rules/ponytail.mdc`）
- 冲突时：**CURRENT_BASELINE > CURSOR_REFERENCE > TASK 卡 > Ponytail**（见 `novel-writer-baseline.mdc`）
- Ponytail 的「无框架单测」在本项目不适用；统一用 Jest + `npm run test:backend`
- 执行已授权任务卡时说「按任务卡执行，normal mode」可暂时抑制过度 YAGNI
- 需要 review 时用 prompt：「按 Ponytail 标准 review 当前 diff」

---

## 提交之前

- `npm run lint` 通过
- `npm run test:backend` 通过
- `npm run build` 通过

### 战役收尾 checklist

合并或阶段性完成后，同步：

1. 更新 `docs/CURRENT_BASELINE.md`（若协作状态变化）
2. 更新 `docs/INDEX.md` 及对应子目录 README（若新增/移动文档）
3. `git push` 有意义的分支（避免只存本地）
4. 清理本次产生的空 worktree

---

## 规则优先级（摘要）

```text
CURRENT_BASELINE.md  >  CURSOR_REFERENCE.md  >  当前授权 TASK 卡  >  Ponytail
```
