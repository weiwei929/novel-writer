# v2 → Day 1 资产迁移表（v4.1）

> **定案**：2026-06-04  
> **权威设计**：`overall-architecture.md` v4.1  
> **对照代码**：`day1-vps-code-index.md`（VPS `v2-dev`）  
> **用途**：TASK-200 之前的第 0 步；M1 开工阻塞项

---

## 1. 四个决策（已拍板）

| ID | 决策 | 落地要点 |
|----|------|----------|
| **D1** | 创意组 **适配优先** | 保留 4 Tab UI；改 Proposal 语义 + API，不重做页面 |
| **D2** | **墓园替换** `/shelf` | M3：`/shelf` → `/graveyard` 重定向；`shelved` 仅「主动暂存」 |
| **D3** | **显式 SQL** | TASK-203 迁移脚本（status 重命名 + 时间戳回填 + 字段上提） |
| **D4** | **双入口** | 创意组企划建议书只读 + 企划课 Tab② 评估；URL 互跳 |

---

## 2. VPS 已交付资产盘点（2026-06-02）

| 模块 | 路径/能力 | Day 1 处理 |
|------|-----------|------------|
| 灵感手记 | `ScrapNote.tsx` + `/creative/scraps` | **保留** |
| 外来参考 | `ExternalRefs.tsx` + `FileReference` | **保留** |
| 创意讨论 | `CreativeDiscussion.tsx` | **保留 UI**；Proposal 语义对齐 `creating/created` |
| 创意企划建议书 | `PlanningProposal.tsx`（创意组 Tab）+ `ProposalDetailPage` | **与企划课 Tab①② 分工**（D4） |
| Proposal API | `proposals.ts` evaluate/approve | **替换**为 `accept-into-planning` / `confirm-greenlight` 路径 |
| 阶段管理 | `StageTransitionModal` + `POST .../transition` | **M1 拆解**；禁跨阶段 |
| 作品暂存 | `/shelf` + `status=shelved` | **M3** → 墓园 + `deletedAt` |
| 详情页 | `WorkDetailPage.tsx` | **M2** 状态驱动操作栏 |
| 编辑器 | `WritingEditorPage.tsx` 四模式 | **M2** pure-ify |

---

## 3. Proposal 状态映射（TASK-101/102 → v4.1）

| 现 VPS 行为/字段 | v4.1 目标 | 迁移动作 |
|------------------|-----------|----------|
| `status: draft` + `metadata._discussionSubmitted: false` | `creating` | SQL/脚本：draft 且未提交 → creating |
| `status: draft` + `_discussionSubmitted: true` | `created` | 已提交、待企划评估 |
| `status: submitted` | `created`（企划课可见） | 统一为 created |
| `status: approved` | `approved`（已过企划评估） | 保留；关联 `Project.planning` |
| `status: rejected` | `created` 或 `creating` | 业务选：退回编辑 → `creating` |
| `status: shelved`（提案） | 勿与「通过」混用 | 仅主动暂存；删除用 `deletedAt` |
| `evaluate approve` → `Project(draft)` | `Project(planning)` + `submittedToPlanningAt` | **改 approve 逻辑** |

**端点映射**：

| 旧 | 新（v4.1） |
|----|------------|
| 创意组「进入企划建议书」`status→submitted` | 节点 #1：`created` + 跳转企划课 |
| `PUT .../evaluate approve` | `POST .../accept-into-planning` |
| （无） | `POST .../confirm-greenlight`（planning→planned） |

---

## 4. Project.status 映射（7 值 → 11 值）

| 现 VPS | v4.1 | 备注 |
|--------|------|------|
| `draft` | `planning` 或 `imported` | 导入未处理 → `imported`；来自提案 → `planning` |
| `planning` | `planning` | 企划课设定中 |
| `writing` | `writing` | |
| `reviewing` | `reviewing` | |
| `completed` | `reviewed` 或 `archived` | 需业务确认归档前状态 |
| `archived` | `archived` | |
| `shelved` | 见 D2 | 主动暂存保留 `shelved`；原暂存数据 → `deletedAt` 或迁移说明 |

读时映射（`status-migration.ts`）在 TASK-203 后**逐步废弃**，以 DB 值为准。

---

## 5. 字段迁移

### 5.1 `writingStyle`

```sql
-- TASK-203 示意（SQLite，实际脚本在 TASK-203 卡内定稿）
-- UPDATE Project SET writingStyle = json_extract(metadata, '$.writingStyle') WHERE writingStyle IS NULL;
```

### 5.2 `Chapter.notes`

- 新增 `Chapter.notes`（Text 或 Json，与实现定稿）
- 旧 `metadata` 内 notes 若有，迁移后删除 JSON 键

### 5.3 时间戳回填（存量）

| 条件 | 回填 |
|------|------|
| 已有 `Project` 且来自 `approve` | `submittedToPlanningAt = createdAt` |
| `status` 曾到 writing | `writingStartedAt` 可空或启发式 |
| 已 `archived` | `archivedAt` |

**原则**：只增不减；无法推断则留 NULL。

---

## 6. 前端改造映射

| 区域 | 改造 |
|------|------|
| `api.ts` `PROJECT_STATUSES` | 11 值 + `utils/statusDict.ts` |
| `Layout.tsx` | 企划课 Tab 名；+墓园 L1 |
| `HomePage` / `dashboard.ts` | M2：按新 status 聚合 |
| `WorkDetailPage` | 状态驱动操作栏（替代 StageTransitionModal 跨阶段） |
| `WritingEditorPage` | 移除 ai/review 模式与作品级入口 |
| `App.tsx` | `/graveyard`；`/shelf` redirect |

---

## 7. 18 条不变量（实现自检）

1. 三选一只在 4 节点  
2. 禁止跨阶段回退（服务端硬拒）  
3. 删除走 `deletedAt` / 墓园  
4. `shelved` 仅主动暂存  
5. Proposal 通过 → `approved`（非 shelved）  
6. `greenlitAt` 仅 `confirm-greenlight` 写入  
7. Chapter 仅 `draft/writing/completed`  
8. `written` 仅 Project 级  
9. 时间戳只增不减  
10. 立项总账筛 `greenlitAt IS NOT NULL`  
11. work-level 仅详情页  
12. 编辑器无状态下拉  
13. 笔记无转灵感手记  
14. `writingStyle` 顶层只读（创作室）  
15. 默认查询 `deletedAt IS NULL`  
16. 创意组 4 Tab UI 保留（D1）  
17. `/api/v2` 前缀不变  
18. M1 验收前不开 M2  

---

## 8. TASK 里程碑对照

见 `overall-architecture.md` §十、`code-conflict-analysis.md`。

**M1 阻塞**：本表 §3 Proposal 映射 + §4 Project 映射 评审通过后再发 TASK-200。
