# TASK-700-A: v2.7.27 侦察对齐任务书（Cursor）

> **状态**：✅ 已完成 · 创建 2026-07-27 · 侦察完成同日
> **模式**：**只读侦察，不改代码、不提交、不新建分支**
> **上游**：[TASK-700 v2.7.27 全链路打通计划](./TASK-700-v2.7.27-pipeline-completion.md)
> **编制**：参谋长（Claude / Cowork），基于沙箱只读分析
> **执行**：Cursor IDE（本机实测 + 代码对线）
> **交付**：对齐报告 + 异议清单（会话内）；后续执行卡见 [TASK-700-EXEC-queue.md](./TASK-700-EXEC-queue.md)
> **侦察数据**：`TASK700A-scout-*` 已硬删（2 Project + 2 Proposal）

---

## 〇、先说清楚：本任务书作者的盲区

参谋长全程**只读代码**，从**未真正点击走过一遍管线**。所有「此处通 / 此处断」的判断，
都是从代码静态推出来的，不是跑出来的。

**Cursor 在本机有完整 IDE 与运行环境，请以实测推翻或确认下列判断。**
本任务的价值不在于执行，在于**校正**。

---

## 一、基线与判定原则

| 项 | 值 |
|----|-----|
| 基线 commit | `11647b6`（`feature/workdetail-p1`，与 origin 同步） |
| 实测可用基线 | `0e99c14`（2026-07-25 司令官本机实测通过） |

> **判定原则（司令官定）**：**以 2026-07-25 实测基线为准。与之不符者一律视为过时——仅作记录，不作依据。**
>
> 遇到旧文档、旧注释、旧设计与现状冲突时，**不必考据、不必调和，直接以当前代码与实测为准**。

**AI 功能当前整体冻结**（`frontend/src/config/aiFreeze.ts` → `AI_UI_FROZEN = true`），
凡涉及 AI 的缺口一律**不算缺口**，不要提修复建议。

---

## 二、六项待检验判断

以下每一项都附了参谋长的证据。**请逐项核实，并明确回答「确认 / 推翻 / 部分成立」。**

### J-1　编审部与文集库跑在已废弃的 `transition` 上

**证据**：`backend/src/routes/projects.ts:679` 注释原文

```ts
// POST /projects/:id/transition — 兼容层（Deprecation）；桶内窄白名单，跨桶硬拒
```

调用方：
- `components/work/EditorialActions.tsx:53/61/65` → `transition('reviewing')` / `transition('reviewed')`
- `components/work/LibraryActions.tsx:52` → `transition('archived')`

**要检验**：
1. 运行时 `transition` 是否真的有问题？还是**工作良好，只是注释吓人**？
2. 若工作良好，改造的收益是什么？是否值得动？
3. 是否存在 `transition` 能做而语义端点做不到的场景？

### J-2　同一交接在不同界面走不同机制

**证据**：

| 交接 | 立宪机制 | 实际调用点 |
|------|---------|-----------|
| 创作室 → 编审部 | `release-to-editorial` | **仅** `pages/writing/WritingProjectsPage.tsx:94`；`components/work/StudioActions.tsx` 改用 `submitReview` |
| 编审部 → 文集库 | `release-to-library` | **仅** `pages/EditorialPage.tsx:124`；`EditorialActions` 未调用 |

**要检验**：这是**设计如此**（列表页与详情页职责不同），还是**历史分叉**？

### J-3　`submitReview` 与 `release-to-editorial` 可以合一

司令官已拍板 **C=(1) 二者合一：提交审阅即交接**。

**要检验**：
1. 合并是否破坏现有状态机？
2. `submittedToReviewAt` 与 `_releasedToEditorialAt` 两个时间戳，合并后如何处置？
3. 有无参谋长未看到的依赖方？

### J-4　三张 legacy 表可完整删除

司令官已拍板 **D=完整清理**（`Character` / `TimelineEntry` / `CreativeFlow`）。

**⚠️ 参谋长未查过任何数据。**

**要检验（必做）**：
1. **存量普查** —— 三张表当前各有多少行？是否有真实创作数据（如《美丽的一天》的人物）？
2. 若有数据，是否已在 `workSetting` 中有对等内容？删除会不会**丢掉用户真实资产**？
3. 建议的迁移 / 备份路径

> **本项未完成前，禁止任何删表动作。**

### J-5　`versionApi.ts`（371 行）是死代码

**证据**：`frontend/src/services/versionApi.ts` + `types/version.ts` 静态 import 零命中；
`backend/src/index.ts` 未注册任何 version 路由。

**要检验**：是否存在动态引用 / 字符串路由 / 测试引用？

### J-6　创意组总览页需要「新建」

司令官已拍板 **A=(3) 新建创意组总览页**（承载灵感碎片 + 外部参考 + 创思研发，
提案入口另设，点入才是正式流程）。

**但仓库里已存在 `components/creative/CreativeWorkspace.tsx`。**

**要检验**：该组件现状如何？能否改造承担总览页，而非从零新建？

---

## 三、专项：设定字段写入点枚举（**最高风险，请重点对待**）

创作手记需在 **workSetting / synopsis / chapterPlanning** 的**全部写入路径**上挂钩子。

> **漏掉一处的后果**：该路径上的修改**永远不会被记录**，且**不会抛出任何错误**。
> 作者要到几个月后打开手记，才会发现少了一整块，而那时**已无法补记**。

参谋长用 grep 找到的候选（**不保证完整**）：

- `PUT /projects/:id`（`routes/projects.ts:1169`）
- `POST /projects/:id/confirm-metadata`（`routes/projects.ts:450`）
- `PUT /projects/:id/chapter-planning`（`routes/projects.ts:1240`）
- `utils/workSynopsis.ts` → `applySynopsisMetadataWrite` 的全部调用点
- `utils/workSetting.ts` → `pickWorkSettingPatch` / `seedWorkSettingFromSketch` 的全部调用点
- 提案侧：`routes/proposals.ts` 中 `_settingSketch` 相关写入
- 立项路径：`confirm-greenlight` / `move-to-planning`

**要求 Cursor 用 IDE 的引用分析（不是 grep）给出权威清单**，并标注：

1. 每个写入点写的是哪些字段
2. 是否在事务内
3. 建议的钩子挂载位置（单点收口 or 分散挂载）

---

## 四、实测走查（本任务的核心）

**请实际启动前后端，点击走完整条管线，逐环记录。**

```text
创意组建提案 → 企划课填设定 + 章节规划 → 确认 → 交接创作室
  → 写正文 → 交接编审部 → 审阅 → 交接文集库 → 归档
```

每一环报告：

| 环节 | 能否走通 | 卡在哪 | 是代码缺失还是入口找不到 |
|------|---------|--------|------------------------|

**特别留意**：`components/Layout.tsx:24` 创意组导航指向 `/creative/chat`，
而 `pages/creative/ChatPage.tsx` 是 12 行占位页。请确认这是否就是「创意组不完善」的实际成因。

---

## 五、回报格式

```markdown
## 一、判断核实
J-1 确认 / 推翻 / 部分成立 —— 依据：
（J-2 … J-6 同）

## 二、写入点权威清单
| 文件:行 | 写入字段 | 事务内? | 建议钩子位置 |

## 三、实测走查结果
| 环节 | 通过? | 卡点 | 性质 |

## 四、异议清单（★ 核心产物）
对 TASK-700 计划本身的反对意见、更优方案、被忽略的风险。
**参谋长的方案不是定案，请直接质疑。**

## 五、执行顺序建议
若你认为阶段划分或优先级应调整，请给出理由。
```

---

## 六、纪律

- **只读**。不改代码、不 commit、不 push、不新建分支、不新建 worktree
- 需要验证运行时行为，可启动 dev server，但**不留下代码改动**
- 走查产生的测试数据，请在报告中说明是否需要清理
- 报告直接贴回给司令官，由司令官转参谋长

---

## 七、下一步

三方（司令官 ↔ 参谋长 ↔ Cursor）对齐后，才拆执行卡。**本任务不产出任何代码。**
