# TASK-621: 文档体系治理（方案 · 待拍板）

- **状态**: ✅ **已完成**（2026-07-27 执行完毕，commit `bb28d91` / `eeb5a8d` / `0373e4e`）
- **执行结果**: 现役区 25 份（全部带状态行）· 学习档案 `journal/` 60 份 · 历史归档 `archive/` 137 份 · **文档零丢失**
- **司令官拍板记录**: A→`journal/` · B→中文稿入 `journal` 其余入 `archive` · D→状态行写成硬规则 · E→批次 1+2
- **架构师**: Claude（Cowork · 参谋长）
- **操作员**: 司令官
- **创建日期**: 2026-07-25
- **前置基线**: `09a68c9`（`feature/workdetail-p1`，已与 origin 同步）
- **前置任务**: 无

---

## 背景

### 为什么文档会累积到 217 份

司令官 2026-07-25 说明：**这个项目的目的不只是开发，更是学习。** 记录多、过程复杂，是学习行为的副产品，不是流程失控。

这条说明推翻了此前一版研判的算法。那版按「文档行数 ÷ 代码行数 = 1.7」判定「治理开销超过产出」——该算法把学习笔记与操作手册按同一种成本计价，**等于拿尺子量温度**。

### 因此本次治理的目标不是「删」

学习记录是资产，一字不删。真正的问题是一个歧义：

> **一份文档，现在到底是「照着做的地图」，还是「回头看的日记」？**
> 现在这两类混在同一个目录里，人和 AI 都分不出来。

危害是**单向**的：

| 误读方向 | 后果 |
|----------|------|
| 日记被当地图读 | **把人带错路**（如按 `QUICK_START.md` 去配一个早已不用的 Grok API key） |
| 地图被当日记读 | 顶多没人看，无害 |

所以治理动作是**分流**，不是删除：让现役的那几份短、准、唯一；让学习记录完整保留，但不再冒充指令。

---

## 盘点结果（2026-07-25 实测，非估算）

### 总量与索引覆盖

| 指标 | 数值 |
|------|------|
| `docs/` 下 md 总数 | **217** |
| 被任一索引引用 | **66（30%）** |
| 无任何索引指向（孤儿） | **149（70%）** |
| ↳ 其中已在 `archive/` 系目录内 | 80（**正常**，归档本就不需入口） |
| ↳ **其中住在「活跃」目录内** | **69（真正的问题）** |

索引起点：`AGENTS.md`、`docs/INDEX.md`、`docs/README.md`、`docs/CURRENT_BASELINE.md` 及三份子目录 README。

### 「活跃目录孤儿」分布（69 份）

| 目录 | 孤儿数 | 时间跨度 | 性质初判 |
|------|--------|----------|----------|
| `design/0608-constitutional-guidance/` | **25** | 06-08 ~ 06-16 | 0608 立宪期完整过程记录 |
| `tasks/` | **17** | 06-05 ~ 07-24 | 已结案 TASK 卡 + 执行报告 |
| `design/` | **12** | 06-05 ~ 06-18 | v2 设计草案、handoff、已收束方案 |
| `milestones/` | 4 | 05-29 ~ 06-05 | 里程碑总结 |
| `development/` | 4 | 05-29 | 开发日志、风控策略 |
| `technical/` | 2 | 2025-11 ~ 05-29 | 技术成果记录 |
| `requirements/` | 2 | 05-29 | 早期需求文档（中文名） |
| `architecture/` | 2 | 05-29 | 早期架构文档（中文名） |
| `plan/` | 1 | 07-24 | Day-1 执行记录 |

**注意 `design/0608-constitutional-guidance/` 这一项**：`INDEX.md` 用**一行**指向它，而它里面有 **26 份文件**。这是全仓最大的「单行入口 → 巨型内容」落差。

### 已在归档区的 80 份（分布正常，本次不动）

`tasks/archive/` 30 · `archive/2025_12_11logs/` 17 · `archive/` 根 10 · `archive/v1.0_foundation_20251213/` 6 · `archive/test-files/` 5 · `archive/evaluations/` 4 · `archive/evaluation-reports/` 4 · `archive/plans/` 2 · `archive/presentations/` 1 · `design/archive/` 1

---

## 诊断：三个具体病灶

### 病灶一：位置无法区分现役与历史

`archive/` 之外的所有目录都**看起来**是现役的。但 `milestones/`、`development/`、`technical/`、`requirements/`、`architecture/` 这 5 个目录共 14 份文件，最新的也停在 2026-06-05，且**无一被索引引用**。它们事实上已是历史，却住在现役区。

### 病灶二：**正在误导人**的文档（本次治理最高优先级）

以下文档处在索引的**推荐路径**上，内容却与现状矛盾：

| 文档 | 索引位置 | 矛盾内容 | 危害 |
|------|----------|----------|------|
| `guides/QUICK_START.md` | INDEX「新手入门」**第 2 步** | 第 89–90 行仍教配 `GROK_API_KEY` | **高** — 新人照做必然失败 |
| `guides/DEPLOYMENT.md` | INDEX「详细指南」 | 第 75 行 `GROK_API_KEY` | 高 |
| `specs/AI_FEATURES_SPECIFICATION.md` | INDEX「规格说明」+ 根 README 直链 | 头部标「**状态: 已实现**」，日期停 2025-12-24 | 高 — 与「AI 95% 完成」相互背书 |
| `BASELINE_E2E_V01.md` | **INDEX 的 SSOT 表内** | 自述「历史基线记录」 | 中 — **SSOT 表里放历史文档，是定义级矛盾** |
| `docs/INDEX.md` | 索引本体 | 标「最后更新 2026-07-07」，但 `tasks/`、`design/` 有 07-24 文件；第 147 行仍写 `nul` 待删（**今日已删**） | 中 — 索引自身失准，连锁污染 |
| 根 `README.md` | 仓库门面 | 「AI 95% 完成」「Gemini」「版本 2.0 / 2025-12-24」 | 高 — 对外第一印象 |
| `VERSION.json` | 仓库根 | 写 DeepSeek/OpenAI/Ollama，与 README 的 Gemini 冲突 | 中 |
| `docs/README.md` vs 根 `README.md` | 两处 | **两份项目概述并存** | 低 |

**Grok 这条尤其说明问题**：项目早已换掉该 provider，但两份现役指南仍在教配置它。这不是「文档太多」造成的，是**没有机制标记文档何时失效**。

### 病灶三：索引维护靠人力，必然滞后

`INDEX.md` 结尾自定了维护约定（新增/移动文档时同步更新三处）。但它自己已滞后 17 天，且遗漏了 `0608-constitutional-guidance/` 的 25 份内容。

**靠纪律维持的索引，在多 AI 并行写文档的环境下不可能不掉队。** 需要一个不依赖纪律的机制（见方案 §3）。

---

## 方案

### 1. 分类原则：按**功能**分，不按年龄分

| 类别 | 定义 | 判据 | 处置 |
|------|------|------|------|
| **现役地图** | 今天开工必须照着做的 | 内容与 `09a68c9` 一致，且有人维护 | 留在 `docs/` 顶层与专用目录，**总数控制在 ≤10 份** |
| **学习档案** | 记录思考过程、复盘、会诊、评估 | 有认知价值，无操作指令性 | **一字不删**，集中到 `docs/journal/`，建可检索索引 |
| **历史归档** | 已结案的战役卡、已实施的设计 | 事情已做完，留作溯源 | 移入 `archive/` 系目录 |
| **待更正** | 内容与现状矛盾且仍在现役路径上 | 见病灶二清单 | **要么改对，要么标废止** —— 不允许原样留在现役区 |

### 2. 目标目录结构

```text
docs/
├── INDEX.md                ← 唯一入口，重写为"现役地图"清单（≤1 屏）
├── CURRENT_BASELINE.md     ← SSOT（已于 09a68c9 更新）
├── ARCHITECTURE.md         ← 需核对
├── DEVELOPMENT.md          ← 需核对
├── guides/                 ← 现役操作指南（先修 Grok）
├── specs/                  ← 现役规格（先核对状态标注）
├── tasks/                  ← 只留：活着的任务卡 + TEMPLATE + CURSOR_REFERENCE
├── design/                 ← 只留：仍在指导实现的设计
├── journal/                ← 【新建】学习档案，一字不删，含索引
└── archive/                ← 历史，只进不出
```

### 3. 关键机制：**每份文档头部一行状态标记**

这是本方案唯一的「新规矩」，也是唯一能长期生效的部分。

在每份 md 的标题下方加一行：

```markdown
> **状态**：现役 · 最后核对 2026-07-25
> **状态**：历史 · 已由 `CURRENT_BASELINE.md` 取代 · 冻结于 2026-06-18
> **状态**：学习记录 · 不作为操作依据
> **状态**：⚠️ 已废止 · 内容与现状矛盾（Grok provider 已弃用）
```

配套写入 `AGENTS.md` 一条：

> **无状态行的文档，不得作为操作依据。** Agent 读到无状态行的文档时，应向司令官确认后再采信。

**为什么这条比「维护索引」更可靠**：状态行**跟着文件走**。文件被移动、被别的 AI 读到、被搜索命中时，状态都在。而索引是外部的、集中的、必须靠人同步的——今天已经证明它会掉队。

### 4. 学习档案的索引设计

`docs/journal/INDEX.md` 按**三个维度**索引，而非只按时间：

- **按主题**：架构演进 / 多 Agent 协作 / 流程治理 / 技术选型 / 事故复盘
- **按时间**：2025-11 起的完整时间轴
- **按结论**：每篇一句话「当时得出了什么结论」+「该结论现在是否仍成立」

第三个维度是关键——它让学习记录**可复用**，而不只是可存档。

---

## 逐块处置清单（待拍板）

| # | 内容 | 份数 | 建议去向 | 理由 |
|---|------|------|----------|------|
| 1 | `thinklogs/`（全部） | 19 | → `journal/` | 学习记录本体 |
| 2 | `design/0608-constitutional-guidance/` | 26 | → **待定，见问题 A** | 既是设计依据又是过程记录 |
| 3 | `tasks/` 已结案卡（17 份孤儿） | 17 | → `tasks/archive/` | 战役已收束 |
| 4 | `design/` 已实施/已收束草案 | 12 | → `design/archive/` | 逐份核对后移 |
| 5 | `milestones/` `development/` `technical/` `requirements/` `architecture/` | 14 | → **待定，见问题 B** | 5 目录全部无索引、最新停 06-05 |
| 6 | `plan/DAY-1-EXEC-2026-06-05.md` | 1 | → `journal/` | 执行记录性质 |
| 7 | `guides/QUICK_START.md` `DEPLOYMENT.md` | 2 | **就地修正** Grok → 现行 provider | 现役必读，必须准确 |
| 8 | `specs/AI_FEATURES_SPECIFICATION.md` | 1 | **就地核对**「已实现」标注 | 与「95%」互相背书，需一并处理 |
| 9 | `BASELINE_E2E_V01.md` | 1 | 移出 SSOT 表 → `journal/` 或就地标「历史」 | SSOT 表不能放历史文档 |
| 10 | `docs/README.md` vs 根 `README.md` | 2 | → **待定，见问题 C** | 两份项目概述并存 |
| 11 | `INDEX.md` | 1 | **重写**为现役地图（≤1 屏） | 现版 180 行，混杂四类内容 |
| 12 | `archive/` 系全部 | 80 | **不动** | 已归档，位置正确 |

---

## 分批执行步骤（拍板后按批走，每批一个 commit）

### 批次 1：止血 —— 只改**正在误导人**的内容（不移动任何文件）

```powershell
# 逐份修正，不移文件，风险最低
# - guides/QUICK_START.md   : GROK_API_KEY → 现行 provider 配置
# - guides/DEPLOYMENT.md    : 同上
# - README.md（根）          : 「AI 95% 完成」「Gemini」与 VERSION.json 对齐
# - INDEX.md                : 删除 nul 条目、更新日期
git add -A && git commit -m "docs(governance): 批次1 修正与现状矛盾的表述"
```

**这一批单独做完就已解决 80% 实际危害**，且零移动风险。

### 批次 2：建学习档案

```powershell
mkdir docs\journal
git mv docs\thinklogs\* docs\journal\
# 撰写 docs/journal/INDEX.md（三维索引）
git commit -m "docs(governance): 批次2 建立学习档案 journal/"
```

### 批次 3：加状态行

按 §3 给现役文档逐份加状态行，并在 `AGENTS.md` 写入采信规则。

### 批次 4：归档搬迁

执行处置清单 #3 #4 #5 #6，逐份核对后 `git mv`。

### 批次 5：重写 INDEX

`INDEX.md` 压缩为「现役地图」一屏，历史与学习分别指向 `archive/INDEX` 与 `journal/INDEX`。

---

## 需要司令官拍板的问题

| # | 问题 | 选项 |
|---|------|------|
| **A** | `design/0608-constitutional-guidance/`（26 份）归到哪？ | (1) `archive/` —— 视为已完成阶段的历史<br>(2) `journal/` —— 视为立宪期的学习过程<br>(3) 保留在 `design/`，但整体加「历史」状态行 + 补一份目录 README<br>**注**：`CURRENT_BASELINE.md` 的「设计依据」仍引用其中文件，若移动需同步改链接 |
| **B** | `milestones/` `development/` `technical/` `requirements/` `architecture/` 这 5 个目录（14 份）？ | (1) 整体并入 `archive/`，删空目录<br>(2) 并入 `journal/`（`requirements/` `architecture/` 的中文需求稿有学习价值）<br>(3) 保留目录，只加状态行 |
| **C** | `docs/README.md` 与根 `README.md` 重复 | (1) 删 `docs/README.md`，`INDEX.md` 承担导航<br>(2) 根 README 面向 GitHub 访客，`docs/README.md` 面向开发者，各自明确定位并互链 |
| **D** | 状态行机制是否采纳？ | (1) 采纳，写入 `AGENTS.md` 作为硬规则<br>(2) 只加在现役文档上，不写成规则<br>(3) 不采纳，继续靠 INDEX |
| **E** | 今天做到哪一批？ | (1) 只做批次 1（止血，最小风险）<br>(2) 批次 1+2<br>(3) 全做完 |

---

## 预期结果

- `docs/` 顶层与现役目录合计 **≤10 份**文档，每份都有状态行、都被 `INDEX.md` 指向
- 学习记录 **19+ 份一字未删**，集中在 `journal/`，可按主题 / 时间 / 结论三维检索
- 现役路径上**不存在**与 `09a68c9` 矛盾的表述
- 任一 AI 工具开工时，读 `AGENTS.md` → `CURRENT_BASELINE.md` 两份即可上手，无歧义

## 验证方法

```powershell
# 1. 现役区文档数
(Get-ChildItem docs -Filter *.md -Recurse |
  Where-Object { $_.FullName -notmatch 'archive|journal' }).Count
# 预期：≤10（不含 guides/specs/tasks/design 内的现役件）

# 2. 现役路径无 Grok 残留
Select-String -Path docs\guides\*.md,docs\specs\*.md,README.md -Pattern 'GROK|Grok' 
# 预期：无输出

# 3. 学习记录零丢失
(Get-ChildItem docs\journal -Filter *.md).Count
# 预期：≥19

# 4. 文档总数不减（除非明确删除项）
(Get-ChildItem docs -Filter *.md -Recurse).Count
# 预期：217（纯移动不减少）
```

## 回滚方案

每批次独立 commit，回滚粒度到批次：

```powershell
git log --oneline --grep="docs(governance)"
git revert <批次 commit>
```

全部推倒：

```powershell
git reset --hard 09a68c9   # 治理起点
```

> **执行前置**：本卡任何批次开始前，确认工作区干净（`git status -sb` 只剩分支行）。
> 参考 2026-07-25 事故：`nul` 文件导致 `git stash` 中断、工作区进入不一致状态。**批量 `git mv` 前尤其要确认无此类残留。**
