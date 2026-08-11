# 0608-dept-workspace-model.md — 五部门三状态核心模型

> **状态**：现役 · 立宪级 · 2026-07-29 自 `docs/journal/0608-constitutional-guidance/` 取回 · 原文未改

> **文档角色**：0608 模型的核心纲领文件。定义"五部门三状态"的基本模型、部门间流转规则、状态机映射、数据流模型。
> **优先级**：P0 — 其他四份文档的根基。
> **关系**：本文是所有其他设计文档的宪法性引用。

---

## §0 文档元信息

- 版本号、日期、维护人
- 本文的宪法级别：以本文为准还是以 overall-architecture.md 为准
- 术语表（部门、工作区、放行、确认完成、线外裁决、文件暂存）

## §1 五部门三状态模型声明

一句话产品的精确重述：

> 多作品并行的五部门创作工作室系统。

五部门列表 + 一句话职能：

| 部门 | 职能 |
|------|------|
| 创意组 | 灵感碎片、素材导入、创意形成、提案产出 |
| 企划课 | 作品设定、元数据、章节架构、立项决策 |
| 创作室 | 章节正文写作、参考素材查阅 |
| 编审部 | 全文 AI 审查、问题记录、修订建议 |
| 文集库 | 完整作品归档、文集管理、阅读形态 |

三工作区通用定义：

| 工作区 | 英文标签 | 含义 | 对 Project 的条件 |
|--------|---------|------|-----------------|
| 待处理 | pending | 上一部门已放行、本部门尚未开始处理的对象 | status = 上一部门的完成态 |
| 进行中 | active | 本部门正在加工中的对象 | status = 本部门的进行时 |
| 已完成 | completed | 本部门已确认完成、等待放行决定的对象 | status = 本部门的完成时 |

## §2 五部门状态机定义

每个部门的完整状态映射表。

### 创意组

| 工作区 | primary status | 含义 | 数据模型 |
|--------|---------------|------|---------|
| 素材层 | — | 外来参考/灵感碎片/AI 搜索结果，只读引用 | FileReference / Scrap(source=creative) / AI Search |
| 进行中 | — | 作品构思中，作者围绕素材进行结构化构思 | CreativeFlow |
| 已完成 | `created` | 提案停留，等待提交企划课/暂存/退回构思 | Proposal.status = 'created' |

**部门内流转**：
- 素材层 → 进行中：素材被引用到 CreativeFlow，不改变素材自身状态
- 进行中 → 已完成：CreativeFlow 提炼为 Proposal(`created`)
- 已完成 → 进行中（退回）：Proposal(`created`) 退回到作品构思中（部门内退回）

**创意组无跨部门"待处理"队列的原因**：创意组的输入是灵感/素材/讨论，不来自上一部门。

### 企划课

| 工作区 | primary status | 含义 | 数据模型 |
|--------|---------------|------|---------|
| 待处理 | `created`（from Proposal） | 创意组已提交的提案，等待评估接收 | Proposal.status = 'created' |
| — | 接收动作 | 接收评估 → 创建 Project | `accept-into-planning` 端点 |
| 进行中 | `planning` | Project 企划中 | Project.status = 'planning' |
| 已完成 | `planned` | 企划完成，等待放行 | Project.status = 'planned' |

**部门内流转**：
- 待处理 → 进行中：接收 Proposal，创建 Project(`planning`)
- 进行中 → 已完成：`planning → planned`（确认企划完成）
- 已完成 → 进行中（退回）：`planned → planning`

**移交处理**：Proposal 接收后不销毁（保留 `proposalId` 关联，Proposal 可标记为 `approved`）。

### 创作室

| 工作区 | primary status | 含义 | 数据模型 |
|--------|---------------|------|---------|
| 待处理 | `planned` | 企划课已放行的作品，等待首次开工 | Project.status = 'planned' |
| 进行中 | `writing` | 章节创作中 | Project.status = 'writing' |
| 已完成 | `written` | 全本章节写完，等待放行编审部 | Project.status = 'written' |

**部门内流转**：
- 待处理 → 进行中：`planned → writing`（开始写作）
- 进行中 → 已完成：`writing → written`（确认作品完成）
- 已完成 → 进行中（退回）：`written → writing`

**注意**：`planned` 在创作室是"待处理"，在企划课是"已完成"。这是同一 status 值在不同部门有不同解释。

### 编审部

| 工作区 | primary status | 含义 | 数据模型 |
|--------|---------------|------|---------|
| 待处理 | `written` | 创作室已放行的作品，等待审阅 | Project.status = 'written' |
| 进行中 | `reviewing` | 审阅进行中 | Project.status = 'reviewing' |
| 已完成 | `reviewed` | 审阅完成，等待放行文集库 | Project.status = 'reviewed' |

**部门内流转**：
- 待处理 → 进行中：`written → reviewing`（开始审阅）
- 进行中 → 已完成：`reviewing → reviewed`（确认审阅完成）
- 已完成 → 进行中（退回）：`reviewed → reviewing`

### 文集库

| 工作区 | primary status | 含义 | 数据模型 |
|--------|---------------|------|---------|
| 待处理 | `reviewed` | 编审部已放行的作品，等待入库整理 | Project.status = 'reviewed' |
| 进行中 | — | 入库整理（文集归属/标签/排序） | 可定义子状态或元数据 |
| 已完成 | `archived` | 已归档终态 | Project.status = 'archived' |

**终态特殊规则**：
- `archived` 是状态机终态，不回流（不跨部门退回）
- 文件暂存仍可用（放入文集库不影响终态语义，`deletedAt` 标记）

## §3 4 次部门交接协议

每次交接 = "上一部门的放行动作" = "下一部门的待处理入口"。

| 交接序号 | 交接动作 | 发送方 | 接收方 | 发送态→接收态 |
|---------|---------|--------|--------|-------------|
| #1 | 提交企划 | 创意组 `created` | 企划课 待处理 | Proposal.created → 企划课待处理 |
| #2 | 正式放行 | 企划课 `planned` | 创作室 待处理 | Project.planned → 创作室待处理 |
| #3 | 提交审阅 | 创作室 `written` | 编审部 待处理 | Project.written → 编审部待处理 |
| #4 | 文集入库 | 编审部 `reviewed` | 文集库 待处理 | Project.reviewed → 文库待处理 |

每次交接的动作语义：

| 维度 | 值 |
|------|-----|
| 动作名 | 放行（submit / release / forward）|
| 触发者 | 发送方"已完成"列表中的操作按钮 |
| 前置条件 | 发送方已完成（本部门工作完成确认已执行）|
| 执行效果 | 下一部门的待处理列表中看到该对象 |
| 回滚方式 | 不放行到下一部门，而是移入文件暂存 |
| 时间戳 | 记录放行时间（如 `submittedToPlanningAt`）|

不得包含：
- 下一部门的进行时状态变更（放行≠启动处理）
- 跨部门退回选项
- reject 语义

## §4 三状态模型的例外边界

以下情况不强制三状态：

1. **创意组"待处理"**：输入源（FileReference / ScrapNote / CreativeDiscussion）不来自上一部门，不强制赋予"待处理"三状态队列形态。但仍然可以在创意组工作区中以"待处理"类视图呈现（如"未转化为提案的灵感/素材"）。

2. **文集库"进行中"**：文集库的"入库整理"（文集归属、标签、排序）可能不独立对应一个 Project.status 字面量，可以用子状态或元数据字段表示。

3. **编辑部的"待处理"触发时机**：`written → reviewing` 需要创作室先确认完成并放行，编审部才能看到待处理列表。如果创作室尚未放行，编审部无待处理。这不是 bug，是产品模型。

## §5 未定义/移出 scope 的边界

明确不在此文档中定义：

- 文件暂存池的具体操作规则（→ `file-staging-pool.md`）
- 状态标签的部门上下文解释（→ `status-context-labeling.md`）
- 流程决策与内容决策的交互治理规则（→ `0608-amendment-decision-separation.md`）
- 前端部门工作台的具体实现（→ `frontend-planning-workspace.md` / 各阶段实现文档）
- 冻结项的详细清单（→ `legacy-freeze-list.md`）
- AI 集成策略（→ 独立 AI 设计文档）
- 编审部的 Review 工作流细节（→ 独立编审部设计文档）

---

## §A 附录：与 v4.1 差异对照

以表格对比 v4.1 旧口径与 0608 新口径：

| 维度 | v4.1 | 0608 |
|------|------|------|
| 部门工作区 | 创作室三栏（planned/writing/written），其他部门无明确分区 | 每个部门都有三区（待处理/进行中/已完成）|
| 三选一节点 | 1 个 UI modal 含推进/退回/删除三选一 | 三选一拆为：确认完成 / 放行 / 文件暂存 |
| 跨部门退回 | UI 层允许（PREV_STATUS 定义跨部门路径）| 禁止任何跨部门退回，改用文件暂存 |
| status 标签 | 全局字典单标签 | 部门上下文双参数决定标签 |
| 作品详情页 | 统一详情页按 status 聚合操作 | 按部门上下文模式切换详情页内容和操作栏 |
| 文件暂存 | shelved 字面量 + deletedAt 软删双轨 | 仅 deletedAt 机制，shelved 冻结 |
| planned → writing | 一键推进+进入编辑器 | 拆为"放行创作室"和"开始写作"两动作 |

## §B 附录：不变量清单

1. 主状态链始终是 `creating → created → planning → planned → writing → written → reviewing → reviewed → archived`
2. 任何时刻，一个 Project 只有一个 primary status
3. 三工作区映射：待处理（上一部门完成态）→ 进行中（进行时）→ 已完成（完成时）
4. `deletedAt` 不改变 primary status
5. 无跨部门退回端点、按钮、用户路径
6. 放行不改变本部门 status（发送方保持"已完成"状态）
