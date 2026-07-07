# 2026-07-06：分支回溯 + 换行符/视觉改动分离提交

> **时间戳**：2026-07-06（周一）19:30 UTC+8
> **分支**：`ui/design-mode-trial`
> **触发原因**：用户对着一屏幕的 `git status` 改动和一堆分支名感到困惑，请求回溯当前项目状态

---

## 一、当时的困惑

打开项目发现：

- `git status` 里 90+ 个文件显示 `modified`，涉及 backend/frontend/docs 几乎所有目录
- 本地一大堆分支名字（616 系列、agents/*、weiwei929-*、codex/*、hygiene/* ……）不确定哪些还活着、哪些已经没用
- 不确定这是不是意味着项目出了问题

**结论先说**：**没有灾难性损失，项目完好，已妥善收尾。**

---

## 二、诊断过程（Shell 工具当时故障，改用读 `.git` 内部文件 + 用户手动跑 PowerShell 交叉核实）

1. 读 `.git/HEAD`、`.git/config`、`.git/logs/HEAD`（reflog）、各 `refs/heads/*` 文件，梳理出分支血缘。
2. 用户手动执行 `git status` / `git branch -vv` / `git diff --stat --ignore-space-at-eol -b`，逐条验证。
3. **关键验证结果**：`git diff --stat --ignore-space-at-eol -b` 只剩 3 个文件、`+147/-26`，与 `docs/design/design-mode-trial-2026-06-20.md` 里记录的"3 files，+147/−26"逐字对上 → **证实其余 90+ 个 `M` 文件 100% 只是 CRLF→LF 换行符差异，没有真实内容改动**。

---

## 三、分支全景（截至本次记录）

### 主干演进链路（正统血脉）

```
master → v2-dev → codex/hermes-0608-workdetail-actions → hygiene/0608-r1r2 → feature/workdetail-p1（当前基线）
```

### 已合并、远端已删除（`git branch -vv` 里标 `[origin/xxx: gone]`）——安全历史存档，可留可删

- `feature/616-a-naming-readmodel`、`616-a2-synopsis`
- `feature/616-b-a-work-setting`、`616-b-a2-planning-closure`、`616-b-a3-setting-sketch-ui`
- `feature/616-c-a-chapter-planning`、`616-c-a2-confirm-chapter-readiness`
- `feature/616-d-a-start-writing-materialize`
- `feature/creative-v2-a-origin-flow`
- `feature/p1-a-entry-governance`
- `agents/616-d-c-writer-usability`（D-C，PR #13）

### 仍在远端、未合并（**别碰**）

- `feature/writing-editor-ui-slice-1-4` @ `81b2ce4` —— Open Design 驱动的 Slice-1/2，因触及写作编辑器保存架构债，**已冻结**；还有一个未裁决的 stash（`wip writing-editor-ui-slice before switch to worktree`），**不要 apply**。

### 发现：4 个独立 worktree（物理文件夹，不只是分支名）

```
D:/workspace/content/docs/novel-writer.worktrees/agents-release-threshold-audit
    → 检出 agents/616-d-c-writer-usability

D:/workspace/content/docs/novel-writer/.claude/worktrees/sleepy-mendel-881415
    → 检出 claude/sleepy-mendel-881415（Claude Code 建的，与 master 同点，无独立改动）

C:/Users/Admin/.copilot/repos/copilot-worktrees/novel-writer/weiwei929-jubilant-fishstick
C:/Users/Admin/.copilot/repos/copilot-worktrees/novel-writer/weiwei929-upgraded-chainsaw
    → GitHub Copilot 建的两个空分支，与 feature/workdetail-p1 同点，无改动
```

这可能是"分支很乱"的真正根源——不是 Git 记录乱，是好几个 AI 工具各自在别的磁盘路径开了独立副本。目前都很干净，暂不影响主项目，**待后续统一清理**。

---

## 四、本次收尾操作（已完成）

在 `ui/design-mode-trial` 分支上，把混在一起的改动拆成两次干净提交：

```
9b07129 (HEAD) feat(frontend): Design Mode trial - homepage and shell visual polish
ee2d55d        chore: normalize line endings to LF via .gitattributes
a7860df        docs(cursor): TASK-617-A workspace governance + rules  ← 与主干 feature/workdetail-p1 分叉点
```

操作方式：`git add --renormalize -- . ":(exclude)<3个视觉文件>"` 先归一化换行符 → 提交；再单独 `git add` 那 3 个视觉文件 → 提交。第二次提交的 diff 数字（677/556）比预期的 147/26 大，是因为这 3 个文件的 CRLF→LF 转换和视觉改动被打包进了同一个 commit（故意排除在第一次归一化之外），**属预期行为，非异常**。

---

## 五、还没处理、留到下次的事

`git status` 目前应仍显示这 4 个**未跟踪**项，先放着没动：

- `docs/design/design-mode-trial-2026-06-20.md` —— Design Mode 试验记录文档本身（`.gitattributes` 注释里提到应归档到 `docs/design/archive/`，但尚未移动）
- `handoffs/opendesign-ui-audit-2026-06-18/...` —— Open Design 冻结的历史会诊材料
- `reports/` —— 杂项报告文件
- `nul` —— Windows 下疑似手滑产生的保留名文件，可删（`Remove-Item \\.\nul`）

## 六、下次接着做，可选方向

1. `git push -u origin ui/design-mode-trial` —— 把本地这两次干净提交备份到远端，避免只存在本地的风险。
2. 继续 Design Mode 视觉抛光其他页面（遵守"仅改视觉，不动 state/路由/保存"的约束，见 `design-mode-trial-2026-06-20.md` 第 2.1 节）。
3. 清理已合并的历史分支（第三节里标 `gone` 的那批）+ 清理 4 个 worktree。
4. 处理上面第五节的 4 个未跟踪项（归档文档、删 `nul`、决定 `handoffs/`/`reports/` 去留）。

**当前授权状态**：按 `docs/CURRENT_BASELINE.md`，616-D 已收束，无新授权任务卡前不主动开新战役——上面 1-4 都是"待你决定"，不是"待执行"。
