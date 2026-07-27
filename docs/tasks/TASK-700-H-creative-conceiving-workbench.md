# TASK-700-H: 创意组构思工作台

> **状态**：⏳ 待授权 · 创建 2026-07-27  
> **模式**：中卡 · 前端为主 · **无 schema 变更**  
> **上游**：[TASK-700](./TASK-700-v2.7.27-pipeline-completion.md) · 拍板「创意组区间」+ 司令官 2026-07-27 工作机制澄清  
> **操作员**：Cursor IDE  
> **基线**：`feature/workdetail-p1` @ `c399843`（含 `d87ee99` TASK-700-G 卡/纪律；与 origin 同步后再开工）  
> **前置**：700-G 已合入（`66d7415`）；700-D 探针残留已清（见本卡附录）

---

## 背景

四个创意来源各有独立 page，成果作为「创意缘起」提交到「作品创意构思」。

| 来源 | 现状 |
|------|------|
| 灵感碎片 | 通；`creativeOrigin` 写 `_sourceNote` |
| 外来参考 | 通；同上 |
| AI 搜索 | 冻结占位（总览仅一块灰卡） |
| AI 讨论 | **整块缺失**（700-E 删了 `ChatPage.tsx`；入口改掉后零引用被当死代码删） |

本卡补总览第四块、让可用来源「看得出能点」、把提案详情改成创意组自有三栏（来源左 / 表单中 / 横向对照右），并按实测修正手记弹窗文案。

---

## 假设（已声明）

1. **布局**：`ProposalDetailPage` 套用现有 `ThreeColumnLayout`。**不**套创作室/编审「左导航右参考」语义；创意组拍板为 **来源在左、参考（横向对照）在右**。中栏 = 现有构思表单整体迁入，业务逻辑不动。  
2. **左栏四来源**：以可展开区块/链接呈现。灵感碎片 → `/creative/scraps`；外来参考 → `/creative/external-refs`；AI 搜索 → 冻结态（可链到现有 `AiSearchPage` 或纯灰卡，二选一写死一种，默认与总览一致：**灰卡不可点**）；AI 讨论 → **仅灰卡**，**禁止**新建 `ChatPage` 或讨论路由。左栏「展开查看」= 打开对应来源页或展开摘要，不做材料多选回填（回填已有缘起链路，本卡不扩）。  
3. **总览可发现性**：`CreativeWorkspace` 左列现有「灵感碎片」「外来参考」标题虽是 `<Link>` 但视觉像正文——须加明显可点样式（如 `text-amber-700`、右侧「进入 →」、整卡 hover / cursor-pointer）。「AI 搜索」「AI 讨论」统一灰、`opacity`、文案用 `AI_FROZEN_LABEL` / 「功能正在开发中」，**不可点**。网格从 3 块来源卡变为 **4 块**（仍一列堆叠即可，不必改成 2×2）。  
4. **右栏横向对照 · 防撞车**：列出**除当前提案外**的其他 Proposal（默认全部 status；按 `updatedAt` 降序；可截断前 30，卡里写死）。每条显示：**标题** + **标签**（`metadata._tags`）+ **梗概首行**（`synopsis` 第一行或截断至 ~40 字）。与**当前构思表单中的 tags 状态**（含未保存）有交集的标签 → **高亮**（如 amber 底）。点击条目可链到该提案详情（可选；默认允许，方便对照）。**不是导航栏替代品。**  
5. **`_tags` 空数组**：现存提案 `_tags` 多为 `[]`，高亮短期内看不见 = **数据现状，不是 bug**。验证时用临时提案写入非空 `_tags` 测高亮；测完按 §四·五 清理。  
6. **手记弹窗文案**（`WorkNoteNoteModal`）按 `entry.kind` 分岔：  
   - `edit`：标题「当时为什么这么改」/ placeholder「写下改动的理由（可留空）」  
   - `initial`：标题「这块设定当初是怎么想的」/ placeholder「写下当时的构思（可留空）」  
   - 未知 kind 走 `edit` 文案。不改正文/API。  
7. **无 schema**。`_tags` 已够用。要加字段先停手异议。  
8. **验收数据**：优先 `TASK700H-probe-*` 临时提案；禁止再污染《美丽的一天》。回报逐项列残留并清理。  
9. Windows lint 撞 DLL 时用 frontend `npm run lint` / backend `npx tsc --noEmit`。

---

## 范围

**可改 / 可新增：**

| 路径 | 动作 |
|------|------|
| `frontend/src/components/creative/CreativeWorkspace.tsx` | 第四块「AI 讨论」冻结；灵感/参考可点样式 |
| `frontend/src/pages/creative/ProposalDetailPage.tsx` | 改三栏布局；中栏迁入现有表单 |
| `frontend/src/components/creative/`（新建 1～2 个小组件） | 如 `CreativeSourcesPanel`、`ProposalPeerCompare`；禁止无关抽象 |
| `frontend/src/components/editorial/WorkNoteNoteModal.tsx` | kind 分岔文案 |
| （可选）`ThreeColumnLayout` 仅当移动端「可引用区」标题需改成可配置 label | 默认 prop 即可；不改其他调用方行为 |

**只读参考：**

- `frontend/src/services/creativeOrigin.ts`  
- `frontend/src/config/aiFreeze.ts`  
- `frontend/src/components/creative/TagInput.tsx`

## 不做什么

- **相似度算法 / AI 查重**（标签比对是笨办法，判断权留给人）  
- 解冻 AI、重建 `ChatPage`、新建 AI 讨论业务页  
- 改灵感碎片 / 外来参考的创建缘起与保存逻辑（只改总览可发现性）  
- 文集库手记入口（§4.9）、导出、schema / migration  
- 改后端 Proposal API（读现有列表即可）

---

## 操作步骤

1. **CreativeWorkspace**  
   - 灵感碎片 / 外来参考：强化 Link 可点视觉。  
   - 保留 AI 搜索灰卡。  
   - 追加同结构「AI 讨论」灰卡（文案可写「创思讨论 · 开发中」+ `AI_FROZEN_LABEL`）。

2. **ProposalDetailPage 三栏**  
   - header 保留返回/状态/保存按钮区（可放 `ThreeColumnLayout.header`）。  
   - 左：四来源面板。  
   - 中：现有基础信息 + 设定雏形 + 历史引用 + 操作按钮，**行为不变**。  
   - 右：横向对照列表（假设 4）。宽度建议 `rightWidth` ≥ `280px`（防撞车要看标签；若挤中栏 → 回报，勿默默缩）。

3. **WorkNoteNoteModal**  
   - 按假设 6 分岔；编审详情点开 `initial` / `edit` 各验一次。

4. **验收探针（临时数据）**  
   - 建 `TASK700H-probe-A`（tags: `都市,甜宠`）、`TASK700H-probe-B`（tags: `都市,悬疑`）。  
   - 打开 B 的详情：右栏应见 A，且「都市」高亮、「甜宠」在 A 上不高亮于 B 的交集外。  
   - **测完硬删两条提案**（及误建 Project 若有），回报计数。

5. **门禁**

```powershell
cd D:\workspace\content\docs\novel-writer\frontend
npm run lint
npm run build
```

（本卡若未改 backend，可不跑 `test:backend`；改了再跑。）

---

## 预期结果

- 总览创意来源可见四块；活入口看得出能点；两块 AI 冻结。  
- 提案详情三栏：左来源、中表单、右对照；共有标签高亮。  
- 手记 `initial` / `edit` 文案不同。  
- schema 无变更；探针已清。

---

## 验证方法（必须可执行）

```powershell
# 1) 无 schema 漂移
git diff -- backend/prisma/schema.prisma
# 预期：空

# 2) 总览
# 打开 /creative/workspace → 四块来源；灵感/参考可点进入；AI 搜索/讨论灰且不可点

# 3) 提案三栏
# 打开任意 /creative/proposals/:id → 左中右齐全；中栏保存/开构思/提交仍可用

# 4) 高亮（临时数据，见步骤 4）
# 共有标签高亮；测完删 TASK700H-probe-*

# 5) 手记文案
# 编审详情点 initial → 「这块设定当初是怎么想的」
# 点 edit → 「当时为什么这么改」

# 6) 门禁见上
```

---

## 回滚方案

无 migration。代码级回滚：

```powershell
cd D:\workspace\content\docs\novel-writer
git revert <本卡 commit>
# 或 checkout 本卡改动的前端文件
```

临时探针用 `prisma` / API 硬删即可。禁止借回滚扩表。

---

## 纪律写入（本卡必须遵守）

### §四·五 验收残留

- 只用 `TASK700H-probe-*`；测完删除；回报列清单。  
- 不改《美丽的一天》等真实资产。

### 删零引用文件前先定性（教训 · 700-E）

> 700-E 删 `ChatPage.tsx` 时，「零引用 = 死代码」字面成立，但未问**为什么零引用**。  
> 答案是：**入口被改掉了**，而它是计划中「AI 讨论」的最后痕迹。  
> **今后删零引用文件前必须判断：功能废弃，还是入口丢失。** 两种处理相反——废弃可删；入口丢失应补入口或显式冻结占位，而不是删最后痕迹。

本卡用总览「AI 讨论」冻结块把该痕迹**显式占回**，不假装功能已交付。

---

## 回报格式

- 做了什么  
- 改了哪些文件  
- 如何验证（含探针创建/高亮/清理计数）  
- 手记两种文案确认  
- 还剩什么（§4.9 等）  
- 风险或异议（若想扩表 / 中栏被挤）

---

## 异议预留

- 右栏要不要含已立项（`approved` + 已有 `projectId`）的提案：默认**含**（撞车风险更高）；若噪声过大再收窄，先回报。  
- 移动端 `ThreeColumnLayout` 底部栏文案「可引用区」对本页语义不准：允许改成可配置 `rightMobileLabel`（默认保持旧文案以免波及其他页）。

---

## 附录 · 开工前收尾（已执行 2026-07-27）

按 TASK-700 §四·五 清理 700-D 验收残留：

| 项 | 结果 |
|----|------|
| Project `e022d5f2-…` `TASK700D-probe-1785122734422` | 已删 1 |
| Proposal `d4cfd0bb-…` 同名 | 已删 1 |
| 关联 WorkNote | **0**（该探针未记手记） |
| 残留匹配 | Project 0 / Proposal 0 |
| 《美丽的一天》 Project / WorkNote | 1 / 8 → **未变** |
| 《新创意》 Proposal | 仍在（`9f0e1be5-…`）→ **未变** |
