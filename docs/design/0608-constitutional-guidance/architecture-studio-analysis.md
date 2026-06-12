# 创作室三工作区设计建议

> **性质**：架构参谋分析，非执行指令
> **基线**：f768af6 feat(frontend): 0608 foundation and planning workspace entry
> **目标**：回答创作室三工作区是否应复制企划课模型，以及具体如何设计
> **日期**：2026-06-08

---

## 一、f768af6 后 0608 文档体系复核

### 1.1 文档与实现的对齐情况

commit f768af6 实现了 0608 文档提案的核心基础设施。复核 5 份文档的准确度：

| 文档 | 实现状态 | 是否需要小修 |
|------|---------|-------------|
| `0608-dept-workspace-model.md` | 概念完整对齐。f768af6 中 `statusLabels.ts` 的 `getProjectStatusLabel(status, phase)` 实现了 §2 的部门上下文标签。`filters.ts` 的 `isProjectPlanning` 等实现了基础查询过滤器。§3 的 4 次交接协议中的 #1（创意组→企划课）已在 `accept-into-planning` 端点中实现。 | 无需修改。 |
| `0608-status-context-labeling.md` | 高度对齐。`statusLabels.ts` 实现了 `getProjectStatusLabel(status, phase)`——与文档 §2 的核心签名一致。PhaseContext 类型定义略有不同（文档用 `DepartmentId` + `WorkArea` 双参数，实现用单参数 `phase`），但功能等价。 | 轻微差异：文档建议 `depContextStatusLabel(department, workArea, status)` 三参数，实现用了 `getProjectStatusLabel(status, phase)` 两参数。建议决定是否统一（当前实现够用）。 |
| `0608-file-staging-pool.md` | 概念对齐。`ProjectStatusBadge.tsx` 接受 `phase` 参数。`WorkDetailPage.tsx` 在 planning 上下文中隐藏了 `StageTransitionModal`（避免 shelve/跨部门退回路径）。`soft-delete` 端点存在可用。 | 无需修改。 |
| `0608-frontend-planning-workspace.md` | **核心对齐**。commit 实现了：`PlanningInProgressPage.tsx`（Tab③ 进行中）、`WorkDetailPage.tsx` planning 编辑模式（`canEditSetting = status === 'planning'` 使设定可编辑）、`badgePhase` 根据 `?from=` 参数决定、"确认企划完成"按钮、back 按钮上下文感知。 | 无需修改—文档作为蓝图与实现一致。 |
| `0608-legacy-freeze-list.md` | 部分对齐。`StageTransitionModal` 在 planning 上下文中被禁用，跨部门退回和 shelve 路径在前端 planning 页面中被阻断。但后端 `shelved` 和 `imported` 字面量仍为 PRIMARY（按会诊结论暂缓迁移）。 | F-005~F-009 等设计口径冻结项可暂不更新后端。F-012（`reviewing→completed`）仍需标记。 |

### 1.2 文档的缺失或需要补充的内容

1. `0608-dept-workspace-model.md` §2 的"创作室"三状态映射表目前只有占位内容。现在需要根据 f768af6 后的实际端点详细填写。
2. `0608-file-staging-pool.md` §3.3 的"Proposal 文件暂存端点"标注当前未实现——这与 f768af6 的决定一致（不显示暂存按钮），无需修改。
3. `0608-frontend-planning-workspace.md` 中 `release-to-studio` 标注为"下一阶段"——这个假设仍在，创作室设计需要澄清这个交接点的确切语义。

### 1.3 文档体系的总评价

5 份文档作为蓝图是准确的。f768af6 完整实现了"企划课三工作区"的前端闭环：Tab②（`ProposalEvalPage.tsx`）→ Tab③（`PlanningInProgressPage.tsx`）→ Tab④（`PlanningProjectsPage.tsx`）→ `WorkDetailPage.tsx`（planning 编辑模式 + 确认企划完成）。文档不需要结构性修改。

---

## 二、旧文档冻结/替代位置清单（不改动原文）

以下列出 `docs/design/` 中与 0608 模型冲突的旧口径位置。**不修改原文**，仅标记冻结点和替代来源。

### 2.1 overall-architecture.md

| § | 冻结内容 | 替代来源 | 说明 |
|---|---------|---------|------|
| §0 设计前提表 | 状态范围列中创作室只有 `planned/writing/written` 三态，缺少"待处理"语义 | `0608-dept-workspace-model.md` §2（创作室行） | 三状态的"待处理"需要与"进行中/已完成"同级解释 |
| §0 "三选一节点"表 | 节点 #2（企划课 `planning` → `planned` contain "正式立项"文案） | `0608-frontend-planning-workspace.md` §3.5 | 文案改为"确认企划完成" |
| §0 "三选一节点"表 | 节点 #3（创作室 `written` → 三选一包含"提交审阅"/"退回"/"删除"） | 待创作室设计完成后更新 | 节点 #3 需要拆分为"确认创作完成"和"放行编审部" |
| §0 IN_BUCKET_TRANSITIONS | `reviewing` 列表含 `completed`（1.0 LEGACY） | 6. `0608-legacy-freeze-list.md` F-012 | 清理 endpoints，但暂不执行 |
| §0 `shelved` / `imported` 状态 | `shelved` 仍出现在字面量中 | `0608-legacy-freeze-list.md` F-003 | 暂不删除，标记 LEGACY_READ |
| §0 `pause` / `intake` 桶 | stage-guard 中的桶分组 | `0608-file-staging-pool.md` §3.3 | 暂保留，待指令清理 |
| §二 "三选一节点"语义 | 把确认完成和放行合一的"三选一"概念 | `0608-dept-workspace-model.md` §3 | 等 0608 v1.0 定稿后替换 |
| §四 企划课 4 Tab | Tab③ "✨ 正式立项"文案 | `0608-frontend-planning-workspace.md` §3.5 | 改为"确认企划完成" |
| §五 创作室 L1 三栏 | 明确标出三栏操作含"计划 写作"入口以及"提交审阅"入口 | 待创作室设计完成后统一修订 | 需要按 0608 三状态模型重写 |

### 2.2 day1-design.md

| § | 冻结内容 | 替代来源 |
|---|---------|---------|
| §1 5 部门权力模型 | `planned` → 是"三选一节点" | `0608-dept-workspace-model.md` §2 |
| §2 4 个三选一节点 | 节点 #3（written 是推进到 reviewing+退回+删除） | 待创作室设计完成后确定 |
| §5.6 Tab④ "已立项" | `planned` 的企划课标签 | `0608-frontend-planning-workspace.md` §4 |
| §6 创作室设计 | 整个 §6 需要按 0608 三状态重写 | 本文 §三~§六 |

### 2.3 code-conflict-analysis.md

| C# | 冻结内容 | 替代来源 |
|----|---------|---------|
| C-14 | StageTransitionModal 跨阶段回退路径 | `0608-legacy-freeze-list.md` F-001/F-010 |
| C-19/C-20/C-21 | UI 层多处未对齐 v4.1 | 0608 系列文档覆盖 |
| C-22 | `/shelf` 路由 | `0608-file-staging-pool.md` |

### 2.4 stage-guard.ts（代码，非文档）

| 位置 | 冻结内容 | 替代来源 |
|------|---------|---------|
| L5 `intake: ['imported']` | imported 桶 | `0608-dept-workspace-model.md` |
| L10 `pause: ['shelved']` | shelved 桶 | `0608-file-staging-pool.md` |
| L31 `reviewing: ['completed']` | completed 遗留 | `0608-legacy-freeze-list.md` F-012 |

### 2.5 设计文档引用关系更新

```
整体替换关系：

overall-architecture.md §0~§二    → 0608-dept-workspace-model.md
全局 PROJECT_STATUS_LABEL          → 0608-status-context-labeling.md
file-staging-v2.md                 → 0608-file-staging-pool.md
overall-architecture.md §四         → 0608-frontend-planning-workspace.md (企划课部分)
overall-architecture.md §五         → 本文 (创作室部分)
```

---

## 三、创作室三工作区模型分析

### 3.1 是否应复制企划课模型？

**结论：结构应复制，语义需调整。**

企划课的三工作区结构（待处理 → 进行中 → 已完成）是"五部门三状态"的通用模式，应复制到创作室。

创作室的三工作区映射：

```
待处理（pending）= 企划课已放行但尚未开始创作的作品
                    data: Project.status = 'planned'
                    label: "待创作作品"（已在 statusLabels.ts 中实现）

进行中（active）= 至少有一章正在创作的作品
                  data: Project.status = 'writing'
                  label: "创作中作品"（已在 statusLabels.ts 中实现）

已完成（completed）= 全部章节已写完的作品
                     data: Project.status = 'written'
                     label: "已创作作品"（已在 statusLabels.ts 中实现）
```

**需要调整的语义**（与企划课的区别）：

| 维度 | 企划课 | 创作室 |
|------|--------|--------|
| 待处理来源 | 创意组的 Proposal（外部实体） | 企划课的放行（同一 Project） |
| 进行中工作 | 编辑设定/元数据/章节规划 | 写章节正文 |
| 完成确认条件 | 3 必填（标题+梗概/元数据/章节架构） | 全部章节 status = 'completed' |
| 放行去向 | 创作室待处理 | 编审部待处理 |
| 部门内退回 | `planned → planning` | `written → writing` |

### 3.2 `planned` 作为创作室待处理入口是否成立？

**结论：成立。这是 0608 模型的核心映射。** 论证如下：

**R1（数据层的理由）**：`planned` 是企划课已完成的状态——企划课确认企划完成后，Project.status 从 `planning` 变为 `planned`。此时 `planned` 在创作室上下文中应解释为"待创作"，这是 `statusLabels.ts` 已实现的映射（`getProjectStatusLabel('planned', 'studio')` 返回 "待创作作品"）。同一个字面量在企划课完成态和创作室待处理态之间起对接作用。

**R2（部门隔离的理由）**：`planned` 在创作室的"待处理"列表中可见，不等于创作室可以直接编辑它。进入进行中（`planned → writing`）需要创作室主动"开始创作"。这保证了"接收"和"开工"是两个动作，与 0608 的"确认完成≠放行"原则同构。

**R3（多作品并发理由）**：作者同时管理多部作品时，创作室的待处理列表是所有已放行但尚未开工的作品。这个队列让作者可以集中决定"今天先写哪一部"，而不是在企划课和创作室之间反复切换。

**R4（与现有代码一致）**：`filters.ts` 的 `isProjectPlanning(p)` 判断 `status === 'planning' || status === 'planned'`，将 `planned` 归为企划课阶段。但 `ProjectStatusBadge` 在 `phase='studio'` 时将 `planned` 显示为"待创作作品"。这证明代码已经支持"双解释"。

**注意点**：`planned` 在创作室待处理中的可见性依赖于"放行至创作室"动作（`release-to-studio`）。这个动作目前不存在——f768af6 中企划课 Tab④ 的待放行列表没有放行按钮。因此在 `release-to-studio` 实现之前，**创作室的待处理列表将一直是空的**。这是正常的——企划课闭环和创作室闭环之间的交接点是刻意分割的。

### 3.3 `planned → writing` 的命名

**结论：叫"开始创作"（Start Creating）。不叫"接收创作"。** 论证：

"接收创作"隐含接收动作——但接收（放行至创作室）是企划课的动作，不是创作室的动作。创作室的工作台只看到已被放行来的作品，不感知接收过程。

"开始创作"的语义准确描述了用户的选择：从待处理列表中选择一部作品，决定今天开始写它。

动作效果：
- 前端按钮文案："▶ 开始创作"
- 后端端点：`POST /projects/:id/start-writing`（**现有可用**，projects.ts #6）
- 状态变化：`planned → writing`
- 时间戳：`writingStartedAt = now`

**为什么不是"接收创作"？**

| 名称 | 问题 |
|------|------|
| "接收创作" | 暗示"我收到了这部作品"，但接收在放行时已完成。创作室不需要"接收"，只需要"开始" |
| "开始写作" | 范围可能被误解为"打开编辑器写第一章"。更广泛地说，创作室的工作包括章节结构规划、参考查阅等，"开始创作"更准确 |
| "开始创作" | 准确表达"进入进行中状态"。具体写哪个章节在作品详情页/编辑器中选择 |

### 3.4 StageTransitionModal 是否应在创作室复用？

**结论：否。沿用企划课模式，在创作室上下文中禁用全局 StageTransitionModal，使用部门专用操作按钮。**

当前 f768af6 中 `WorkDetailPage.tsx` 在 `isPlanningContext` 时返回 `stageManageButton = null`。创作室应采用同样的模式：

- 创作室上下文中，`WorkDetailPage.tsx` 的 `isStudioContext` 为 `true` 时隐藏 StageTransitionModal
- 操作按钮由部门上下文驱动（`getStudioActions(status)` 函数返回当前可用的操作按钮）
- 三条部门内操作路径：开始创作（`planned→writing`）、确认创作完成（`writing→written`）、撤销完成（`written→writing`）

---

## 四、创作室三工作区列表设计

### 4.1 创作室 L1 页面架构

创作室没有 L2 子 Tab（与企划课不同），展平为 L1 三栏。

```
L1: 创作室
  ├ 待创作（planned）
  │   来源：企划课放行至创作室的作品
  │   每项信息：作品名 / 章节数 / 字数 / 企划完成时间
  │   操作：[▶ 开始创作] [📂 放入文件暂存]
  │   排序：按放行时间倒序
  │
  ├ 创作中（writing）
  │   来源：已开始创作的作品
  │   每项信息：作品名 / 完成进度 (3/12 章) / 总字数 / 最近编辑时间
  │   操作：[继续创作] [✨ 确认创作完成] [📂 放入文件暂存]
  │   排序：按最近编辑时间倒序
  │
  └ 已完成（written）
       ├ 已完成/待放行子区（等待放行编审部）
       │   每项信息：作品名 / 总章数 / 总字数 / 完成时间
       │   操作：[查看] [↩️ 撤销完成] [放行至编审部 ->] [📂 放入文件暂存]
       │   （放行按钮 → 下一阶段）
       └ 已放行子区（已放行至编审部的作品）
            操作：[查看]
```

### 4.2 待创作列表（pending）

```
┌── 待创作 ──────────────────────────────────────────┐
│                                                      │
│  民国悬疑：报社记者          12章    06-08 企划完成    │
│    [▶ 开始创作]                                      │
│                                                      │
│  星际漂流记                 8章     06-07 企划完成     │
│    [▶ 开始创作]  [📂 放入文件暂存]                    │
│                                                      │
│  （无待创作作品时显示：暂无待创作作品）                  │
└──────────────────────────────────────────────────────┘
```

### 4.3 创作中列表（active）

```
┌── 创作中 ──────────────────────────────────────────┐
│                                                      │
│  民国悬疑：报社记者    进度 5/12  23,800字  1小时前    │
│    [继续创作]  [✨ 确认创作完成]  [📂 暂存]           │
│                                                      │
│  深海之城                 进度 2/10  7,200字   昨天    │
│    [继续创作]  [📂 暂存]                             │
└──────────────────────────────────────────────────────┘
```

`确认创作完成` 按钮的点亮条件：全部章节 `status = 'completed'`（后端 `mark-written` #7 已在事务中做此兜底）。

### 4.4 已完成列表（completed）

```
┌── 已完成/待放行 ───────────────────────────────────┐
│                                                      │
│  民国悬疑：报社记者    12章  34,500字  完成于 06-08   │
│    [查看]  [↩️ 撤销完成]  [📂 暂存]                  │
│    (放行至编审部 → 下一阶段)                          │
│                                                      │
├── 已放行 ───────────────────────────────────────────┤
│                                                      │
│  彼岸花                  8章  22,100字  审阅中        │
│    [查看]                                             │
└──────────────────────────────────────────────────────┘
```

**放行至编审部**（`written → reviewing`）在 New Commit 1 及后续 Commit 中都暂不实现。确认创作完成的终点是"已完成/待放行"列表。

### 4.5 作品详情页（创作室模式）

当 `?from=studio` 或默认 context 为 studio 时，`WorkDetailPage.tsx` 的编辑模式：

| Tab | 内容 | 可编辑？ |
|-----|------|---------|
| 章节列表 | 章节标题/字数/状态 | ✅ 可点击进入编辑器 |
| 参考侧栏 | 本幕概要/角色速查/地点速查/写作风格 | ✅ 只读（创作时参考）|
| 元数据 | 标签/字数/章节数 | ✅ 可编辑 |

顶部操作栏（按 status）：

| status | 显示按钮 |
|--------|---------|
| `planned` | [▶ 开始创作] |
| `writing` | [继续创作] [✨ 确认创作完成] |
| `written` | [↩️ 撤销完成]（无放行按钮）|

---

## 五、后端端点评估

### 5.1 可复用的现有端点

| 端点 | 当前语义 | 在创作室中的复用方式 | 端点状态 |
|------|---------|-------------------|---------|
| `POST /projects/:id/start-writing` | `planned → writing` + writingStartedAt | **直接复用**。创作室待处理→进行中的唯一机制 | ✅ 现有可用（#6） |
| `POST /projects/:id/mark-written` | `writing → written` + workCompletedAt + 全部章节兜底 completed | **直接复用**。创作室进行中→已完成的唯一机制 | ✅ 现有可用（#7） |
| `POST /projects/:id/undo-written` | `written → writing` + workCompletedAt=null | **直接复用**。创作室部门内退回机制 | ✅ 现有可用（#9） |
| `POST /projects/:id/soft-delete` | 任意 status → deletedAt | **直接复用**。放入文件暂存 | ✅ 现有可用（#10） |
| `POST /projects/:id/restore` | deletedAt=null | **直接复用**。从文件暂存捞回 | ✅ 现有可用（#11） |
| `PUT /projects/:id` | 更新作品字段 | **直接复用**。编辑作品详情 | ✅ 现有可用 |
| `PUT /projects/:id/chapter-planning` | 保存章节规划 | **直接复用**。章节编辑 | ✅ 现有可用 |

### 5.2 需要新增的端点

| 端点 | 说明 | 优先级 |
|------|------|--------|
| `POST /projects/:id/release-to-editorial` | `written → reviewing` 放行编审部。语义：创作室确认创作完成并放行。与企划课 `release-to-studio` 同构。 | Commit 1+（放行至编审部留待下一阶段） |
| `POST /projects/:id/confirm-writing-complete` | `writing → written` 的"部门内确认完成"变体。当前 `mark-written` 已经做了这个——需要确认它是否与"确认创作完成"语义等价。如果等价，则无需新增。 | 🎯 待确认 — 当前 `mark-written` 端点已经做了 status 变更 + 时间戳 + 章节兜底。只需要确保前端按钮文案为"确认创作完成"。如果 `mark-written` 被视为"纯后端操作"，则新增 `confirm-writing-complete` 进行包装。 |

### 5.3 不需要新增的端点（现有足矣）

```
planned → writing   = POST /projects/:id/start-writing    ✅ 现有
writing → written   = POST /projects/:id/mark-written     ✅ 现有（需要确认语义是否对齐"确认创作完成"）
written → writing   = POST /projects/:id/undo-written     ✅ 现有
任意 → deletedAt    = POST /projects/:id/soft-delete      ✅ 现有
deletedAt → 恢复    = POST /projects/:id/restore          ✅ 现有
```

### 5.4 端点的部门上下文调用映射

```
创作室 Tab (pending)
  ▶ 开始创作 → POST /projects/:id/start-writing        ✅ 现有

创作室 Tab (active)
  继续创作 → 导航到作品详情页（选章节→编辑器）             前端导航
  ✨ 确认创作完成 → POST /projects/:id/mark-written     ✅ 现有
  📂 暂存 → POST /projects/:id/soft-delete             ✅ 现有

创作室 Tab (completed)
  ↩️ 撤销完成 → POST /projects/:id/undo-written        ✅ 现有
  📂 暂存 → POST /projects/:id/soft-delete             ✅ 现有
  [放行至编审部] → POST /projects/:id/submit-review    ✅ 现有（#8，但留待下一阶段）
```

---

## 六、总结：创作室阶段的 0608 对齐路径

### 6.1 设计原则

1. **创作室的三工作区结构复制企划课模式**（待处理→进行中→已完成），但具体语义和操作按钮不同。
2. **现有端点足以支撑创作室三工作区的前端实现**——只需确认 `mark-written` 的语义是否对齐"确认创作完成"。
3. **`planned` 作为创作室待处理入口成立**——这是 0608 模型的核心映射，已在 `statusLabels.ts` 中实现。
4. **"开始创作"是 `planned → writing` 的正确命名**——不叫"接收创作"因为接收在企划课放行时已完成。
5. **放行至编审部（`release-to-editorial` / `submit-review`）留待下一阶段**——本阶段终点是"已完成/待放行"列表。
6. **StageTransitionModal 在创作室上下文中同样应禁用**——与 f768af6 在 planning 上下文中的处理一致。

### 6.2 与企划课的关键差异

| 维度 | 企划课 | 创作室 |
|------|--------|--------|
| 待处理数据源 | Proposal（外部实体） | Project 同一实体（`planned`）|
| 进行中主要工作 | 编辑元数据/设定/章节规划 | 写作章节正文 |
| 完成条件 | 3 必填（内容条件） | 全部章节写完（操作条件）|
| 部门内退回 | `planned → planning` | `written → writing` |
| 新增端点需求 | `confirm-planning-complete` + `release-to-studio` | 无新增（仅确认 `mark-written` 语义）|
| StageTransitionModal | 已禁用（f768af6） | 应禁用 |

### 6.3 建议的 Commit 分组

| Commit | 范围 | 与前者的关系 |
|--------|------|-------------|
| f768af6 ✅ | 企划课三工作区 | 已完成 |
| Commit 2 | 创作室三工作区前端 + 禁用 StageTransitionModal | 依赖：无（端点全部现有）|
| Commit 3 | release-to-studio 端点 + 企划课 Tab④ 放行按钮 | 依赖 Commit 2（创作室需要待处理入口）|
| Commit 4 | release-to-editorial 端点 + 编审部待处理入口 | 依赖 Commit 3 |
