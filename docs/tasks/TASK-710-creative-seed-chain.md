# TASK-710: 创意组种子链补齐

> **状态**：⏳ 待授权 · 战役计划 + 卡队列 · 创建 2026-07-28
> **架构师**：Claude（参谋长）
> **操作员**：Cursor IDE
> **基线**：`feature/workdetail-p1` @ `a0f9947`（与 origin 同步）
> **上游**：司令官 2026-07-28 创意组对齐会话
> **取代**：[TASK-700-H](./TASK-700-H-creative-conceiving-workbench.md) 的详情页三栏部分（作废，理由见 §三）

审卡四条：不超范围、假设已声明、验证可执行、回滚真能回。

---

## 一、病因

**创意组流程齐全，但构思阶段只剩一张表单——带不进素材，留不下想法。**

`CreativeDiscussion.tsx`（360 行，纯人类构思工作台，零 AI 调用）在 2026-06-12 `18939aa` 被 `CreativeWorkspace` 顶替入口后零引用至今。顶替者接手了流程（`_creativeStage` 三段模型），**没接手它的两个输入控件**，于是断了两条链：

| 链 | 断点 | 现象 |
|---|---|---|
| **A · 素材 → 构思** | `ReferencePicker.tsx` 零引用；`createOriginFromScrap` / `createOriginFromExternalRef` 代码注释明写「不写 `references[]`」 | 详情页「历史引用材料」恒空，无任何路径可写入 |
| **B · 构思过程 → 记录** | `_evaluation` 的唯一写入方在同一个孤儿文件里 | 详情页「构思评估记录」恒空；后端 `approve` 仍在把这个恒空字段复制进 Project metadata |

### 暗链（本战役头号目标）

> **2026-07-28 侦察实测修正：严重度上调。参谋长原描述写窄了。**

`backend/src/routes/proposals.ts:130–152` 立项时会把外来参考**全文按段落切开，批量建成章节正文**（`tx.chapter.createMany`）。触发条件有**两条**，参谋长原先只看到第一条：

```ts
const sourceRef = refs.find(r => r.type === 'file_ref' && r.processingType === 'complete')
const metaSource = metadata._sourceRef as { type?: string; id?: string } | undefined
const fileRefId = sourceRef?.id ?? (metaSource?.type === 'file_ref' ? metaSource.id : undefined)
//                                 ↑ 这条 fallback 不检查 processingType
```

| 路径 | 触发条件 | 实测结果 |
|---|---|---|
| **A** | `references[]` 含 `file_ref` + `processingType === 'complete'` | 生成 **6 条**章节 |
| **B ⚠️** | 仅 `metadata._sourceRef = {type:'file_ref', id}`，**无 `references[]`**，`processingType` 可为 `none` | 生成 **2 条**章节 |
| 碎片 | `references` 仅含 `type:'scrap'` | 0 条（暗链只认 `file_ref`） |

**路径 B 是要害**：`createOriginFromExternalRef` 写的正是 `_sourceRef`。也就是说——

> **「外来参考 → 提炼缘起 → 接收入企划课」这条幸福路径本身就会凭空造章节。**
> 不需要任何人去勾 `processingType`，走正常流程就会发生。

界面上没有任何地方提示会发生这件事。

**存量普查（侦察实测）**：`FileReference` 总量 0、`processingType==='complete'` 0 条、`Proposal.references` 非空 0 条 → **删除不伤既有数据**。但这只说明**还没炸过存量**，不说明安全——它是现役明路径上的暗行为。

**溯源**：引入于 `3d282fe`（2026-06-02，author `root`，「创意组第二批 — 创意讨论/创意提案/企划建议书/主页改造」）——与 `CreativeDiscussion` 同一批。此后 `18939aa` 删掉了前端的明链入口，**后端的暗链留了下来**。

> 一句话：**想要的明链（素材作附件跟随）不存在，不想要的暗链（素材变成正文）在跑。**

---

## 二、已拍板结论（2026-07-28 司令官）

1. **详情页不做三栏。**判据由司令官给出——看全局。实测：作品详情 `WorkDetailPage` 是单栏 + 4 Tab、`WritingProjectPage` 单栏；三栏只用于挑选型页面（`ReviewDetailPage`、`ScrapNote`、`ExternalRefs`）。提案详情属详情型 → 单栏。
2. **构思笔记要做。**补回 `_evaluation` 的输入口。
3. **「接收入企划课」按 0608 拆开**：创意组只有「提交」，企划课才有「接收」。
4. **引用收敛为「引用 / 不引用」**，去掉整体/部分二分。
5. **引用素材应作附件跟随**至作品详情。
6. **不加"第 0 个 Tab"**：缘起已作为创作手记首条（`field: 'origin'`）落盘，编审部右栏可见。再加载体是重复建设。
7. **AI 搜索 / AI 讨论不算缺口**（冻结原则）。真正要补的来源是两个，不是四个。
8. **笔记体系不新建表**：`WorkNote` 已是汇聚点，按 `field` 扩展即可。「企划笔记」已存在（7 个 tracked field）；「审阅笔记」= ROADMAP 三期「人类审阅载体」，同一件事，不开两条；「写作笔记」需 `WorkNote` 加 `chapterId` 且不能用 diff 记录，**本战役不做**。
9. **AI 搜索不是独立来源，归位到外来参考**。判据：产物有没有现成承载物——搜索产物是外部材料，`FileReference` 已能装（`fileContent` 可空、有 `sourceUrl` 与 `metadata`）。总览来源区由四块收敛为**三块**：灵感碎片 / 外来参考 / AI 讨论（灰）。`AiSearchPage.tsx` 实测仅 12 行 `PlaceholderPage`，此刻改动成本为零。
10. **种子与素材单向、不同步**。由素材生成种子后，种子独立存在；素材事后修改不回流、不双向同步。需要新版本时另起一个种子引用。
11. **无人确认的写库，一律禁止（红线）**。

    > **2026-07-28 侦察修正措辞**：原表述为「AI 不直接写数据」。归因偏了——暗链是 2026-06 的自动化行为，与 AI 无关。红线该留，但要立得更硬、更宽：

    - **任何自动化不得在立项（或任何交接）时静默物化正文 / 章节。**
    - AI 只产出草稿，落盘一律由人确认后触发（原意保留，作为本条的一个特例）。

    判据不是"是不是 AI 干的"，是**"有没有人点过头"**。

12. **去掉提案层标签**（`metadata._tags`）。

    > **2026-07-28 侦察修正理由**：原写「无读取方」，**不准确**。`ProposalDetailPage` 的 `TagInput` 就是读写方，能填、能看见。

    准确表述：**标签有本地读写，但无跨实体消费者——立项不复制，出了创意组就消失。**所以这是**产品拍板**（司令官 2026-07-28：类型标签对创作无意义，归类留给文集库），**不是"删了没人看见"**。审卡时不要按零影响处理，删除后详情页会少一个可见控件。

    **仅限提案层**——全仓有三套互不相干的标签，另两套现役保留：

| 标签 | 位置 | 现状 | 处置 |
|---|---|---|---|
| 提案标签 | `Proposal.metadata._tags` | 无读取方；`acceptIntoPlanningCore` 不复制；实测现存 2 条提案均为 `[]` | ❌ **删** |
| 素材标签 | `Scrap.tags` / `FileReference.tags`（表列） | 现役：`ScrapNote` / `ExternalRefs` 均有录入（`TagInput`）+ 筛选（`TagFilterBar`） | ✅ 留 |
| 作品标签 | `Project.tags`（表列，schema 注释 `// Collection Management`） | 现役：`CreateProjectModal` 录入、`ProjectCard` 显示 | ✅ 留 —— **司令官所说「最后在文集库再定」，这套已经存在** |

---

## 三、与 TASK-700-H 的关系

| 700-H 内容 | 处置 |
|---|---|
| 总览补第四块 AI 讨论灰卡 + 灵感/参考可点样式 | ⚠️ **缩小**后保留 → 本战役 **710-D**。不再"补第四块"，改为**两块 AI 灰卡合成一块**（结论 9），来源区共三块 |
| 手记弹窗 `initial`/`edit` 文案分岔 | ✅ 保留 → 本战役 **710-D** |
| 详情页改三栏 | ❌ **作废**（结论 1） |
| 右栏「横向对照防撞车」 | ❌ **作废**。全库现存 2 条提案且 `_tags` 全空（实测），280px 常驻栏恒显 1 行、恒无高亮 |
| 「AI 讨论整块缺失」的病因认定 | ❌ **更正**。700-E 删的 `ChatPage.tsx` 是 12 行 `PlaceholderPage`；真正丢的是非 AI 的 `CreativeDiscussion`，且与 700-E 无关 |

---

## 四、卡队列

> **2026-07-28 侦察已回报**（[TASK-710-S](./TASK-710-S-cursor-scout.md)），本节顺序已按侦察建议重排。

| 序 | 卡 | 标题 | 层 | 规模 | 依赖 | 状态 |
|---|---|---|---|---|---|---|
| — | **710-S** | Cursor 现场侦察（只读） | — | — | — | ✅ **已完成 2026-07-28** |
| 1 | **[710-A](./TASK-710-A-dark-chain-removal.md)** | 拆暗链（扩大版）+ 地基 | backend | 小 | — | ✅ **已完成 2026-07-28**（`a336f6d` / `9110066` / `24bfbef`） |
| 2 | **[710-B](./TASK-710-B-conceiving-note.md)** | 构思笔记 + 清理无消费者字段 | frontend(+1 行 backend) | 小 | — | 📋 **完整卡已出 · 待授权** |
| 2 | **[710-D](./TASK-710-D-source-realign.md)** | 来源归位（三块）+ 手记文案分岔 | frontend | 小 | — | 📋 **完整卡已出 · 待授权** |
| 3 | **710-C** | 素材明链 · 引用可写与跟随 | 前后端 | 中 | 710-A | ⏳ 待授权 |
| 4 | **710-E** | 部门边界 · 接收动作归企划课 | 前后端 | 中 | 710-C | ⏳ 待授权 |
| 5 | **710-F** | 总览分段 · 缘起与构思分列 | frontend | 小 | — | ⏳ 待授权 |

**排序依据（侦察异议 2 / 5，参谋长同意）**：

- **A 必须第一**，且理由比原先更强——它不是休眠炸弹，是**现役幸福路径上的副作用**。存量为 0 只说明还没炸过存量。
- **地基两行与 A 同窗口收掉**，不单独排队（两行代码，且都在 backend）。
- **F 降级到最后**：现库无 origin 提案，混列痛感暂不存在。
- B / D 可并行。C 依赖扩大后的 A。

---

### 710-A · 拆暗链（**扩大版**）

> **2026-07-28 侦察异议 1 已采纳：原范围写窄了。**只删 `processingType === 'complete'` 分支不够——`_sourceRef` fallback 会让「外来参考 → 接收」继续造章。

**做什么**：删除 `acceptIntoPlanningCore` 中的整段章节物化逻辑（`backend/src/routes/proposals.ts:130–152`），**两条触发路径一并去掉**：

1. `references[]` 中 `processingType === 'complete'` 的分支
2. **`metadata._sourceRef` → `fileContent` → `createMany` 的 fallback**（路径 B，要害）

连同 `splitParagraphs` / `paragraphTitle` 一并删除——**侦察已确认仅此一处引用**（全仓符号搜索复核，无第二引用）。

**不做什么**：不动 `approve` 的其余部分（Project 创建、`_settingSketch` → `workSetting`、`_evaluation` 复制、WorkNote 首条、legacy 三表迁移、Proposal 回写）。不改 schema。**不删 `_sourceRef` 字段本身**——它作为「来源说明」仍在详情页展示，只是不再触发物化。

**假设（侦察已证实，无需再验）**：`FileReference` 总量 0、`processingType==='complete'` 0 条、`references` 非空 0 条 → 删除不改变任何现有作品的既有章节。

**验证**：
```powershell
git diff -- backend/prisma/schema.prisma   # 预期空
cd backend; npx tsc --noEmit; npm test     # 16 用例应仍全绿
```

**两条路径都要回归**（侦察已给出可复现步骤）：
- 路径 A：造 `references[]` 含 `file_ref` + `complete` → 接收 → 章节数应为 **0**（修复前 6）
- 路径 B：走**正常 UI**「外来参考 → 提炼缘起 → 接收」→ 章节数应为 **0**（修复前 2）

**回滚**：`git revert`。无 migration，无数据变更。

---

### 710-B · 构思笔记 + 清理无读取方字段

**做什么**：
1. `ProposalDetailPage.tsx` 在「基础信息」与「设定雏形」之间插入**构思笔记**文本框，读写 `metadata._evaluation`，随现有「保存」按钮一起提交。
2. 「构思评估记录」只读面板由该输入框取代（不再是恒空展示）。
3. 停写 `innovation` / `coreSetting`：移除两处 state 与 payload 字段。
4. **移除提案标签**（结论 12）：删 `ProposalDetailPage` 的 `TagInput` 与 `tags` state、`creativeOrigin.ts` 中 `advanceOriginToConceiving` 的 `_tags: fields.tags` 与 `createConceivingProposal` 的 `_tags: []`。
   **注意边界**：`TagInput` / `TagFilterBar` 组件本身**不删**——`ScrapNote` 与 `ExternalRefs` 仍在用。`Scrap.tags` / `FileReference.tags` / `Project.tags` 三处一律不动。
   **这是可见改动**：详情页会少一个输入控件（见结论 12 修正）。
5. **空 `_evaluation` 不再污染 Project**（侦察异议 8）：`acceptIntoPlanningCore` 现用 `metadata._evaluation !== undefined` 判断，**空字符串也会被复制**（实测 `projectEval: ""`）。改为非空才复制。
   —— 本项动 backend 一行。若司令官希望本卡保持纯前端，可拆到 710-A 一并做（两者同文件）。

> **侦察补充（`innovation` / `coreSetting`）**：两字段虽无 UI，但详情页 load → save 会**静默保留**既有值——《美丽的一天》提案里实测已存有 `"哈哈哈，瞅瞅？"`。停写后该值不再回写，**但库里旧值仍在**（不删列、不清数据）。若司令官希望连旧值一起清，需另行拍板。

**幽灵字段判据（实测）**：`innovation` 全仓唯一显示处是 `PlanningProposal.tsx:184`，而该文件零 import；`coreSetting` 无任何显示处；`acceptIntoPlanningCore` 不读这两个字段，立项不带走。设定雏形 `_settingSketch` 四块已覆盖同一语义。**保留数据库列，仅停止前端写入**——不动 schema。

**不做什么**：不改状态机、不改提交门槛（标题 + 梗概仍必填，构思笔记可留空）、不动 schema。

**验证**：
```powershell
# 填写构思笔记 → 保存 → 刷新仍在
# 接收入企划课 → Project metadata._evaluation 应含该内容（approve 现有行为）
cd frontend; npm run lint; npm run build
```

**回滚**：`git revert`。已写入的 `_evaluation` 是 JSON 字段追加，回滚后不显示但不丢失。

---

### 710-C · 素材明链

**做什么**：
1. **引用可写**：详情页「引用材料」由只读改为带「+ 引用素材」，复活 `ReferencePicker.tsx`（本卡即为该孤儿的定性结论：**入口丢失，补入口**）。
2. **收敛取值**：`processingType` 三值 → 二值语义（引用 / 不引用）。类型定义与 `TypeLabel.tsx` 同步；旧数据中的 `partial` 按「引用」读。
3. **立项跟随**：`acceptIntoPlanningCore` 把 `references[]` 复制进 Project metadata，作附件跟随；作品详情提供只读展示位。

> 原第 4 项「标签定性」已于 2026-07-28 拍板 → 去除，改由 **710-B** 执行（结论 12）。

**假设**：附件跟随只做**只读展示**，不做在作品详情内增删引用。素材本体（Scrap / FileReference）不复制，只存引用。**引用是单向快照——素材事后修改不回流**（结论 10）。

**⚠️ 侦察异议 7 · 复活 `ReferencePicker` 的陷阱**：该组件**会过滤掉 `processingType === 'none'` 的外来参考**，而导入的默认值就是 `none`。不改这个过滤，用户打开挑选框会看到「没有材料可引用」——一个比现在更糟的体验。**收敛为二值时必须同步改掉这个过滤条件。**

**侦察给出的成本估计**：中偏小，约 0.5–1 人日。控件本身可用（`npx tsc -b` 前端通过，`scrapsApi` / `externalRefsApi` / `ProposalReference` 契约仍对齐，`PUT references` 实测可写），但要接上 `ProposalDetailPage` 的加载/保存链路，**不是粘回去就完**。

**不做什么**：不恢复 `CreativeDiscussion.tsx` 整体（其 `_discussionSubmitted` 状态模型已被 `_creativeStage` 取代，整体复活会撞状态机）——只搬输入控件。不做相似度/查重。

**依赖**：必须在**扩大版** 710-A 之后。二者都动 `approve` 路径，且 A 删掉的正是消费 `references` / `_sourceRef` 的那段。

**验证**：探针提案挑 2 条素材 → 保存 → 提交 → 接收 → 作品详情可见同样 2 条附件；`git diff -- backend/prisma/schema.prisma` 为空。

**回滚**：`git revert`。跟随写入的是 Project metadata JSON 字段，回滚后不显示、不丢失。

---

### 710-D · 总览可发现性 + 手记文案分岔

**做什么**（= 700-H 保留部分，继承其假设 6；假设 3 按结论 9 缩小）：
1. `CreativeWorkspace.tsx` 左列「灵感碎片」「外来参考」加明显可点样式；**现有「AI 搜索」灰卡改为「AI 讨论」灰卡**（`AI_FROZEN_LABEL`，不可点）。来源区共三块，**不新增第四块**。`AiSearchPage.tsx` 与 `/creative/ai-search` 路由本卡**不删**（留待孤儿定性卡统一处置），仅从总览摘除入口。
2. `WorkNoteNoteModal.tsx` 按 `entry.kind` 分岔文案：`edit` →「当时为什么这么改」/「写下改动的理由（可留空）」；`initial` →「这块设定当初是怎么想的」/「写下当时的构思（可留空）」；未知 kind 走 `edit`。

**已核实**：`WorkNote.kind` 字段存在（`api.ts:190`），弹窗已接收 `entry`，**无需改 props**。侦察补充：`WorkNoteTimeline` 传入完整 `entry`，schema 默认 `kind: 'edit'`，**老数据无 `undefined` 风险**。

**验证数据现成**（侦察实测）：《美丽的一天》有 **6 条 `initial` + 2 条 `edit`**，两侧各点一次即可，**不必另造探针**。注意立项新建的手记是 `kind = 'edit'`（真实事件），不是 `initial`。

**不做什么**：不新建 `ChatPage`、不建讨论路由、不解冻 AI。灰卡是把「入口丢失」显式占回，不假装功能已交付。

**验证**：`/creative/workspace` 见**三块**来源（灵感碎片 / 外来参考 / AI 讨论灰）；编审详情点 `initial` / `edit` 各验一次文案。`npm run lint && npm run build`。

> **2026-07-28 侦察异议 4 已修**：原验证文案写「见四块来源」，与结论 9 的三块自相矛盾，已改。

**回滚**：纯前端 `git revert`。

---

### 710-E · 部门边界

**做什么**：按 0608 立宪，创意组详情页去掉「接收入企划课」；接收动作移入企划课。

**`acceptIntoPlanningCore` 完整动作清单**（侦察已补全，参谋长原列 5 项不完整）：

| # | 动作 | 搬迁后归属 |
|---|---|---|
| 1 | 创建 Project（**唯一 Project 写入点**） | 跟接收走 |
| 2 | 种子继承：`_settingSketch` → `workSetting`、`_evaluation`、synopsis | 跟接收走 |
| 3 | 记创作手记首条（`recordWorkNoteDiff`，含 `field: 'origin'`） | 跟接收走 |
| 4 | legacy 三表迁移（`character` / `timelineEntry` / `creativeFlow`） | 跟接收走 |
| 5 | 章节物化暗链 | **710-A 删掉，不搬** |
| 6 | **回写 Proposal**：`projectId` + `status: 'approved'` | 跟接收走 |
| 7 | **Project metadata 固定键**：`SOURCE_FROM` / `PROPOSAL_ID_LEGACY` / `FROM_EVALUATE` / `PLANNING_PHASE` | 跟接收走 |
| 8 | **`description` / `synopsis` 经 `synopsisFieldsForCreate` 写入** | 跟接收走 |

**三个后端入口同核**（侦察发现，参谋长只看到一个）：`POST accept-into-planning`、`PUT evaluate(approve)`、`PUT approve`。现役前端只有 `ProposalDetailPage` → `PUT /approve`；死代码 `PlanningProposal` 走 `evaluate`。

**搬迁判断（侦察建议，参谋长同意）**：**核函数留在后端不动**，只搬「按钮归属」——创意组只留「提交」，企划课加「接收」。八项动作除第 5 项外全部跟接收走。

**依赖**：710-C 之后（C 会改动同一函数）。

---

### 710-F · 总览分段

**做什么**：`CreativeWorkspace.tsx` 中列由一段拆为两段——「创意缘起 N」（`_creativeStage === 'origin'`）与「作品构思中 N」（`conceiving` 及无阶段标记者）。

> **侦察补充**：现库 `draft` 只有《新创意》一条（`conceiving`），**眼下看不到混列现象**；**无 `_creativeStage` 标记的历史提案为 0 条**，把无标记归入「构思中」对现状安全。因痛感暂不存在，**优先级低于 A / B / C**。

**病因（实测 `CreativeWorkspace.tsx:45`）**：

```ts
const pending = proposals.filter(p => p.status === 'draft')
```

`origin` 与 `conceiving` 同为 `draft`，全部挤在「作品构思中」一列。徽标文案区分了阶段，位置没有——**种子和半成品混着摆，这正是"打开创意组看不懂"的直接原因之一。**

**不做什么**：不改状态机、不改 `status` 语义、不新建页面、不动排序以外的任何逻辑。纯呈现层。

**验证**：总览中列出现两段计数；`origin` 提案只出现在上段，`conceiving` 只出现在下段；`submitted` 仍在右列。`npm run lint && npm run build`。

**回滚**：纯前端 `git revert`。

---

## 五、显式未拆

| 事项 | 理由 |
|---|---|
| 孤儿定性（`CreativeDiscussion` / `PlanningProposal` / `ProposalsPage` / `ProposalReviewPage` / `ReferencesPage` / `filters.ts#isProposalSubmittable`） | 本战役不删任何文件。`ReferencePicker` 的定性在 710-C 内解决，其余待单独侦察卡 |
| `services/dashboard.ts` 对 `_discussionSubmitted` 的悬空读 | 分支永久为假，不影响功能。随孤儿定性一并处理 |
| 「写作笔记」 | 需 `WorkNote` 加 `chapterId`，且正文不能用 diff 记录（每次自动保存都变）。动 schema，等第一期地基之后 |
| 「审阅笔记」 | 与 ROADMAP 三期「人类审阅载体」是同一件事，归三期 |
| **AI 讨论 → 种子的生成方式**（解冻后） | 冻结期不算缺口。**但方式已定，写在此处以免解冻时另起炉灶**：① 不存对话记录，**不新建表**；② 由人点「生成创意种子」按钮触发，**不由 AI 在对话中自行判断意图**（结论 11）；③ AI 只把对话内容预填成种子草稿（标题 / 梗概 / 构思笔记），人改完点保存才走 `createOrigin` 落盘；④ `_sourceNote` 写「来自 AI 讨论：<话题>」，与碎片 / 参考两条来源同构。<br>**去掉"AI 预填"这一步，剩下的就是现有的「+ 新作品创意构思」——已经能跑。**这正是冻结要逼出的结果：解冻时增量极小 |
| 文档漂移：`CURSOR_REFERENCE.md` 仍写 `/creative/chat` + L2 占位；`CURRENT_BASELINE.md` 仍写 HEAD `0e99c14`、700-B~G 与 WorkNote 表未录入 | 单出文档卡 |
| AI 解冻、新 schema、重做总览、创意组 v2 立宪整包 | 明确不做 |

---

## 六、与其他战线的关系

- **阶段一人工走查**（700-B/C/D 三处修复只验了代码，无人点着走过）仍未做,不被本战役取代。
- **ROADMAP 第一期地基**（监听地址、默认密码、字数统计三值不一、死依赖、backend lint DLL 锁）与本战役**竞争同一段时间**。第一期是「让现在能用的东西可靠」,本战役是「补一条断链」——**孰先需司令官排序**，参谋长不代拍。
- 本战役全程**不动 schema、不新建表**，与第二期「数据模型收口」无冲突。

---

## 七、附录 · 侦察对参谋长判断的修正（2026-07-28）

**留档目的：记录参谋长错在哪、错法是什么，供后续 Agent 引以为戒。**

| # | 参谋长原判断 | 侦察结论 | 错法归类 |
|---|---|---|---|
| 1 | 暗链只有 `processingType === 'complete'` 一条触发路径 | **推翻**。`_sourceRef` fallback 不检查 `processingType`，外来参考幸福路径就会造章 | **读到了但没读完**——那三行 `??` fallback 就在眼前，只看了前半句 |
| 2 | 提案 `_tags`「无读取方」 | **推翻**。`TagInput` 就是读写方，能填能看见 | **把"无跨实体消费者"说成"无读取方"**，两件事 |
| 3 | 710-D 验证文案「见四块来源」 | **自相矛盾**。结论 9 已改为三块，验证段没同步 | **改了正文没改验证**——同一份文档内部不一致 |
| 4 | `approve` 动作清单 5 项 | **不完整**，实为 8 项 + 三个后端入口 | 枚举不彻底 |
| 5 | `ReferencePicker`「搬回来就行」 | **过于乐观**。它会过滤 `processingType === 'none'`，而导入默认就是 `none` | 只看了组件存在，没看它的过滤条件 |
| 6 | 红线表述「AI 不直接写数据」 | **归因偏**。暗链是 2026-06 自动化，与 AI 无关 | 把一次自动化事故错误归因给 AI，导致规则立窄 |
| 7 | 710-A 卡：改 `host` + 写 `.env` 两行即可锁门 | **推翻**。`index.ts` 从未加载 dotenv，`.env` 里的 `APP_PASSWORD` 是死的 | **两端都查了，没验中间那根线**——查了 `auth.ts` 怎么读、查了 `.env` 有没有这个键，就是没问「`.env` 到底加载了吗」 |
| 8 | 710-A 卡：门禁「预期 4 suites / 16 tests」 | 实际 5 / 22 | 抄了 07-25 的 `CURRENT_BASELINE`，未复核。**卡在制造假警报** |

**共同点**：八条里有五条（1、3、4、5、7）是**看了一半就下结论**。这与前任参谋长「从静态信息推断动态事实」是同一类错的变体——不是没看代码，是**看了但没看到底**。

**沿用结论**：`AGENTS.md` 的判定原则依然有效，且需加一句——**参谋长的静态分析一律标注为「待实测」，不得作为执行卡的免验前提。**本战役中，唯一因侦察而免验的项是「存量普查为 0」（710-A 假设段已注明）。

---

## 八、验收数据纪律（沿用 TASK-700 §四·五）

- 探针一律用 `TASK710X-probe-*` 命名；禁止污染《美丽的一天》《新创意》。
- 每卡收尾逐项清理并回报计数，**含关联 WorkNote 与误建 Project**。
- 删零引用文件前先判「功能废弃 / 入口丢失 / 被取代但功能有缺」——三者处理不同。本战役的 `ReferencePicker` 属第三种。
