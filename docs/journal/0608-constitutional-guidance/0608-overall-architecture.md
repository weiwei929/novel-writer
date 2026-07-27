# 0608-overall-architecture.md — 系统整体架构（0608 对齐版）

> **文档角色**：替代 `overall-architecture.md` v4.1.1，作为 0608 宪法级指引的系统总纲。
> **优先级**：P0 — 所有后续设计的引用根基。
> **关系**：本文引用 `0608-dept-workspace-model.md`（核心模型）、`0608-status-context-labeling.md`（标签）、`0608-file-staging-pool.md`（暂存）、`0608-frontend-planning-workspace.md`（企划课实施）、`0608-editorial-workspace.md`（编审部实施）。各部门具体实施细节见各自工作区文档。

---

## §0 系统一句话

**一个人的多部作品并行创作管理系统**。作者以 5 个不同部门身份（创意组→企划课→创作室→编审部→文集库）参与不同阶段事务，每个部门按待处理/进行中/已完成三工作区管理当前状态的作品。

---

## §1 五部门三工作区架构

### 1.1 管线总览

```
创意组 ──放行──→ 企划课 ──放行──→ 创作室 ──放行──→ 编审部 ──放行──→ 文集库
  │                │                 │                │                │
  ├ 待处理         ├ 待处理          ├ 待处理         ├ 待处理         ├ 待处理
  ├ 进行中         ├ 进行中          ├ 进行中         ├ 进行中         ├ 进行中
  └ 已完成         └ 已完成          └ 已完成         └ 已完成         └ 已完成
```

### 1.2 部门-状态-工作区映射

| 部门 | 待处理 | 进行中 | 已完成 | 跨部门放行？ |
|------|--------|--------|--------|-------------|
| 创意组 | `created`（待评估提案） | `approved`（通过评估，等待企划课接收） | 已移交企划课 | 不直接放行（由企划课"接收入企划课"触发） |
| 企划课 | `planning`（企划中） | `planned`（企划完成） | 已放行创作室 | ✅ `planned` → 创作室待处理 |
| 创作室 | `planned`（待创作） | `writing`（创作中） | `written`（创作完成） | ✅ `written` → 编审部待处理 |
| 编审部 | `written`（待审阅） | `reviewing`（审阅中） | `reviewed`（审阅完成） | ✅ `reviewed` → 文集库待处理 |
| 文集库 | `reviewed`（待归库） | 归档操作 | `archived`（已归档） | 终态，不继续放行 |

### 1.3 核心原则

1. **确认完成 ≠ 放行下一部门**。同一部门内，完成当前阶段工作和放行到下一部门是两个独立动作。
2. **不允许跨部门退回**（F-001）。部门 B 不能直接把作品退回部门 A。争议走文件暂存池线外裁决。
3. **允许部门内退回**。`planned→planning`、`reviewing→writing` 等属同一部门内部操作。
4. **文件暂存池 ≠ 状态机**（F-003）。`deletedAt` 是元层标记，不改变 `Project.status`。恢复后回到原状态队列。
5. **部门上下文决定标签语义**。同一 `status` 在不同部门显示不同标签（如 `planned` 在企划课="企划已完成"，在创作室="待创作作品"）。
6. **内容变化不等于流程推进**。内容决策只在详情页/编辑器/内容表单中发生；流程决策只在部门列表条目上发生。详见 `0608-amendment-decision-separation.md`。

---

## §2 前端架构

### 2.1 分层

```
L1: 部门导航（Layout 顶栏）
  ├ 创意组    → /creative/*
  ├ 企划课    → /planning/*
  ├ 创作室    → /writing/*
  ├ 编审部    → /editorial/*
  ├ 文集库    → /library/*
  └ 文件暂存  → /shelf

L2: 各部门三工作区列表页
  ├ 创意组: ProposalReviewPage / PlanningProposal
  ├ 企划课: PlanningInProgressPage / PlanningProjectsPage
  ├ 创作室: WritingProjectsPage
  ├ 编审部: EditorialPage
  └ 文集库: LibraryPage

L3: 作品详情页 / 专用编辑页
  ├ WorkDetailPage            → 通用详情页（按 ?from= 切换部门上下文）
  ├ ReviewDetailPage          → 编审部三栏审阅布局
  └ WritingEditorPage         → 创作室章节编辑器
```

### 2.2 部门上下文路由约定

```
/work/:id?from=planning    → 企划课上下文（规划编辑模式）
/work/:id?from=writing     → 创作室上下文（开始创作/进入创作室）
/work/:id?from=editorial   → 编审部上下文（开始审阅/进入审阅）
/work/:id?from=library     → 文集库上下文（只读/归档操作）
```

### 2.3 状态标签

使用 `getProjectStatusLabel(status, phase)` 函数（`statusLabels.ts`）替代全局 `PROJECT_STATUS_LABEL` 字典。详见 `0608-status-context-labeling.md`。

### 2.4 操作按钮模式

阶段转换类操作按钮必须位于部门列表条目上，**不依赖**全局 `StageTransitionModal`（F-004 冻结）。详情页、编辑器、内容表单只保留内容保存和编辑动作。

---

## §3 后端架构（0608 视角）

### 3.1 状态模型

```
Project.status 主值（PRIMARY）：
  planning → planned → writing → written → reviewing → reviewed → archived

Proposal.status 主值：
  creating → created → approved
```

### 3.2 端点架构

**部门语义端点**（推荐，业务逻辑复杂时）：
- `POST /projects/:id/confirm-planning-complete`（企划课确认完成）
- `POST /projects/:id/start-writing`（创作室开始创作）
- `POST /projects/:id/confirm-written`（创作室确认创作完成）

**通用转换端点**（无额外业务逻辑时可直接复用）：
- `POST /projects/:id/transition { to: 'reviewing' }`（编审部开始审阅）
- `POST /projects/:id/transition { to: 'reviewed' }`（编审部确认审阅完成）

**跨部门端点**：
- `POST /projects/:id/release-to-studio`（🎯 放行至创作室，Commit 1+）
- `POST /projects/:id/release-to-editorial`（🎯 放行至编审部，Commit 3+）
- `POST /projects/:id/release-to-library`（🎯 放行至文集库，Commit 4+）

详见 `0608-release-protocol.md`。

### 3.3 文件暂存端点

- `POST /projects/:id/soft-delete` — 设 `deletedAt`
- `POST /projects/:id/restore` — 清 `deletedAt`
- `DELETE /projects/:id` — 硬删除（二次确认）

`shelve`/`restore-shelved`/`reject` 端点已冻结。详见 `0608-file-staging-pool.md`。

---

## §4 四次部门交接（放行协议）

简表（详见 `0608-release-protocol.md`）：

| 交接 | 源部门 | 目标部门 | 放行动作 | 接收动作 | 状态要求 |
|------|--------|---------|---------|---------|---------|
| ① | 企划课 | 创作室 | 放行至创作室 | 出现于待创作列表 | `planned` |
| ② | 创作室 | 编审部 | 放行至编审部 | 出现于待审阅列表 | `written` |
| ③ | 编审部 | 文集库 | 放行至文集库 | 出现于待归库列表 | `reviewed` |
| ④ | 创意组 | 企划课 | 创意组提案后由企划课"接收" | 创建 `Project(planning)` | `approved` |

**放行核心原则**：放行不改变 `Project.status`。`planned` 放行后仍为 `planned`（但出现在创作室待处理列表）。开始创作（`planned→writing`）是创作室内部动作。

---

## §5 不变量（所有代码变更不得违反）

| # | 不变量 | 适用范围 |
|---|--------|---------|
| 1 | `Project.status` 唯一顺序链：`planning→planned→writing→written→reviewing→reviewed→archived` | 状态机 |
| 2 | `deletedAt IS NOT NULL` 的对象不出现在任何部门工作台列表 | 列表查询 |
| 3 | 恢复对象后其 status 不变（只清除 `deletedAt`） | 暂存池 |
| 4 | `shelved` 不再写入新记录 | 数据库 |
| 5 | 部门上下文标签由 `getProjectStatusLabel(status, phase)` 决定 | 前端 |
| 6 | 同一部门内可退回（`planned→planning` 等），跨部门不可 | 操作权限 |
| 7 | 确认完成和放行是独立动作 | 业务流程 |
| 8 | 文件暂存池中的作品参与零部门计数 | 统计 |

---

## §6 目录

```
frontend/
  src/
    pages/
      work/WorkDetailPage.tsx       ← 通用详情页（按 ?from 切换上下文）
      writing/WritingProjectsPage   ← 创作室三工作区列表
      writing/WritingEditorPage     ← 纯写作编辑器
      planning/                     ← 企划课各页面
      editorial/EditorialPage       ← 编审部列表
      editorial/ReviewDetailPage    ← 编审部审阅详情页
      creative/                     ← 创意组各页面
      library/                      ← 文集库页面
    services/
      api.ts                        ← 后端 API 封装
      statusLabels.ts               ← 部门上下文标签
      status-migration.ts           ← 1.0→2.0 状态映射
    components/
      projects/
        ProjectStatusBadge.tsx      ← 通用状态标签组件
        ProjectPickerView.tsx       ← 通用列表组件
        FileStagingConfirmModal     ← 文件暂存确认弹窗

backend/
  src/
    routes/
      projects.ts                   ← Project CRUD + 语义端点
      proposals.ts                  ← Proposal CRUD
      chapters.ts                   ← 章节 CRUD
    constants/
      statuses.ts                   ← 状态枚举（PRIMARY/LEGACY_READ）
    middleware/
      stage-guard.ts                ← 状态转换守卫（待 0608 清洗）
```

---

## §7 旧文档替代关系

| 旧文档 | 替代方案 | 状态 |
|--------|---------|------|
| `overall-architecture.md` v4.1.1 | 本文档 | ✅ 已标记替代 |
| `day1-design.md` | 0608 系列各部门设计文档 | ✅ 已标记替代 |
| `code-conflict-analysis.md` | `0608-legacy-freeze-list.md` | ✅ 已标记替代 |
| `file-staging-v2.md` | `0608-file-staging-pool.md` | ✅ 已标记替代 |
| `intake-flow-v2.md` | `0608-dept-workspace-model.md` + 创意组设计 | ✅ 已标记替代 |
| `editorial-dept-v2.md` | `0608-editorial-workspace.md` | ✅ 已标记替代 |
| `editorial-library-v2.md` | `0608-library-workspace.md`（待编写） | ⏸️ 待替代 |
