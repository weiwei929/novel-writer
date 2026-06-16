# TASK-CREATIVE-V2-A：创意缘起基础链路

**立宪依据**：
- [docs/design/creative-v2-constitution-draft.md](docs/design/creative-v2-constitution-draft.md)
- [docs/design/creative-v2-consultation-agenda.md](docs/design/creative-v2-consultation-agenda.md) v1.2
- [docs/design/0608-616-coordination-draft.md](docs/design/0608-616-coordination-draft.md) §3、§4、§6
- [docs/design/616-content-asset-constitution-v0.2.1.md](docs/design/616-content-asset-constitution-v0.2.1.md)（文内 v0.2.2）

**状态**：已审卡 · 已执行（`feature/creative-v2-a-origin-flow`）  
**类型**：creative-v2 第一轮小战役  
**建议分支**：`feature/creative-v2-a-origin-flow`（自 `feature/workdetail-p1` 切出）

## 背景

creative-v2 已完成三组会诊裁决，但当前代码仍带有明显 1.0 心智：

- 创意组主入口与「创意构思」枢纽尚未扶正
- 三个来源池与作品仍存在旧式强绑定阴影
- 外来参考 legacy 的 `references[]` / 自动拆章旧链路仍可能被误接回
- `save` / `submit` 的动作语义若不收紧，创意组很容易再次把内容编辑与流程推进缠在一起

因此本卡只做 **creative-v2 主路径的第一刀**：把「来源池 → 创意缘起 → 创意构思 → 创意作品 → 待企划作品」中的**前半段基础链路**扶正。

## 目标

在不新建实体、不改 schema、不碰企划课流程的前提下，落地以下最小闭环：

1. 创意组主入口统一为 **「新作品创意构思」**
2. `Proposal` 作为技术载体，引入 `metadata._creativeStage`
3. 灵感碎片可 **「由此创建创意缘起」**
4. 外来参考可 **「由此提炼创意缘起」**
5. 新建的缘起记录只进入 creative-v2 主路径，不写 `references[]`、不触发自动拆章

## 范围

### P0：主入口与阶段载体

- 创意组主入口文案对齐为 **「新作品创意构思」** 或等价明确 CTA
- `ProposalDetailPage` 作为创意构思 / 创意作品的主编辑页继续承载
- 新建创意构思时，创建 `Proposal.metadata._creativeStage = conceiving`
- 从来源池创建时，创建 `Proposal.metadata._creativeStage = origin`

### P1：来源池统一出口

- 灵感碎片：
  - 新增或改造主动作：**由此创建创意缘起**
  - 创建轻量 `Proposal`
  - 可选写入 `_sourceType = scrap`、`_sourceNote`
- 外来参考：
  - 新增或改造主动作：**由此提炼创意缘起**
  - 创建轻量 `Proposal`
  - 可选写入 `_sourceType = external_ref`、弱 `_sourceRef`
  - `complete / partial` 仅保留为材料整理标记，不影响作品成立

### P2：创意组提交门槛与动作语义对齐

- 创意组提交企划课仍只检查：**标题 + 梗概**
- `save` 与 `submit` 保持分离：
  - `save` 只保存内容，不推进流程
  - `submit` 才进入待企划作品
- 产品标签延续现有口径：**创意作品** → **待企划作品**

## 明确不做

- 不新建 `Origin` / `Inspiration` / 任何新实体表
- 不改 Prisma schema
- 不改 `Project`、企划课、创作室、编审部流程
- 不处理 `616-B` 作品设定三必一选落地
- 不处理 `616-C` 章节模型
- 不新增 `references[]` 强绑定
- 不恢复「引用到作品 / 建议书」旧心智
- 不启用或扩展 `complete -> 自动拆章`
- 不裁决 AI 搜索完整上线，只允许留接口或占位
- 不顺手重写 `CreativeDiscussion` 全量语义

## 输入材料

- [docs/design/creative-v2-constitution-draft.md](docs/design/creative-v2-constitution-draft.md) §2、§3、§6
- [docs/design/creative-v2-consultation-agenda.md](docs/design/creative-v2-consultation-agenda.md) 裁决 1-6 + 第三组 legacy 边界
- [docs/design/0608-616-coordination-draft.md](docs/design/0608-616-coordination-draft.md) §3、§4、§6、§9

## 具体文件候选

### 前端优先排查

- `frontend/src/pages/creative/ProposalDetailPage.tsx`
- `frontend/src/components/creative/CreativeWorkspace.tsx`
- `frontend/src/components/creative/ReferencePicker.tsx`
- `frontend/src/components/creative/ExternalRefs.tsx`
- `frontend/src/pages/ScrapsPage.tsx`
- `frontend/src/pages/creative/ReferencesPage.tsx`
- `frontend/src/pages/creative/ProposalsPage.tsx`
- `frontend/src/pages/creative/ChatPage.tsx`

### 后端候选

- `backend/src/routes/proposals.ts`
- `backend/src/routes/fileReferences.ts`

### 允许只读参考，默认不改

- `frontend/src/components/creative/CreativeDiscussion.tsx`
- `frontend/src/components/creative/PlanningProposal.tsx`
- `frontend/src/components/proposals/ProposalListView.tsx`
- `backend/src/routes/projects.ts`

## 执行步骤

1. 只读核对当前创意组入口、来源池动作、`Proposal` 创建路径、提交企划课路径。
2. 设计最小 `metadata._creativeStage` 写入点：
   - 直接新建创意构思：`conceiving`
   - 来源池生成缘起：`origin`
3. 落地灵感碎片出口：
   - 入口动作改为「由此创建创意缘起」
   - 创建 `Proposal`，不写 `references[]`
4. 落地外来参考出口：
   - 入口动作改为「由此提炼创意缘起」
   - 创建 `Proposal`，可写弱 `_sourceRef`
   - 不触发章节生成，不影响 `complete / partial`
5. 核对 `save` / `submit`：
   - 保存内容不改 `status`
   - 提交企划课时仅检查标题 + 梗概
6. 本地 build 与最小 smoke 验证。

## 验收标准

```text
[ ] 创意组主入口用户可见文案对齐为「新作品创意构思」或等价明确 CTA

[ ] 直接新建创意构思时，新 Proposal 含 `metadata._creativeStage = conceiving`

[ ] 从灵感碎片触发时：
    生成 Proposal，`_creativeStage = origin`
    不写 `references[]`
    不推进待企划作品

[ ] 从外来参考触发时：
    生成 Proposal，`_creativeStage = origin`
    可带弱 `_sourceRef`
    不写 `references[]`
    不触发自动拆章

[ ] `save` 不推进 Proposal / Project 状态

[ ] 「提交企划课」仍仅检查标题 + 梗概

[ ] 产品标签链路可辨：
    创意构思 / 创意作品 / 待企划作品

[ ] frontend `npm run build` 通过

[ ] backend `npm run build` 通过（若后端有改动）

[ ] 手工 smoke 至少两条：
    1. 直接新建创意构思
    2. 从来源池生成创意缘起
```

## GitHub 审查点

- `metadata._creativeStage` 是否只作为 creative-v2 阶段标记，而非新 status
- 是否有任何新写入 `references[]`
- 是否有任何新逻辑重新接回 `complete -> 自动拆章`
- `save` 与 `submit` 是否混淆
- 是否误把本卡扩展到 616-B / 616-C / 企划课

## VPS 禁止项

- 不在 VPS 上重新定义 creative-v2 产品语义
- 不在 VPS 上临场决定 `_creativeStage` 以外的新字段体系
- 不在 VPS 上补做 schema / migration / 自动拆章修复

## 风险边界

| 风险 | 边界 |
|---|---|
| 旧 `Proposal.status` 与 `_creativeStage` 映射不清 | 本卡只落最小写入与 UI 主路径，不在本轮穷尽 legacy 状态映射 |
| 来源池旧动作容易顺手复用 `references[]` | 审查时把 `references[]` 视为一票否决项 |
| 外来参考历史链路牵出自动拆章 | 一律视为超范围，留给 616-C / 企划课章节专项 |
| 创意讨论区旧文案残留 | 若不影响主路径，本卡不做全量清扫 |

## 回报格式

请按以下固定格式回报：

### 做了什么

### 改了哪些文件

### 如何验证

### 还剩什么

### 风险或阻塞

