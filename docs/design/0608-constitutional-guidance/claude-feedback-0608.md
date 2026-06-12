# Claude 架构整合回报

> 审查基准：0608 宪法级开发指引 v1（草案）
> 对照物：overall-architecture.md v4.1.1、code-conflict-analysis.md v4.1.1、day1-design.md、stage-guard.ts、StageTransitionModal.tsx、WorkDetailPage.tsx、api.ts
> 日期：2026-06-08

---

## 一、是否认可 0608 指引

**整体认可，但有三处需要校准的问题。**

### 认可的核心原则（5 条）

1. **五部门三状态模型** — 这是对 v4.1 状态机最重要的补全。v4.1 每个部门只有"进行中↔已完成"两态（或"本阶段最后一环的三选一"），缺少"待处理"队列。0608 的三状态（待处理/进行中/已完成）补上了"部门间交接面"的语义空白。

2. **跨部门不退回 + 文件暂存作为线外裁决池** — 与 v4.1 设计原则高度一致，且把"软删"的被动机制升级为"暂存争议对象"的主动裁决角色，语义更完整。

3. **确认完成 ≠ 放行下一部门** — 这是本次最关键的修复。v4.1 的三选一节点（created / planning / written / reviewed）把"本部门确认完成"和"放行到下一部门"合并在一个动作里，0608 将它们分离为两阶段动作。

4. **状态标签带部门上下文** — 现有 `PROJECT_STATUS_LABEL` 是全局字典，0608 要求按部门上下文解释同一 status。

5. **企划课 planning 阶段可编辑** — 这是现有代码的已知缺陷，0608 明确列为高优先级修复项。

### 需要校准的 3 处

**① §3.1 "退回本部门上一工作状态"的定义不够精确**

0608 的允许退回范围写的是"退回本部门上一工作状态"。这在创作室（writing↔written 之间可以来回）是自然的。但在创意组（creating↔created）或企划课（planning↔planned）中，"退回上一工作状态"意味着"撤销完成/撤销放行决定"。这与 §3.3 "不允许跨部门退回"不冲突，但建议在状态机模型中明确退回的边界条件（比如只允许在什么条件下可以退回，是否限制退回次数等）。

**② 三状态标签映射表需要更细致的语义定义**

0608 的映射表：
- 创意组: creating → created → created（created 同时是"已完成"和"企划课待处理"）
- 企划课: created → planning → planned
- 创作室: planned → writing → written
- 编审部: written → reviewing → reviewed
- 文集库: reviewed → 入库整理 → archived

这里有一个映射链的继承问题：`created` 在创意组是"已完成"，在企划课是"待处理"— 意味着同一个 status 值在不同部门的工作台有不同的标签。这在前端实现上意味着不能统一用 `status === 'created'` 来路由，而必须结合当前部门上下文（`?from=`）来渲染。

**③ 单用户 vs 多角色决策模型**

0608 引用了"部门负责人视角执行放行"的概念。在单用户系统中（"老板 = 作者本人"），这个"负责人"和"工作者"是同一个人。这意味着确认完成和放行下一部门在实操中可能是同一个操作。建议允许"一步确认完成+放行"的快捷方式，同时保留"仅确认完成、暂不放行"的能力。

---

## 二、与既有设计冲突清单（8 项）

### C0608-01：三选一节点语义混淆
- **来源**：overall-architecture.md §二、day1-design.md §2、StageTransitionModal.tsx、stage-guard.ts
- **冲突**：v4.1 的四个三选一节点将"确认完成"与"放行下一部门"合一。0608 要求分离。
- **建议**：冻结"三选一节点"的混合语义。修订为"确认完成"和"放行"两个独立概念。

### C0608-02：StageTransitionModal 包含跨部门退回
- **来源**：`frontend/src/components/projects/StageTransitionModal.tsx` L26-37（PREV_STATUS 常量）
- **冲突**：`writing → planning`（创作室回企划课）、`planning → draft`（企划课回创意组）、`reviewing → writing`（编审部回创作室）
- **建议**：**立即冻结**。拆为 4 个专用 modal，每个只支持本部门内退回 + 放行 + 暂存。

### C0608-03：全局中文标签不考虑部门上下文
- **来源**：`frontend/src/services/api.ts` L71-80（PROJECT_STATUS_LABEL）、ProjectStatusBadge.tsx
- **冲突**：`planning` 统一为"企划中"、`written` 统一为"已定稿"，不按部门区分
- **建议**：冻结全局标签。改为 `depContextStatusLabel(department, status)` 函数。

### C0608-04：缺少"待处理"工作区
- **来源**：overall-architecture.md §四/§五（创作室三栏、企划课 4 Tab）
- **冲突**：v4.1 没有"从上一部门接收来的新对象"队列
- **建议**：每个部门按"待处理/进行中/已完成"重排工作台。

### C0608-05：`shelved` 字面量仍然存在于后端枚举
- **来源**：`backend/src/constants/statuses.ts` L15、`stage-guard.ts` L10（`pause: ['shelved']`）
- **冲突**：Day 2 已决议取消 shelved，但代码仍为 primary
- **建议**：移入 LEGACY_READ，删除 pause 桶，确认 DB 迁移方案。

### C0608-06：`imported` 字面量仍在前端 primary
- **来源**：backend statuses.ts L7、stage-guard.ts L5（`intake: ['imported']`）
- **冲突**：0608 下 `planning` 是唯一入口
- **建议**：若 VPS DB 已迁移存量 imported → planning，则移入 LEGACY_READ 并删除 intake 桶。

### C0608-07：`reviewing` 的 IN_BUCKET_TRANSITIONS 包含 `completed`
- **来源**：stage-guard.ts L31
- **冲突**：`completed` 是 1.0 LEGACY_READ，不应出现在允许的 transitions 中
- **建议**：移除 `completed`，确保 reviewing → reviewed → archived 是唯一路径。

### C0608-08：Proposal 状态机缺少"待处理"概念
- **来源**：backend statuses.ts L20-25
- **冲突**：创意组的"待处理"对应 FileReference/灵感 → 创意讨论，但 Proposal 模型 (creating/created/approved) 不体现这个队列
- **建议**：暂不修改，留待创意组三状态工作台设计时评估。

---

## 三、后端模型评估

### 已对齐
- 5→5 部门桶分组（去除 intake+pause 后）
- `deletedAt` 软删机制（soft-delete/restore/永久删除）
- 跨阶段不退回的 stage-guard 整体原则（`assertSameStage`）
- 6 个业务时间戳完整支持 4 次放行动作记录

### 有风险
- "确认完成"与"放行"合一：13 端点将两个动作合并为一个调用
- `IN_BUCKET_TRANSITIONS` 语义冲突（含 completed 遗留、planning→planning 空转）
- `shelved` 残留（deletedAt + status.shelved 双轨）
- `imported` 仍存在（可能影响企划课入口规范）

### 需补充
1. 新增"部门内确认完成"端点（仅 status 变更 + 时间戳，不触发跨部门操作）
2. 跨部门放行端点语义明确化（accept-into-planning / confirm-greenlight / submit-review / archive）
3. 文件暂存语义升级为线外裁决池（新增 reason 字段，说明争议原因）
4. 后端"部门上下文"元数据查询参数（GET /department/:dept/workspace?view=pending|active|completed）
5. 存量数据迁移（shelved→deletedAt、imported→planning、completed→reviewed）

---

## 四、前端模型评估

### 当前最大偏差（4 项）
1. **StageTransitionModal 含跨部门退回** — PREV_STATUS 定义了 3 条跨部门路径
2. **全局中文标签无部门上下文** — 单层字典不问部门
3. **确认完成/放行合一** — StageTransitionModal 的"advance"一键且仅支持放行，缺少纯确认完成
4. **WorkDetailPage 可能不支持 planning 编辑** — 需验证 planning 状态下设定/元数据/章节的可编辑性

### 建议的信息架构

```
L1 导航: 创意组 ∣ 企划课 ∣ 创作室 ∣ 编审部 ∣ 文集库 ∣ 📂 文件暂存
每部门 L1: 统一三区（待处理 / 进行中 / 已完成），标签随部门变化
L2 子导航（仅创意组/企划课有）
L3 详情页（按部门上下文不同模式）
L4 编辑器（仅创作室）
```

### 作品详情页跨部门模式

| 部门上下文 | 可编辑？ | 重点操作 |
|---|---|---|
| 创意组 | 提案创建 → 是 | 确认完成提案 |
| 企划课（评估）| 提案只读 | 通过/暂存裁决 |
| 企划课（设定中）| **设定/元数据/章节 → 可编辑** | 完善设定 → 确认完成 |
| 创作室 | 章节可编辑 | 开始写作/继续写/完成 |
| 编审部 | 否（全文只读） | AI 审查报告 |
| 文集库 | 否（只读展示） | 文集归属/浏览/导出 |

每个详情页顶部操作栏：**确认完成** | **放行下一部门**（已完成后亮起）| **移入文件暂存**

---

## 五、对 VPS Commit 1 的语义审查

> **结论：应暂停**

### 原因（5 条）
1. **StageTransitionModal 的跨部门退回路径**固化错误流程语义。即使后端可能拦截，前端 UI 让用户形成的"可退回上阶段"心理模型是错误的。
2. **NEXT_STATUS 把确认完成和放行合一** — `planning→writing` 的"advance"同时完成企划课确认和放行创作室。
3. **`PROJECT_STATUS_LABEL`（全局标签字典）过时**。
4. **`shelved` 字面量仍为 primary**（与 Day 2 决议和 0608 §4 都冲突）。
5. **`intake`/`pause` 桶需要清理**。

### 最低限度调整方案（若必须提交而非暂停）
1. 移除 PREV_STATUS 中 `writing→planning` / `planning→draft` / `reviewing→writing`
2. 将"advance"改为"确认完成"和"放行下一部门"两个独立动作
3. 全局标签字典加"临时"前缀注释

但推荐暂停重组织，因为上述改动不是小范围补丁。

---

## 六、建议下一步

1. **司令部会诊** Claude 与 Cursor 回报异同
2. **形成正式版 v1.0 指南**
3. **评估变更范围**：核心变更（StageTransitionModal 拆解/标签上下文化/WorkDetailPage 重构）+ 次要变更（字面量清理/桶清理）+ 新增（待处理工作台/确认完成端点）
4. **重写底层状态流转文档**：`overall-architecture.md` §0~§二
5. **新建 `dept-workspace-model.md`**：0608 模型独立落地说明

### 优先级

| P0 | P1 | P2 |
|---|---|---|
| 拆解 StageTransitionModal（消除跨部门退回）| 确认完成/放行分离端点 | WorkDetailPage 全文模式重构 |
| 移除 `shelved` primary 字面量 | 状态标签按部门上下文化 | 前台待处理工作台 UI |
| 清理 stage-guard `intake` + `pause` 桶 | `imported` 迁移 + LEGACY_READ | planning 编辑能力验证 |
| 文件暂存语义升级为线外裁决池 | 新增"部门内确认完成"端点 | 存量数据迁移脚本 |

### 对 0608 正式版的补充建议

1. **增加 6 步实现路径**（参考 v4.1 的 10 步落地顺序）
2. **说明创意组三状态的特殊性**（"待处理" = FileReference/灵感手记 → Proposal，"已完成" = Proposal created —— 与其他部门的 Project 三状态不同）
3. **允许"确认完成+放行"的快捷操作**（前端一个按钮 → 后端两个独立事件，不增加单用户操作负担）
4. **明确详情页"部门模式"切换的 ?from= 参数约定**
