# TASK-710-S: 创意组种子链 · 侦察任务书（Cursor）

> **状态**：✅ **已完成 · 2026-07-28 同日回报**。结论已并入 [TASK-710](./TASK-710-creative-seed-chain.md)：暗链严重度上调（新增路径 B）、710-A 扩大、卡序重排、参谋长六处判断修正见该文 §七。
> **探针清理**：`TASK710S-scout-*` 全部硬删，残留 0；《美丽的一天》WorkNote 8 未变，《新创意》未变。
> **状态（原）**：⏳ 待执行 · 创建 2026-07-28
> **模式**：**只读侦察，不改代码、不提交、不新建分支**
> **上游**：[TASK-710 创意组种子链补齐](./TASK-710-creative-seed-chain.md)
> **编制**：参谋长（Claude / Cowork），基于沙箱只读分析 + 2026-07-28 司令官对齐会话
> **执行**：Cursor IDE（本机实测 + 引用分析）
> **交付**：核实报告 + **异议清单**（会话内）。本任务**不产出任何代码**
> **基线**：`feature/workdetail-p1` @ `a0f9947`（与 origin 同步）

---

## 〇、先说清楚：本任务书作者的盲区

参谋长全程**只读代码，从未真正点击走过一遍创意组**。下列所有「此处通 / 此处断 / 此处会发生什么」的判断，都是从代码静态推出来的，不是跑出来的。

**Cursor 在本机有完整 IDE 与运行环境，请以实测推翻或确认。本任务的价值不在执行，在校正。**

> ⚠️ **工作区提示**：参谋长已在 `docs/tasks/` 新建两份未跟踪文档（`TASK-710-creative-seed-chain.md`、本文件）。工作区因此不再干净。**git 动作一律由司令官在本机执行**，Cursor 侦察期间不要 commit。

---

## 一、基线与判定原则

| 项 | 值 |
|----|-----|
| 分支 / HEAD | `feature/workdetail-p1` @ `a0f9947` |
| 判定原则 | **以实测为准。**与之不符的旧文档、旧注释一律视为过时——仅作记录，不作依据 |
| AI 冻结 | `AI_UI_FROZEN = true`。**凡涉及 AI 的缺口一律不算缺口，不要提修复建议** |

---

## 二、专项 · 暗链复现（**最高优先，请第一个做**）

### 参谋长的判断

`backend/src/routes/proposals.ts:130–152`：立项（`acceptIntoPlanningCore`）时，若提案的 `references[]` 中存在一条 `type === 'file_ref' && processingType === 'complete'` 的引用，后端会读取该 `FileReference.fileContent`，**按段落切开，`tx.chapter.createMany` 批量建成章节正文**。

界面上没有任何地方提示会发生这件事。

**溯源**：`3d282fe`（2026-06-02，author `root`）。

### 要检验

1. **这件事真的会发生吗？**请实际造出条件并跑一遍立项，观察作品是否凭空多出章节。
2. 生成的章节长什么样（标题、条数、`wordCount`）？
3. 若**没有**发生，是哪一步没满足条件？（这比"确认"更有价值）

### 复现的难处（请留意）

**现在没有任何 UI 能往提案里写 `references[]`** —— 这正是 TASK-710 说的「链 A 断了」。所以复现需要绕过 UI 直接造数据：

```text
建议路径（任选其一，请在报告中说明用了哪条）：
  a) 直接调 API：PUT /api/v2/proposals/:id，body 带 references[]
  b) prisma studio / 脚本直接写 Proposal.references
```

**若两条路都写不进去**，那本身就是重大发现——说明后端 schema 校验也不接受 `references`，710-C 的工作量要重估，请立即回报。

### 连带要查

4. `splitParagraphs` / `paragraphTitle` 是否**仅**被这一处引用？（决定 710-A 能否一并删掉）请用 IDE 引用分析，不要用 grep。
5. **存量普查**：全库现有多少条 `FileReference.processingType === 'complete'`？多少条 `Proposal.references` 非空？
   → 若为 0，710-A 的删除不影响任何既有数据；**若非 0，请立即停手回报**，删除方案要重写。

---

## 三、七项待检验判断

每项请明确回答「**确认 / 推翻 / 部分成立**」并附依据。

### J-1　`ReferencePicker.tsx` 孤儿六周后是否还能用

**证据**：该文件零引用（唯一命中是它自身的定义）。孤儿起点应为 `18939aa`（2026-06-12，`<CreativeDiscussion/>` → `<CreativeWorkspace/>`）。

**要检验**：
1. 它现在还能编译吗？依赖的 API / 类型有没有在这六周里变过？
2. 它的 `onConfirm` 产出的 `ProposalReference[]` 结构，与 `proposalsApi.update` 现在接受的 schema 还对得上吗？
3. **复活它的真实成本**——710-C 假设"搬控件回来"是中等工作量，请给出你的估计。

### J-2　三个字段确实无读取方

参谋长的静态结论：

| 字段 | 判断 | 依据 |
|---|---|---|
| `innovation` | 全仓唯一显示处 `PlanningProposal.tsx:184`，而该文件零 import | 静态 grep |
| `coreSetting` | 无任何显示处 | 静态 grep |
| `Proposal.metadata._tags` | 无读取方；`acceptIntoPlanningCore` 不复制 | 静态 grep |

**要检验**：用 IDE 引用分析复核，特别注意动态访问（`p[key]`、解构展开、模板字符串）。**有一处漏网，710-B 就会删掉在用的东西。**

**边界确认**：`Scrap.tags` / `FileReference.tags` / `Project.tags` 三套标签**必须保留**（前两套服务碎片页与参考页的筛选，第三套服务文集库分组）。请确认 710-B 的删除不会波及 `TagInput` / `TagFilterBar` 组件本身。

### J-3　总览把 `origin` 与 `conceiving` 混在一列

**证据**：`CreativeWorkspace.tsx:45`

```ts
const pending = proposals.filter(p => p.status === 'draft')
```

两个阶段同为 `draft`，徽标文案区分了，位置没区分。

**要检验**：
1. 界面上实际观感是否如此？
2. **历史提案中有多少条没有 `_creativeStage` 标记？**（`creativeStageLabel` 的 `default` 分支落到「作品构思中」）—— 710-F 分段时这些该归哪一段？

### J-4　`_evaluation` 恒空且被一路复制

**证据**：唯一写入方在孤儿 `CreativeDiscussion.tsx`；`ProposalDetailPage.tsx:298` 只读展示；`acceptIntoPlanningCore` 第 79 行把它复制进 Project metadata。实测两条现存提案均无此字段。

**要检验**：确认「详情页那块『构思评估记录』在真实使用中从来没有内容」。若你在本机见过它有内容，**立即回报**——说明还有参谋长没找到的写入方。

### J-5　`WorkNote.kind` 分岔的数据前提

710-D 要按 `kind` 分岔弹窗文案。

**要检验**：
1. 库里 `kind = 'initial'` 的记录实际存在吗？有多少条？（ROADMAP 称已积累 8 条真实记录，未说明 kind 分布）
2. `WorkNoteTimeline` 传给弹窗的 `entry` 是否**总是**带 `kind`？有没有可能为 `undefined`（老数据）？
3. 若 `initial` 一条都没有，710-D 的验证步骤要怎么改才可执行？

### J-6　`acceptIntoPlanningCore` 的完整动作清单

710-E 要把「接收」动作从创意组搬到企划课。参谋长读出它至少做四件事：

1. 创建 Project（**唯一 Project 写入点**）
2. 种子继承：`_settingSketch` → `workSetting`、`_evaluation` → metadata、synopsis
3. 记创作手记首条（`recordWorkNoteDiff`，含 `field: 'origin'`）
4. legacy 三表迁移（`character` / `timelineEntry` / `creativeFlow` 的 `proposalId` → `projectId`）
5. （710-A 将删除的暗链分支）

**要检验**：
1. 这份清单完整吗？有没有第 6、第 7 件事？
2. `approve` 端点的调用方有几处？除 `ProposalDetailPage` 外还有谁？
3. **搬迁后哪些动作该跟着走、哪些该留在原地**——这是你的判断，参谋长不预设。

### J-7　`AiSearchPage` 摘除入口的影响面

710-D 要把总览的「AI 搜索」灰卡改成「AI 讨论」灰卡，**但不删** `AiSearchPage.tsx`（12 行占位）与 `/creative/ai-search` 路由。

**要检验**：除总览外，还有没有别的地方链到 `/creative/ai-search`？（`Layout.tsx`、`CreativePage.tsx`、面包屑、SubNav 等）

---

## 四、实测走查（本任务的核心）

**请实际启动前后端，点着走完创意组小闭环，逐环记录。**

```text
灵感碎片 → 生成创意缘起 → 编辑种子 → 开始创意构思
  → 填标题/梗概/设定雏形 → 提交企划课 → 接收入企划课 → 作品详情
外来参考 → 提炼创意缘起 → （同上）
```

每一环报告：

| 环节 | 能否走通 | 卡在哪 | 是代码缺失 / 入口丢失 / 数据为空 |
|------|---------|--------|------------------------------|

**特别留意并如实记录这两处体感**（TASK-710 的立论就建在这上面，请证伪它）：

- **带不进素材**：从碎片生成种子后，回看时能不能找到原素材？「历史引用材料」那块是不是空的？
- **留不下想法**：构思过程中，"为什么想写这个"有没有地方可写？「构思评估记录」那块是不是空的？

若这两处体感与参谋长描述不符，**TASK-710 整个战役的立论就要重审**，请直接说。

---

## 五、回报格式

```markdown
## 〇、暗链复现（专项）
- 是否复现：是 / 否
- 复现路径：a) API / b) prisma / c) 都写不进去
- 生成章节：N 条，样例标题
- splitParagraphs 引用点：N 处（清单）
- 存量普查：processingType='complete' N 条 / references 非空 N 条

## 一、判断核实
J-1 确认 / 推翻 / 部分成立 —— 依据：
（J-2 … J-7 同）

## 二、实测走查结果
| 环节 | 通过? | 卡点 | 性质 |

## 三、两处体感证伪
- 带不进素材：属实 / 不属实 ——
- 留不下想法：属实 / 不属实 ——

## 四、异议清单（★ 核心产物）
对 TASK-710 六张卡的反对意见、更优方案、被忽略的风险。
**参谋长的方案不是定案，请直接质疑。**
特别欢迎质疑：
  - 六张卡拆得对不对？该合并还是该再拆？
  - 710-A 先打是否正确？
  - "AI 不直接写数据"这条红线是否过严？

## 五、执行顺序建议
含一条司令官尚未拍板的问题：
  本战役（补断链）与 ROADMAP 第一期地基（监听地址 / 默认密码 /
  字数统计三值不一 / 死依赖 / lint 撞 DLL 锁）孰先？
  你在本机天天受这些影响，请给出你的排序与理由。
```

---

## 六、纪律

- **只读**。不改代码、不 commit、不 push、不新建分支、不新建 worktree
- 需要验证运行时行为，可启动 dev server，但**不留下代码改动**
- **验收数据（TASK-700 §四·五）**：探针一律命名 `TASK710S-scout-*`；侦察完毕**逐项硬删并回报计数**，含关联 **WorkNote** 与误建 **Project**
- **禁止污染**《美丽的一天》（Project 1 / WorkNote 8）与《新创意》（Proposal `9f0e1be5-…`）。侦察前后各记一次计数
- lint 撞 Windows DLL 锁时：frontend 用 `npm run lint`，backend 用 `npx tsc --noEmit`
- 报告直接贴回司令官，由司令官转参谋长

---

## 七、下一步

三方（司令官 ↔ 参谋长 ↔ Cursor）对齐后，才展开 710-A 的完整执行卡。**本任务不产出任何代码。**
