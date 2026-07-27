# 2026-06-05 Cursor 讨论邀请：Day 2 收口 + 基础打牢（**讨论**，**不是发卡**）

> 性质：讨论 / 调研 / 拍板前的 VPS 真实信息收集。**不要**起手就写代码。
>
> 上一份会合文档：`docs/design/cursor-handoff-2026-06-05.md`（L1 骨架发卡，**6 卡已闭环**）
> 上下文索引：`docs/design/day1-vps-code-index.md`（VPS 文件清单 + 行号）
> 锚点 memory：`memory/project_l1_submission_boundary.md` / `memory/project_archived_terminal_state.md` / `memory/project_file_staging_v2.md`

---

## 为什么是讨论不是发卡

用户原话（2026-06-05）：
> "我希望先不开新业务，先把现有基础打牢"
> "我建议 cursor 参与讨论，让他提供 VPS 端的真实信息后，听听他的意见"

这意味着：6 张卡（240-245）的代码改动是**已完成**的，下一步是"打牢基础"，但**打哪里、打多重、什么顺序**——需要你提供 VPS 真实信息后再拍板，**不要**起手就开新卡。

---

## 你需要回答的 5 个 VPS 真实问题

### 问题 1：Git 状态（**真实**地回答，**不要估算**）

请在 VPS `/root/novel-writer` 跑 `git status` 和 `git log --oneline -10`，告诉我：

1. **6 卡是否还有未 commit 的 diff？**（TASK-240~245 的代码改动）—— 预计 0 未 commit（6 张都已实现并自测），但**请真实 grep** 而非凭印象
2. **v4.1.1（`b579fb0`）现在在哪个分支？** `v2-dev` 还是 `main`？是否已 push 到 origin？
3. **`v2-dev` 相对 `origin/v2-dev` ahead/behind 多少？**
4. **本机相对 VPS 端**（用户用 Windows 端 D 盘）**是否有未同步的 diff？**（参考 `feedback_mount_git_state_inconsistency.md`——D 端是 git 真源，Linux VM 端 git 状态可能脱节）

如果有问题 4 涉及 Linux VM 端 git 状态——**只**用 Windows 端 `D:\workspace\content\docs\novel-writer` 的 `git status` 回答（D 端是 git 真源，详见 memory 锚点）。

### 问题 2：死代码清单（**实际 grep 结果**）

M1-A 端点 + Day 2 6 卡**已经完成**，但**前端死代码残留**尚未清。请 grep VPS 源码，给**具体行号 + 片段**：

| 死代码类型 | grep 关键词 | 预期位置 |
|-----------|------------|---------|
| `shelved` 字面量残留 | `grep -rn "shelved" apps/web/src/` | `PROJECT_STATUS_LABEL` / `ProjectStatusChip` / `StatusDot` 颜色（Day 2 方案 C 已取消 shelved）|
| `completed` 字面量残留 | `grep -rn "completed" apps/web/src/` | `PROJECT_STATUS_LABEL` / CLS（legacy read，不入 label）|
| 1.0 `/review` 链接残留 | `grep -rn "/review" apps/web/src/` | `HomePage` 等（1.0 章节审阅已废）|
| 1.0 `/blog` 公开残留 | `grep -rn "/blog" apps/web/src/` | 1.0 公开博客已废 |
| 1.0 `Category` 树残留 | `grep -rn "Category" apps/web/src/` | 1.0 分类树已废，2.0+ 用 Collection 扁平 |
| 1.0 `polishing` Chapter 状态 | `grep -rn "polishing" apps/web/src/` | Chapter 状态锁 `draft/written`（不增加）|
| 1.0 `Project.imProject` 残留 | `grep -rn "imProject" apps/web/src/` | 2.0+ 走 FileReference→创意组→Proposal→Project |
| 1.0 `publish` 字段残留 | `grep -rn "publish" apps/web/src/` | 2.0+ 文集库纯私人归档 |

**每行 grep 结果**给**前 3 个匹配的文件:行号 + 1 行代码**即可，**不要全列**。

### 问题 3：文档同步清单

5 份 doc 需更新以反映 Day 2 6 卡实际状态。请 grep 这 5 份 doc 现在的内容，告诉我**哪些段需要补 / 改 / 删**：

| Doc | 需要反映什么 |
|-----|------------|
| `docs/design/overall-architecture.md` | L1 = 5 部门平铺（创意组/企划课/创作室/**编审部**/**文集库**）/ 9 字面量 / shelved 移除 / 软删机制 |
| `docs/design/code-conflict-analysis.md` | M1-A 13 端点 + Day 2 6 卡落点 / shelved 移除 / archived 终态 + 软删 |
| `docs/design/day1-handoff-brief.md` | 5 Tab 入口（含编审部 / 文集库）/ 文件暂存 = 软删 only |
| `docs/design/editorial-dept-v2.md` | TASK-240/241/242 实际完成情况 / 5 维空卡 / L2 详情页 UI |
| `docs/design/editorial-library-v2.md` | TASK-243/244/245 实际完成情况 / Collection 接线 / 3 类书评空卡 |

**只 grep** `## ` / `### ` 二级标题行，列出**与 Day 2 现状不符的段标题**即可，**不要全文 dump**。

### 问题 4：部署验证

`novel.pf2008.com` 实际部署状态：

1. 当前部署的是哪个 commit？是否包含 6 卡（TASK-240~245）？
2. 5 个 L1 tab（创意组 / 企划课 / 创作室 / **编审部** / **文集库**）在部署版能否点开？
3. 路由 `/editorial`、`/editorial/:id`、`/library`、`/library/:id` 是否 200？
4. 创意组 AI 搜索 tab（Day 2 验证 4 Tab→5 Tab 修复）是否可见？

如果有部署问题，给**具体错误信息**（curl 响应 / 控制台报错 / 截图）。

### 问题 5：M1-A 端点实际行为（VPS 端真实验证）

M1-A 13 端点 6-02 已完成，6 卡已对接。请快速验证**关键 3 端点**的契约（curl 一次即可）：

| 端点 | 验证内容 |
|------|---------|
| `GET /projects?status=written` | 是否返回 `status=written` + `status=reviewing` 作品？返回字段含 `writingStyle` / `archivedAt` / `deletedAt` / `masterPrompt`？ |
| `POST /projects/:id/soft-delete` | 调用后 `deletedAt` 非 null，`status` 不变（不动状态机）？ |
| `POST /projects/:id/restore` | 调用后 `deletedAt` 为 null，恢复原 `status`（含 `archived` 不回流）？ |

如果 3 端点行为与设计 doc 描述不符，**列具体行号**（响应体 / 状态码），Claude 重新对齐设计。

---

## 回答格式

请按以下 5 段回答，**每段控制在 100 字内**：

```
【Q1 Git 状态】+ 实际 git 输出片段
【Q2 死代码】+ grep 命令 + 前 3 个匹配
【Q3 文档同步】+ 5 份 doc 的 ## 标题不符清单
【Q4 部署验证】+ curl 响应 / 实际看到
【Q5 M1-A 端点】+ 3 端点实际行为
```

---

## 拍板下一步

你回答后，Claude 会基于你的 VPS 真实信息输出**优先级拍板 + 实施计划**，包含：
- P0: commit + push（**只**在所有问题通过后）
- P1: 死代码清理顺序（按"出现频次 + 跨文件影响"排序）
- P1: 文档同步批次（按"用户查阅频次"排序）
- P1: 部署验证修复
- P2: M1-A 端点契约如有问题，对齐设计 doc
- P3: memory consolidate + archive 梳理

---

## 红线（**不要触碰**）

- ❌ 不要 push（**讨论阶段不动 origin**）
- ❌ 不要跑 `prisma migrate dev`
- ❌ 不要触碰 6 卡 out-of-scope 文件
- ❌ 不要开新业务 TASK 卡（M2/M3 都先不急）
- ❌ 不要修改锚点 memory（`project_l1_submission_boundary.md` / `project_archived_terminal_state.md` / `project_file_staging_v2.md`）

## 鼓励

- ✅ 直接 grep 真实情况（用户偏好**已验证 + 行号**而非**应该/可能**）
- ✅ 给 grep 命令本身（不只是结果）
- ✅ 如果发现设计 doc 与实际不符，**主动指出来**（不要闷头改）
- ✅ 对 5 个问题中**不确定的**明说"我不确定，需要先看 X 文件"
