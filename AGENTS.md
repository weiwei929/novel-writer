# AGENTS.md — Agent 入口

> **状态**：现役 · 最后核对 2026-08-11
>
> 所有 AI 工具（Codex、Claude、Cursor、Antigravity 等）开工前先读本文。

---

## 先读这些

1. [ROADMAP.md](docs/ROADMAP.md) — **项目现在是什么、能做什么、往哪走**
2. [CURRENT_BASELINE.md](docs/CURRENT_BASELINE.md) — 当前做到哪了、暂不做
3. [CURSOR_REFERENCE.md](docs/tasks/CURSOR_REFERENCE.md) — 编码规范
4. [docs/INDEX.md](docs/INDEX.md) — 现役文档全集

---

## 文档采信规则（2026-07-27 起）

**无状态行的文档，不得作为操作依据。**

每份现役文档标题下应有一行状态标记：

```markdown
> **状态**：现役 · 最后核对 YYYY-MM-DD
> **状态**：学习记录 · 不作为操作依据
> **状态**：⛔ 已冻结 · 设计留档
> **状态**：历史 · 已由 XXX 取代
```

| 位置 | 性质 | 能否照做 |
|------|------|---------|
| `docs/` 顶层 + `guides/` `specs/` `tasks/` `design/` | 现役 | ✅ |
| `docs/journal/` | 学习档案（思考过程） | ❌ 只作参考 |
| `docs/archive/` | 历史归档（已完成事项） | ❌ 只作溯源 |

读到无状态行、或位于 `journal/` `archive/` 的文档时，**不得据此下判断或改代码**，需向司令官确认。

> **为什么用状态行而不是索引**：标记跟着文件走——文件被移动、被搜索命中、被另一个工具读到时，状态都在。
> 集中式索引必须靠人同步，本仓库已证明它会掉队（`docs/INDEX.md` 曾滞后 17 天并遗漏 26 份文件）。

### ⚠️ 特别提醒：AI 功能已冻结

仓库内多份历史文档写着「AI 95% 完成」「状态：已实现」，指的是**代码写完了**，不是**能用**。
实际状态：`frontend/src/config/aiFreeze.ts` 中 `AI_UI_FROZEN = true`，前端入口全部关闭。
**对外可用的 AI 能力为 0。** 判断进度以 `docs/ROADMAP.md` 为准。

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

**唯一日常开发目录**（Cursor IDE 本机）：

```text
D:/workspace/content/docs/novel-writer
```

当前已知基线（以本机 `git` 输出为准，会随开发推进变化）：

```text
分支：master
HEAD：b60eaf8
正式基线标签：baseline-2026-08-07
远端：应与 origin 同步后再开新活
```

### VM / MCP bash 同名路径（分环境判定，勿一刀切）

> **2026-07-25 修订**：原文一律判「作废」，已被实测推翻。结论取决于是哪个工具。

同一个路径字符串 `D:\workspace\content\docs\novel-writer` 在不同工具里含义不同：

| 环境 | 状态 | 依据 |
|------|------|------|
| **Cursor IDE 本机** | ✅ 主战场 — 唯一可 commit / push 的地方 | — |
| **Cowork（Claude 桌面版）挂载目录** | ✅ **是同一份文件系统**，可读、可改文件 | 2026-07-25 实测：HEAD、分支、`nul` 删除状态与本机 PowerShell 完全一致 |
| **无挂载的沙箱 / 其他 VM 拷贝** | ❌ 作废 — 不要修、不要 commit、不要 push | — |

**判定方法（Agent 开工时自行执行，不要猜）：**

```bash
git log --oneline -1 && git branch --show-current
```

输出与司令官本机一致 → 是同一仓库，可直接读写文件。
不一致或读不到 → 按「作废」处理，只做只读分析。

**仍然成立的红线**：即使挂载是同一份文件系统，参谋长**依然不执行 git write**（commit / push / merge / stash）—— 这些由司令官在本机 PowerShell 执行。原因不是路径不通，而是**同一时刻只有一个角色动版本历史**。

### 参谋长（Codex / Claude 3P）权限

| 允许 | 禁止 |
|------|------|
| 审 `docs/`、出任务卡、看 GitHub 远端 PR/issue | 在本机或 VM 里执行 git write、改代码 |
| 基于用户粘贴的本机命令输出做分析 | 根据 VM 侧 `git status` 下结论 |

需要仓库真相时：**司令官从本机 PowerShell 跑命令，把结果贴给参谋长**。

开工前自检（本机执行，或在会话第一句告知 Agent）：

```powershell
pwd
git branch --show-current
git log -1 --oneline
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

- 完整分支/worktree 盘点见 [2026-07-06 thinklog](docs/journal/2026-07-06_Thinklog_Git_Branch_Audit_and_Hygiene.md)。

---

## 工具切换交接条

从 Codex → Claude → Cursor 切换时，给新 Agent 粘贴：

```text
主战场：D:/workspace/content/docs/novel-writer
当前分支：master
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

**主干基线**：`master@b60eaf8`（标签 `baseline-2026-08-07`；TASK-710/720 在研内容在 `task-710-720-followup`，见 CURRENT_BASELINE）。

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
