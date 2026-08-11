# 任务卡

> **状态**：现役 · 最后核对 2026-08-11
> 已结案任务卡见 [`archive/`](./archive/)。

> **协作总纲**：[AGENTS.md](../../AGENTS.md) — 角色分工、主战场、worktree 纪律、工具切换交接条。

## 协作角色

| 角色 | 工具 | 职责 |
|------|------|------|
| **参谋长** | Codex（限额时 Claude 替补） | 任务卡、审计、复核、审 diff |
| **执行兵** | Cursor IDE（主战场） | 本地修改、测试、**本地 commit**（**不 push**） |
| **远端执行** | Copilot | 唯一 GitHub 远端通道：push、PR、获准 merge、远端 branch/tag |
| **VPS 执行** | Netcatty | VPS 预检、重置、部署（须任务卡与授权） |
| **司令官** | 用户 | 授权、拍板（不要求亲自执行 git 命令） |

## 任务卡生命周期

```text
创建（参谋长） → 授权（司令官） → 执行（Cursor） → 反馈 → 审计（参谋长）
                                                          ↓
                                             通过 ✅ 或 出修正卡 🔄
```

战役收尾时同步：更新 `CURRENT_BASELINE`、相关 INDEX、Codex 复核后交 **Copilot** push/PR、清理 worktree（见 AGENTS.md checklist）。已结案任务卡应移入 `archive/`（待办登记）。

## 目录结构

```text
docs/tasks/
  README.md         ← 本文件
  CURSOR_REFERENCE.md  ← 编码规范（执行兵必读）
  TEMPLATE.md       ← 任务卡模板
  TASK-XXX.md       ← 活跃/参考任务卡
  archive/          ← 已结案任务卡
```

## 任务卡格式

每张任务卡包含以下章节：

```markdown
## 背景
为什么做这个任务，前置依赖。

## 操作步骤
逐条可执行的命令/操作，按顺序编号。

## 预期结果
执行成功后应该看到的现象。

## 验证方法
如何确认操作成功（命令 + 预期输出）。

## 回滚方案（可选）
如果操作失败如何恢复。
```

## 执行约束

- 开卡前读 [CURRENT_BASELINE.md](../CURRENT_BASELINE.md)「暂不做」清单
- **无授权 TASK 卡前不主动开新实现战役**
- UI 视觉改动走独立 visual 分支，见 [design-mode-trial-2026-06-20.md](../design/design-mode-trial-2026-06-20.md) §2.1
