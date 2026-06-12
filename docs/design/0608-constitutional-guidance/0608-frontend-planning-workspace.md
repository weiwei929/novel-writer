# 0608-frontend-planning-workspace.md — 企划课前端实现蓝图

> **文档角色**：企划课三工作区（待处理/进行中/已完成）的前端实现蓝图。这是"以企划课为样板落地五部门三状态模型"的实施指南。
> **优先级**：P0 — New Commit 1 的唯一实现目标。
> **关系**：引用 `0608-dept-workspace-model.md` §2（企划课）、`0608-status-context-labeling.md` §3.2（企划课标签）、`0608-file-staging-pool.md` §2（UI 文案）。本文是 `overall-architecture.md` §四（企划课当前设计）的 0608 对齐版本。

---

## §0 文档元信息

- 版本号、日期、维护人
- 术语表
- 与 v4.1 企划课 4 Tab 设计的关系：新设计不推翻 4 Tab，而是在 4 Tab 中嵌入三工作区语义

## §1 企划课 4 Tab 在 0608 模型下的重新解释

### 1.1 映射

| Tab | 0608 三工作区 | 说明 |
|-----|--------------|------|
| ① 企划建议书（只读入口） | — | 创意组已提交的提案列表，对应"待处理"的来源 |
| ② 立项评估 | 待处理 | 来自创意组的 Proposal，等待评估/接收/暂存 |
| ③ 企划中 | 进行中 | 已接收的 Project(planning) 的企划工作 |
| ④ 立项总账 | 已完成（+历史记录） | `planned` 及以上所有状态的"已完成/历史"视图 |

### 1.2 新解释下的信息架构

```
L1: 企划课
  ├ Tab ① 企划建议书（只读）
  │    ├ 未评估提案列表（来源：Proposal.created）
  │    ├ 已评估提案列表（来源：Proposal.approved / Proposal identified via projectId）
  │    └ 操作：[接收入企划课 →] 跳转 Tab ②
  │
  ├ Tab ② 立项评估（待处理工作区）
  │    ├ 待评估队列（来源：Proposal.created）
  │    │   └ 每项：创意标题/梗概摘要/提交时间
  │    │   └ 动作：查看提案 / 接收评估 / 放入文件暂存
  │    └ 无"退回创意组"按钮
  │
  ├ Tab ③ 企划中（进行中工作区）
  │    ├ 进行中列表（来源：Project.status='planning'）
  │    │   └ 每项：作品名/设定完善进度
  │    │   └ 动作：继续完善 / 确认企划完成 / 放入文件暂存
  │    └ 点击进入作品详情页（planning 编辑模式）
  │
  └ Tab ④ 立项总账（已完成 + 历史记录）
       ├ 待放行队列（来源：Project.status='planned'，等待放行决定）
       │   └ 动作：查看（放行按钮 → Commit 1+）
       ├ 已放行作品（来源：Project.status='planned' 且已放行至创作室）
       │   └ 动作：查看
       └ 历史作品（已归档/已软删）
```

## §2 Tab ② 立项评估（待处理工作区）的具体要求

### 2.1 数据源

```
Proposal.status = 'created'
Project          = 尚未为此 Proposal 创建（无 projectId）
```

### 2.2 列表项显示

```
┌─────────────────────────────────────────────────────────┐
│  待评估提案                               共 N 项       │
│                                                         │
│  ┌── 民国悬疑：报社记者 ────────────────────────────┐  │
│  │  梗概：1930 年代上海，一名报社记者...             │  │
│  │  创意创新：民国+推理+媒体行业三条线融合          │  │
│  │  提交时间：2026-06-07 14:30                      │  │
│  │  参考素材：2 项（民国悬疑参考.pdf, 老照片...)     │  │
│  │                                                   │  │
│  │  [查看完整提案] [接收入企划课 ->] [📂 暂存]      │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌── 星际漂流记 ───────────────────────────────────┐  │
│  │  ...                                              │  │
│  │  [查看完整提案] [接收入企划课 ->] [📂 暂存]      │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 2.3 动作详解

| 动作 | 说明 | 后端端点 | 端点状态 |
|------|------|---------|---------|
| 查看完整提案 | 弹出/导航到提案详情页（只读） | GET /proposals/:id | ✅ 现有可用 |
| 接收入企划课 | 创建 Project(planning)，关联 proposalId，Proposal 可标记 approved | POST /proposals/:id/accept-into-planning | ✅ 现有可用（v4.1 #1） |
| 放入文件暂存 | Proposal.deletedAt = now | POST /proposals/:id/soft-delete | ⚠️ 目标端点：当前 proposals.ts 无此专用端点。若 New Commit 1 前未实现，**前端先不提供 Tab② 的「暂存」按钮**，避免回退到 reject/shelve 旧路径。|

**关于 Proposal 文件暂存的实现优先级**：New Commit 1 以企划课三工作区的正向流程（接收→设定→确认完成→放行）为主，Proposal 暂存是非关键路径。未实现之前，Tab② 列表项暂时只显示「查看完整提案」和「接收入企划课」两个按钮，不加「暂存」。**禁止用 reject 或 shelve 代替。**

### 2.4 禁止

- ❌ "退回创意组"按钮（reject 用户路径已冻结）
- ❌ 直接删除 Proposal（只能放入文件暂存）
- ❌ 在提案待处理列表项上直接做"确认企划完成"（那是 Project(planning) 进入企划课后的动作）

## §3 Tab ③ 企划中（进行中工作区）的具体要求

### 3.1 数据源

```
Project.status = 'planning'
Project.deletedAt IS NULL
```

### 3.2 列表项显示

```
┌─────────────────────────────────────────────────────────┐
│  企划中                                   共 N 项       │
│                                                         │
│  ┌── 民国悬疑：报社记者 ────────────────────────────┐  │
│  │  完成进度：设定完善中  □□□□□□○○○○ 3/6           │  │
│  │  开始设定：2026-06-07 15:00                      │  │
│  │                                                   │  │
│  │  [继续完善 ->] [📂 暂存]                         │  │
│  │  或： 🟢 达到正式立项条件                        │  │
│  │  [✨ 确认企划完成] [📂 暂存]                     │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 3.3 完成度门控

0608 §8.2 及会诊结论 §8.2 定义的正式立项条件：

| 条件 | 字段 | 必填？ | 前端检查 |
|------|------|--------|---------|
| 标题+梗概 | `title`, `synopsis` | ✅ | 非空字符串 |
| 内容元数据 | `metadata.tags`, `targetWordCount`, `estimatedChapters` | ✅ | 非空+正数 |
| 章节架构 | `chapters[].title`, `chapters[].synopsis` | ✅ | 至少 1 章 |
| 作品设定 | `worldBuilding` | ⚪ | 可选 |
| 写作风格 | `writingStyle` | ⚪ | 可选 |

**"确认企划完成"按钮在上述 3 必填条件满足后点亮。**

### 3.4 动作详解

| 动作 | 说明 | 后端端点 | 端点状态 |
|------|------|---------|---------|
| 继续完善 | 进入作品详情页（planning 编辑模式）| — | 前端导航，不涉及后端 |
| 确认企划完成 | `planning → planned`，设定时间戳 | `POST /projects/:id/confirm-planning-complete` | 🎯 推荐语义名。当前兼容端点可能是 `confirm-greenlight`（v4.1 #4），但前端文案必须显示**"确认企划完成"**，不可写"正式立项"。若兼容端点可用，后端 URI 可暂不重命名，前端做好调用映射。 |
| 放入文件暂存 | `deletedAt = now` | `POST /projects/:id/soft-delete` | ✅ 现有可用（projects.ts #10） |

### 3.5 禁止

- ❌ **不出现 "✨ 正式立项" 文案** → 改为 **"确认企划完成"**（0608 会诊结论 §8.2 明确规定）
- ❌ 不出现 "planned → writing" 或 "开始写作" 按钮
- ❌ 不出现 StageTransitionModal（全局线性阶段推进器已冻结）
- ❌ 不出现退回创意组/退回提案评估（跨部门退回已冻结）

## §4 Tab ④ 立项总账（已完成 + 历史）的具体要求

### 4.1 数据源（拆分为两个子视图）

**视图 A：已完成/待放行**

```
Project.status = 'planned'
Project.deletedAt IS NULL
AND Project 尚未放行到创作室
```

**视图 B：已放行 + 历史**

```
Project.greenlitAt IS NOT NULL
或 Project.status IN ('writing', 'written', 'reviewing', 'reviewed', 'archived')
或 Project.deletedAt IS NOT NULL
```

### 4.2 已完成/待放行列表

```
┌── 已完成/待放行 ────────────────────────────────────┐
│                                                       │
│  ┌── 民国悬疑：报社记者 ────────────────────────┐  │
│  │  企划完成：2026-06-07 16:00                   │  │
│  │                                                 │  │
│  │  [查看设定]  [📂 暂存]                          │  │
│  │  (放行至创作室 → Commit 1+)                     │  │
│  └─────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────┘
```

### 4.3 动作详解

| 动作 | 说明 | 后端端点 | 端点状态 |
|------|------|---------|---------|
| 查看设定 | 作品详情页（只读模式） | GET /projects/:id | ✅ 现有可用 |
| 放行至创作室 | 作品可供创作室待处理列表可见（**不放行后不自动 writing，不进入编辑器**）| POST /projects/:id/release-to-studio | 🎯 目标端点：Commit 1+ / Commit 2 必须。New Commit 1 **暂不实现此按钮**，Tab④ 的"待放行"列表只展示已确认完成的 planned 作品，放行动作留待下一阶段。 |
| 退回企划中 | `planned → planning`（本部门退回） | POST /projects/:id/undo-planning-complete | 🎯 目标端点：当前不存在（类似 undo-written #9，但针对 planning 阶段）。可延后到 Commit 1+，暂不显示按钮。不允许用"退回创意组"/reject 替代。 |
| 放入文件暂存 | `deletedAt = now` | POST /projects/:id/soft-delete | ✅ 现有可用（projects.ts #10） |

### 4.4 "放行至创作室"留待下一阶段

0608 会诊结论 §8.3 强调：

```
放行至创作室不等于自动开始写作。
planned 可以作为创作室待处理入口。
```

New Commit 1 的终点是 `planned` 作品出现在"企划已完成 / 待放行"列表，**不含"放行至创作室"按钮**。

放行至创作室作为独立的跨部门交接动作，留待 Commit 1+ 或 Commit 2 实现。届时设计原则：

- ✅ 弹出"已放行"的轻提示（toast）
- ✅ 停留在企划课 Tab ④ 视图
- ❌ 不自动导航到创作室页面
- ❌ 不自动打开编辑器
- ❌ 不修改 Project.status（仍保持 `planned`）

## §5 作品详情页（planning 编辑模式）

### 5.1 当前问题

会诊结论确认："planning 阶段作品设定只读是高优先级问题。"

当前 `WorkDetailPage.tsx` 在 `planning` 状态下是否允许编辑需要验证。

### 5.2 目标状态

当 `?from=planning`（或 `status === 'planning'`）时，作品详情页显示为"编辑模式"：

| Tab | 内容 | 可编辑？ |
|-----|------|---------|
| 作品设定 | 世界观/角色/地点等 | ✅ 可编辑（CreativeSettingSection 或三栏布局左栏）|
| 元数据 | 标签/目标字数/预计章节数 | ✅ 可编辑（ContentMetadataCard 编辑模式）|
| 章节架构 | 章标题/章纲 | ✅ 可编辑（ChapterPlanningEditor 编辑模式）|

### 5.3 顶部操作栏

```
[← 返回企划课]  民国悬疑：报社记者  状态：企划中

[保存]
```

与全局标签系统一致："企划中" = `depContextStatusLabel('planning', 'active', 'planning')`。

**修正案对齐**：[确认企划完成] 和 [放入文件暂存] 是流程决策，必须位于企划课进行中列表条目上；作品详情页只保留内容保存动作。

### 5.4 禁止的操作

- ❌ 作品详情页中不出现"开始写作"、"进入编辑器"等创作室操作
- ❌ 作品详情页中不出现"确认企划完成"、"放行创作室"、"放入文件暂存"等流程决策按钮
- ❌ 不出现全局 StageTransitionModal
- ❌ 不出现跨部门退回选项
- ❌ 不出现审阅相关功能

## §6 必须排除的功能清单

New Commit 1 明确排除以下内容（会诊结论 §6/§7）：

| 排除项 | 原因 |
|--------|------|
| `planned → writing` 一键推进 | 确认完成 ≠ 放行下一部门 ≠ 开始下一阶段 |
| 放行至创作室按钮 | 跨部门交接动作，Commit 1+ / Commit 2 |
| 打开写作编辑器 | 新 Commit 1 不到创作室 |
| 编审部相关 | 未到该阶段 |
| 文集库相关 | 未到该阶段 |
| Reader | 未到该阶段 |
| Review schema | 未到该阶段 |
| 元数据 Tab 大合并 | scope 控制 |
| 大规模后端状态迁移 | scope 控制 |
| AI 功能 | 未到该阶段 |
| UI 美化 | 非此阶段目标 |
| 全局 StageTransitionModal | 已冻结，拆解方案待定 |

## §7 后端依赖项（按状态分类）

前端 New Commit 1 所需的后端支持。以三种状态区分：

- ✅ **现有可用** — 当前 VPS 代码中已存在，可直接调用
- 🎯 **目标新增** — 当前不存在，New Commit 1 必须新增
- ❌ **本阶段暂不实现** — 明确不在 New Commit 1 范围

### 7.1 现有可用（✅）

| 端点 | 说明 | 对应文件 |
|------|------|---------|
| `GET /proposals` | 企划课待处理列表数据源（filter by status=created）| proposals.ts |
| `GET /proposals/:id` | 查看提案详情（只读）| proposals.ts |
| `POST /proposals/:id/accept-into-planning` | 接收提案 → 创建 Project(planning) | proposals.ts (#1) |
| `GET /projects/:id` | 作品详情（只读/编辑的基础 GET）| projects.ts |
| `PUT /projects/:id` | 更新作品设定/元数据/章节（用于 planning 编辑模式）| projects.ts |
| `PUT /projects/:id/chapter-planning` | 保存章节规划 | projects.ts |
| `GET /projects/:id/chapter-planning` | 获取章节规划 | projects.ts |
| `POST /projects/:id/soft-delete` | 放入文件暂存（设置 deletedAt）| projects.ts (#10) |
| `POST /projects/:id/restore` | 从文件暂存捞回 | projects.ts (#11) |

### 7.2 目标新增（🎯 — New Commit 1 必须）

这些端点是 0608 模型的核心语义——v4.1 中没有的"确认完成"概念。

| 端点 | 说明 | 为什么必须 |
|------|------|-----------|
| `POST /projects/:id/confirm-planning-complete` | 企划课确认完成（`planning → planned` + 时间戳）| 这是"确认企划完成"按钮的后端。兼容路线：若 `confirm-greenlight` 端点已有（v4.1 #4），可暂用其作为兼容端点（前端文案仍显示"确认企划完成"），但推荐独立端点。 |

### 7.3 目标新增（🎯 — 可延后到 Commit 1+ / Commit 2）

| 端点 | 说明 | 可延后的理由 |
|------|------|-------------|
| `POST /projects/:id/release-to-studio` | 企划课放行到创作室（不改变 status，记录放行标记）| 放行是独立跨部门动作，New Commit 1 的终点只到 planned 出现在"待放行"列表。放行按钮留到下一阶段，避免越界进入创作室边界。 |
| `POST /projects/:id/undo-planning-complete` | `planned → planning` 部门内退回 | Tab④ 的"退回企划中"可用。不实现时暂不显示按钮。不允许用 reject 或跨部门退回替代。 |

### 7.4 本阶段暂不实现（❌）

以下端点**不**在 New Commit 1 范围内：

| 端点 | 原因 |
|------|------|
| `POST /proposals/:id/soft-delete` | Proposal 暂存是非关键路径。Tab② 暂不显示"暂存"按钮，正向流程（接收→设定→完成→放行）优先 |
| `POST /projects/:id/undo-written` | 创作室范围，不在企划课 |
| `POST /projects/:id/submit-review` | 编审部范围 |
| `POST /projects/:id/archive` | 文集库范围 |
| `POST /projects/:id/start-writing` | 创作室范围，New Commit 1 不进入创作室 |

### 7.5 端点调用映射总结

```
Tab ② (待处理)
  GET /proposals?status=created                          ✅ 现有
  POST /proposals/:id/accept-into-planning               ✅ 现有
  [暂存按钮暂不显示, 等 Proposal soft-delete]             ❌ 本阶段不实现

Tab ③ (进行中)
  PUT /projects/:id                                       ✅ 现有 (保存设定)
  PUT /projects/:id/chapter-planning                      ✅ 现有 (保存章节)
  POST /projects/:id/confirm-planning-complete            🎯 目标新增(或兼容 confirm-greenlight)
  POST /projects/:id/soft-delete                          ✅ 现有 (暂存)

Tab ④ (已完成/待放行)
  GET /projects/:id                                       ✅ 现有 (查看设定)
  [放行按钮暂不实现 → Commit 1+/Commit 2]                 🎯 下一阶段
  [退回企划中按钮暂不显示]                                  🎯 可延后
  POST /projects/:id/soft-delete                          ✅ 现有 (暂存)
```

## §8 预期结果（验收标准）

New Commit 1 完成后，用户应能：

1. 在企划课 Tab ② 看到来自创意组的待评估提案列表
2. 点击"接收入企划课"，创建 Project(planning)，提案从待处理队列消失，出现在 Tab ③
3. 在企划课 Tab ③ 看到进行中的 Project(planning) 列表
4. 点击"继续完善"，进入作品详情页的 planning 编辑模式
5. 在 planning 编辑模式下编辑作品设定、元数据、章节架构、章节梗概
6. 保存后返回 Tab ③，满足 3 必填条件的列表条目上"确认企划完成"按钮点亮
7. 在 Tab ③ 列表条目点击"确认企划完成"，Project 进入 planned 状态，出现在 Tab ④

New Commit 1 的终点是企划课内部闭环（待处理 → 进行中 → 已完成）。放行至创作室是独立跨部门交接动作，留待下一阶段。

不应出现：

1. ❌ 跨部门退回按钮
2. ❌ reject 路径
3. ❌ shelved 字面量
4. ❌ 全局 StageTransitionModal
5. ❌ planned → writing 按钮
6. ❌ 放行至创作室按钮（留下一阶段）
7. ❌ 编辑器入口
8. ❌ 审阅/Reviwer 功能
9. ❌ 作品详情页中的阶段转换按钮
