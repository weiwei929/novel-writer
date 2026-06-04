# v2 → Day 1 资产迁移表（v4.1.1）

> **定案**：2026-06-04（v4.1.1 微修订）  
> **权威设计**：`overall-architecture.md` v4.1.1  
> **权威仓库**：VPS `v2-dev`（`ecec09a` 起；本文件修订为 ecec09a+1）  
> **对照代码**：`day1-vps-code-index.md`  
> **用途**：TASK-200 之前的第 0 步；M1 开工阻塞项

---

## 0. 企划课子状态（Day 1 用 metadata，技术债）

不新增 `planningPhase` schema 字段（Day 1 已扩 7 时间戳 + `writingStyle` + `deletedAt` + `proposalId`）。

```typescript
// Project.metadata（JSON）
{
  _planningPhase?: 'evaluating' | 'setup' | 'deferred';
  // evaluating: 节点 #1 通过，尚未 confirm-greenlight
  // setup:      Tab ③ 设定完善中（默认进入 Tab ③ 时写入）
  // deferred:   节点 #2 退回本阶段 in-progress（可配合 _rejectedAt）
}
```

**Day 1.1+**：可升级为 `Project.planningPhase` 真字段。

---

## 1. 四个决策（已拍板）

| ID | 决策 | 落地要点 |
|----|------|----------|
| **D1** | 创意组 **适配优先** | 保留 4 Tab UI；L2 文案与 VPS 一致为「**灵感手记**」 |
| **D2** | **墓园替换** `/shelf` | M3：`/shelf` → `/graveyard`；`shelved` 仅「主动暂存」 |
| **D3** | **显式 SQL** | TASK-203 迁移脚本（status + 时间戳 + 字段上提 + §2.3 回填） |
| **D4** | **双入口** | 创意组企划建议书只读 + 企划课 Tab② 评估；URL 互跳 |

---

## 2.1 Proposal `approved` 与 Project `planning`（双轨保留）

| 实体 | 状态 | 含义 |
|------|------|------|
| **Proposal** | `approved` | 创意组视角：提案已被企划课接受（节点 #1 通过） |
| **Project** | `planning` | 企划课视角：作品进入筹备（设定中，未 `greenlitAt`） |

**关联**：`Proposal.projectId` ↔ 新建 `Project.id`（`accept-into-planning` / 旧 `evaluate approve` 同模式两步走）。

**不要合并为一个 status**——提案生命周期与作品生命周期分表。

---

## 2.2 存量迁移决策子表（M1 第 0 步 — 已锁）

| # | 问题 | 决策 | 落地 |
|---|------|------|------|
| **Q1** | 旧 `evaluate` 创建的 `Project(draft)` 是否回填 `proposalId`？ | **是** | 按 `metadata._fromEvaluate = true`（或等价标记）匹配 Proposal，写入 `Project.proposalId`；无标记则人工清单 |
| **Q2** | 旧 `status='draft'` 如何区分来源？ | **是** | `_fromEvaluate` → `planning` + `submittedToPlanningAt`；`_fromImport` / 无提案关联 → `imported`；1.0 纯草稿 → `imported` 或保留至用户确认（TASK-220） |

评审通过本表 + §3 + §4 映射后，方可发 TASK-200。

---

## 2.3 `proposalId` 回填（TASK-203 脚本片段）

```sql
-- 示意：旧 evaluate 创建的 Project，迁移时关联 Proposal
-- 实际 JOIN 条件在 TASK-203 卡内按 metadata 定稿

UPDATE Project
SET proposalId = (
  SELECT p.id FROM Proposal p
  WHERE p.projectId = Project.id
     OR json_extract(p.metadata, '$.linkedProjectId') = Project.id
  LIMIT 1
)
WHERE proposalId IS NULL
  AND json_extract(metadata, '$._fromEvaluate') = true;
```

新代码路径：`accept-into-planning` 创建 Project 时**同步写入** `proposalId` + `Proposal.projectId`。

---

## 3. VPS 已交付资产盘点（2026-06-02）

| 模块 | 路径/能力 | Day 1 处理 |
|------|-----------|------------|
| 灵感手记 | `ScrapNote.tsx` + `/creative/scraps` | **保留**（文档 L2 已统一命名） |
| 外来参考 | `ExternalRefs.tsx` + `FileReference` | **保留** |
| 创意讨论 | `CreativeDiscussion.tsx` | **保留 UI**；Proposal 语义对齐 `creating/created` |
| 创意企划建议书 | `PlanningProposal.tsx` + `ProposalDetailPage` | **与企划课 Tab①② 分工**（D4） |
| Proposal API | `proposals.ts` evaluate/approve | **替换**为 `accept-into-planning` / `confirm-greenlight` |
| 阶段管理 | `StageTransitionModal` + `POST .../transition` | **M1 拆解**；禁跨阶段 |
| 作品暂存 | `/shelf` + `status=shelved` | **M3** → 墓园 + `deletedAt` |
| 详情页 | `WorkDetailPage.tsx` | **M2** 状态驱动操作栏 |
| 编辑器 | `WritingEditorPage.tsx` | **M2** pure-ify |

---

## 4. Proposal 状态映射（TASK-101/102 → v4.1）

| 现 VPS 行为/字段 | v4.1 目标 | 迁移动作 |
|------------------|-----------|----------|
| `status: draft` + `metadata._discussionSubmitted: false` | `creating` | draft 且未提交 → creating |
| `status: draft` + `_discussionSubmitted: true` | `created` | 待企划评估 |
| `status: submitted` | `created` | 统一为 created |
| `status: approved` | `approved` | 保留；`projectId` 指向 `Project.planning` |
| `status: rejected` | `creating` | 退回编辑（默认） |
| `status: shelved`（提案） | 仅主动暂存 | 删除用 `deletedAt` |
| `evaluate approve` → `Project(draft)` | `Project(planning)` + 时间戳 + **proposalId** | 见 §2.2~2.3 |

**端点映射**：

| 旧 | 新（v4.1） |
|----|------------|
| 创意组提交企划 | 节点 #1：`created` |
| `PUT .../evaluate approve` | `POST .../accept-into-planning` |
| （无） | `POST .../confirm-greenlight`（planning→planned） |

---

## 5. Project.status 映射（7 值 → 11 值）

| 现 VPS | v4.1 | 备注 |
|--------|------|------|
| `draft` | `planning` 或 `imported` | 见 §2.2 Q2 |
| `planning` | `planning` | + `metadata._planningPhase`（§0） |
| `writing` | `writing` | |
| `reviewing` | `reviewing` | |
| `completed` | `reviewed` 或 `archived` | TASK-203 定稿 |
| `archived` | `archived` | |
| `shelved` | 见 D2 | 主动暂存；旧暂存 → 墓园策略 |

读时映射（`status-migration.ts`）在 TASK-203 后逐步废弃。

---

## 6. 字段迁移

### 6.1 `writingStyle`

```sql
-- UPDATE Project SET writingStyle = json_extract(metadata, '$.writingStyle') WHERE writingStyle IS NULL;
```

### 6.2 `Chapter.notes`

- 新增 `Chapter.notes`；旧 metadata 内 notes 迁移后删键

### 6.3 时间戳回填（存量）

| 条件 | 回填 |
|------|------|
| `_fromEvaluate` 的 Project | `submittedToPlanningAt = createdAt`（可空则 NULL） |
| 曾 `writing` | `writingStartedAt` 启发式 |
| 已 `archived` | `archivedAt` |

**原则**：只增不减。

---

## 7. 前端改造映射

| 区域 | 改造 |
|------|------|
| `api.ts` `PROJECT_STATUSES` | 11 值 + `statusDict.ts` |
| `Layout.tsx` | 企划课 Tab；墓园 L1；创意组 Tab 文案「灵感手记」 |
| `HomePage` / `dashboard.ts` | M2 TASK-217 |
| `WorkDetailPage` | 状态驱动操作栏 |
| `WritingEditorPage` | pure-ify |
| `App.tsx` | `/graveyard`；`/shelf` redirect |

---

## 8. 18 条不变量（实现自检）

（同 v4.1；§2.2 Q1/Q2 为存量特例，不破坏不变量 5/6。）

---

## 9. TASK 里程碑对照

见 `overall-architecture.md` §十、`code-conflict-analysis.md`。

**M1 阻塞**：§2.2 决策子表 + §4 Proposal + §5 Project 评审通过 → 再发 TASK-200。
