# 0608-audit-legacy-10-residuals.md — 1.0 Legacy 残留第一轮审计

> **文档角色**：对 novel-writer 项目中 1.0 遗留的审计清单与治理建议。
> **优先级**：P2 — 低风险 UI 文案本轮已修正，其余按治理顺序分批推进。
> **状态**：Audit v1（2026-06-11）

---

## §1 审计摘要

审计范围：`frontend/src/` + `backend/src/` 全部 `.ts/.tsx` 文件。

审计关键词：
```
章节规划 / 章节管理 / ChapterPlanning / chapter-planning
一键进入编辑器 / 进入编辑器 / 开始写作 / start-writing
StageTransitionModal / masterPrompt / PROJECT_STATUS_LABEL
/api/v2/ai / shelve / reject / metadata.synopsis / description
```

共发现 **21 项 1.0 残留**，按处理优先级分为五类。

---

## §2 残留清单总表

### 🔧 已修正（本轮）

| # | 位置 | 旧文案 | 新文案 | 类型 |
|---|------|--------|--------|------|
| R01 | `ChapterManager.tsx` L236 | 章节管理 | **作品章节** | 改名 |
| R02 | `ProjectCard.tsx` L132 | 进入编辑器 | **进入作品详情** | 改名 |
| R03 | `ChapterPlanningEditor.tsx` L157 | 章节规划已保存 | **作品章节已保存** | 改名 |
| R04 | `ChapterPlanningEditor.tsx` L162 | 保存章节规划失败 | **保存作品章节失败** | 改名 |
| R05 | `ChapterPlanningEditor.tsx` L175 | 章节规划（标题） | **作品章节** | 改名 |
| R06 | `WorkDetailPage.tsx` L711 | 章节规划已更新 | **作品章节已更新** | 改名 |

### 🟡 可保留实现但需 Work 语义包装

| # | 位置 | 内容 | 建议 |
|---|------|------|------|
| R07 | ~~`ChapterPlanningEditor.tsx`~~ → `WorkChapterEditor.tsx` | **✅ 已重命名（Task 1）。** 组件名 + 文件名 + 所有 import 已更新。 |
| R08 | `api.ts` L540-548 | `getChapterPlanning` / `updateChapterPlanning` | 后端 API 路径不变；前端调用方暂不改名。远期可加 `worksApi` wrapper。 |
| R09 | ~~`PlanningActions.tsx`~~ | 已删除（零消费者） | ✅ |
| R10 | ~~`StudioActions.tsx`~~ | 已删除（零消费者） | ✅ |

### 🔴 数据层：需兼容迁移

| # | 位置 | 内容 | 建议 |
|---|------|------|------|
| R11 | `api.ts` L72-83 | `PROJECT_STATUS_LABEL` 全局字典 | F-006 已冻结。列表中多处引用（`ProjectCard`、`ShelfPage`、`StatsPage`、`StageTransitionModal`）。应在部门列表页逐个替换为 `getProjectStatusLabel(status, phase)`。 |
| R12 | `Project.description` vs `metadata.synopsis` | 两个字段承载梗概语义 | 已在 WorkDetailPage 中以 `work.synopsis` 统一读取。远期需后端统一为一个字段后迁移。 |
| R13 | `api.ts` L143/L453 | `genre?: string[]` 与 `tags` 重复 | L453: `genre: p.tags`。前端删除 `genre`，统一用 `tags`。 |

### 🧊 冻结隔离：AI / 自动化遗留

| # | 位置 | 内容 | 说明 |
|---|------|------|------|
| R14 | `backend/src/routes/ai.ts` | `/api/v2/ai/*` 全部路由 | 与 0608 模型未对齐，保持冻结。不移除代码，不启用。 |
| R15 | `backend/src/services/ai/` | `AIService` / `ContextManager` / `PromptManager` | 后端 AI 服务层。依赖 `settingsManager` 中的 AI 配置（openai/ollama/deepseek/gemini/mock）。属于 1.0 AI 遗留。 |
| R16 | `frontend/src/components/ai/` | `AIMetadataAssistant` / `ChapterOutlineGenerator` / `CharacterGenerationModal` | 前端 AI 组件。`ChapterOutlineGenerator` 中包含「章节规划」文案——此文案已在本轮修正中排除，因为它是 AI 组件内的遗留概念，不应在本次非 AI 治理中修改。 |
| R17 | Prisma + 前端: `masterPrompt` | 暗线提示词字段 | AI 遗留。仅在 `LibraryDetailPage` 中显示。不进入内容模型，不删除字段。 |

### 🔴 高风险：暂缓处理

| # | 位置 | 内容 | 原因 |
|---|------|------|------|
| R18 | ~~`StageTransitionModal.tsx`~~ | 全局阶段推进器 | **✅ 已删除（P2-1b）。** |
| R19 | **shelve / reject 路径（详见 P2-2 审计）** | 见下方 §5 | **F-002 + F-003 冻结。** 用户可见路径仍存在。 |
| R20 | `/api/v2/projects/:id/start-writing` | 后端端点 + `projectsApi.startWriting()` | 列表页流程决策按钮，符合 0608。端点命名是 1.0 口径。 |
| R21 | `backend/src/routes/projects.ts` | `move-to-draft` 已废弃端点 | 标为 Deprecated，不应从新增代码调用。 |

---

## §5 P2-2 shelve / reject 路径审计（2026-06-11）

### 5.1 前端用户可见路径

#### 🔴 高危：用户可触发 reject

| 页面 | 按钮/文案 | 调用 | 风险 |
|------|----------|------|:--:|
| `PlanningProposal.tsx` L206 | "退回" 按钮 | `handleEvaluate('reject')` → `proposalsApi.evaluate(id, 'reject')` | 🔴 用户可见，急需治理 |
| `ProposalStatusBadge.tsx` L11 | `rejected` 状态标签样式 | 仅 CSS | 🟡 标签留存（reject 端点移除后可删） |
| `dashboard.ts` L85 | 过滤 `p.status === 'rejected'` | 仪表盘提案过滤 | 🟡 数据留存（存量 rejected 提案仍需显示） |

#### 🔴 高危：用户可触发 shelve（写 status='shelved'）

| 页面 | 按钮/文案 | 调用 | 风险 |
|------|----------|------|:--:|
| `PlanningProposal.tsx` L214 | "暂存" 按钮 | `handleEvaluate('shelve')` → `proposalsApi.evaluate(id, 'shelve')` | 🔴 写 status='shelved' |
| `ProposalDetailPage.tsx` L99 | "暂存" 操作 | `proposalsApi.evaluate(id, 'shelve')` | 🔴 同上 |
| `ProjectCard.tsx` L57-58 | "移入暂存" 按钮 | `projectsApi.shelve(id)` | 🔴 写 status='shelved' |
| `ProjectCard.tsx` L45 | `status === 'shelved'` 颜色 | 展示 | 🟡 |

#### 🟡 0608 合规路径（走 deletedAt / soft-delete）

| 页面 | 按钮 | 调用 | 状态 |
|------|------|------|:--:|
| `PlanningActions.tsx` L68 | 放入文件暂存 | `projectsApi.softShelve()` | ⚠️ 见 5.4 严重发现 |
| `StudioActions.tsx` L107 | 放入文件暂存 | `projectsApi.softShelve()` | ⚠️ 同上 |
| `EditorialActions.tsx` L69 | 放入文件暂存 | `projectsApi.softShelve()` | ⚠️ 同上 |
| `LibraryActions.tsx` L56 | 放入文件暂存 | `projectsApi.softShelve()` | ⚠️ 同上 |
| `LibraryDetailPage.tsx` L143 | 放入文件暂存 | `projectsApi.softDelete()` | ✅ 正确 |
| `ReviewDetailPage.tsx` L91 | 放入文件暂存 | `projectsApi.softDelete()` | ✅ 正确 |
| `GraveyardActions.tsx` L34 | 还原 | `projectsApi.unshelve()` | ✅ 已使用 deletedAt 语义 |

#### 🟡 ShelfPage — 仍依赖 shelved 状态

`ShelfPage.tsx` 整个页面依赖 `_shelved` metadata 和 `shelved` 状态展示。如果 `shelved` 状态不再被写入，此页面需要改为基于 `deletedAt` 的墓园视图。

### 5.2 前端 API 调用

| 函数 | 端点 | 行为 | 0608 合规？ |
|------|------|------|:--:|
| `projectsApi.shelve()` | `POST /projects/:id/shelve` | 写 `status='shelved'` | ❌ |
| `projectsApi.softShelve()` | `POST /projects/:id/soft-shelve` | **也写 `status='shelved'`！** | ❌ 见 5.4 |
| `projectsApi.softDelete()` | `POST /projects/:id/soft-delete` | 写 `deletedAt`，不改 status | ✅ |
| `projectsApi.restore()` | `POST /projects/:id/restore` | 清 deletedAt 或 shelved→planning | ✅ |
| `projectsApi.unshelve()` | `POST /projects/:id/unshelve` | shelved→planning | ✅ |
| `projectsApi.moveToDraft()` | `POST /projects/:id/move-to-draft` | 已废弃 | ❌ |
| `projectsApi.getShelved()` | 过滤 `status='shelved'` | 遗留过滤 | 🟡 |
| `proposalsApi.evaluate(id, 'reject')` | `POST /proposals/:id/evaluate` | 写 Proposal rejected | 🔴 |
| `proposalsApi.evaluate(id, 'shelve')` | `POST /proposals/:id/evaluate` | 写 Proposal shelved | 🔴 |

### 5.3 后端端点

| 端点 | 状态 | 行为 |
|------|:--:|------|
| `POST /projects/:id/shelve` | 🟡 旧路径 | 写 `status='shelved'` + `_shelved` metadata |
| `POST /projects/:id/soft-shelve` | ⚠️ **伪装新路径** | **也写 `status='shelved'`**，不写 deletedAt |
| `POST /projects/:id/soft-delete` | ✅ 0608 | 写 `deletedAt`，不改 status |
| `POST /projects/:id/restore` | ✅ | 清 deletedAt，或 shelved→planning |
| `POST /projects/:id/unshelve` | ✅ | shelved→planning |
| `POST /projects/:id/move-to-draft` | ❌ 废弃 | Deprecated header，返回 410 |
| `POST /proposals/:id/reject` | 🔴 | 直接 reject |
| `POST /proposals/:id/evaluate` | 🔴 | 含 reject/shelve action |

### 5.4 ⚠️ 严重发现：`softShelve` 名不副实

前端 4 个部门 action（PlanningActions / StudioActions / EditorialActions / LibraryActions）的注释声称 `softShelve` 是 "deletedAt 语义，非旧 shelve 状态"，但后端 `POST /projects/:id/soft-shelve` **实际写入的是 `status='shelved'`，完全不碰 `deletedAt`**。

```typescript
// 后端 projects.ts L934 — soft-shelve 的实际行为：
data: {
  status: 'shelved',  // ← 写的是 shelved 状态，不是 deletedAt！
  metadata: { _shelved: { ... } }
}
```

而真正的 0608 合规端点 `soft-delete`（写 `deletedAt`，不改 status）只在 `LibraryDetailPage` 和 `ReviewDetailPage` 中使用。

**结论：4 个部门 action 组件的"放入文件暂存"按钮实际走的仍是旧 shelve 路径。**

### 5.5 数据状态

| 枚举 | 位置 | 状态 |
|------|------|------|
| `shelved` | `PROJECT_STATUS_PRIMARY` | ⚠️ 仍在主枚举中 |
| `shelved` | `PROPOSAL_STATUSES` | ⚠️ 仍在使用 |
| `rejected` | `PROPOSAL_STATUSES` | ⚠️ 仍在使用 |
| `deletedAt` | Project 字段 | ✅ 0608 推荐机制 |

### 5.6 风险汇总

| 风险 | 等级 | 说明 |
|------|:--:|------|
| 用户仍可点击 reject 按钮 | 🔴 高 | `PlanningProposal` reject 按钮仍在主线 UI |
| 用户仍可点击 shelve 按钮 | 🔴 高 | `ProjectCard` / `PlanningProposal` / `ProposalDetailPage` |
| 部门 action 的暂存走旧路径 | 🔴 高 | `softShelve` 写 shelved 而非 deletedAt |
| `ShelfPage` 依赖 shelved 状态 | 🟡 中 | 迁移需先有 deletedAt-based 替代页面 |
| `shelved` 在状态枚举中 | 🟡 中 | 移除前需确认无写入路径 |

### 5.7 推荐治理顺序

```
P2-2a（本轮完成）:
  ✅ shelve/reject 全量审计完成
  ✅ softShelve 名不副实问题发现

P2-2b（下一轮 — 低风险 UI 屏蔽）:
  □ 屏蔽 PlanningProposal "退回" 按钮（reject 用户路径）
  □ 屏蔽 ProjectCard "移入暂存" 按钮（shelve 用户路径）
  □ 屏蔽 ProposalDetailPage "暂存" 操作

P2-2c（API 层治理）:
  □ 4 个部门 action 的 softShelve → softDelete 替换
  □ 确认后端 soft-delete 行为正确后完成切换

P2-2d（后端清理）:
  □ 废弃 POST /projects/:id/shelve（旧路径已有 soft-shelve 替代）
  □ 废弃 POST /proposals/:id/reject
  □ shelved 从 PRIMARY 枚举移入 LEGACY_READ
  □ ShelfPage 迁移为 deletedAt-based 视图
```

---

## §3 分类汇总

| 类别 | 数量 | 明细 |
|------|:---:|------|
| 🔧 已修正 | 6 | R01~R06 |
| 🟡 adapter 包装 | 4 | R07~R10 |
| 🔴 数据迁移 | 3 | R11~R13 |
| 🧊 冻结 AI | 4 | R14~R17 |
| 🔴 暂缓高风险 | 4 | R18~R21 |
| **合计** | **21** | |

---

## §4 后续治理顺序

```
P0（本轮已完成）:
  ✅ UI 文案修正：章节管理→作品章节，进入编辑器→进入作品详情，
     章节规划→作品章节（toast/标题）

P1（下一轮）:
  □ PROJECT_STATUS_LABEL 替换为 getProjectStatusLabel(status, phase)
  □ 前端 genre 字段删除
  □ description vs metadata.synopsis 后端统一方案设计

P2:
  ✅ P2-1: StageTransitionModal 审计 + 删除
  ✅ P2-2a: shelve/reject 全量审计
  ✅ P2-2b: UI 屏蔽 reject + shelve 用户路径
  ✅ P2-2c: softShelve → softDelete 替换
  □ P2-2d: 后端 shelve/reject 端点废弃
  ✅ Task 1: ChapterPlanningEditor → WorkChapterEditor 重命名
  ✅ Task 2: work.synopsis 写入统一
  ✅ Task 3: Project → Work 别名审计（见 §6）

P3（远期）:
  □ masterPrompt 字段清理
  □ /api/v2/ai/* 路由移除或重写为 0608 对齐版
  □ Project model 重命名为 Work（数据库迁移）
```

---

## §6 P3 前置审计：Project → Work 别名迁移（Task 3）

### 6.1 现状

前端 23 个非 AI 文件仍以 `Project` 作为类型名/变量名。按迁移风险分为三层。

### 6.2 P0 — 已就绪，可立即迁移

| 文件 | 当前语义 | 迁移动作 |
|------|---------|---------|
| `WorkDetailPage.tsx` | 已用 `work` 变量 | ✅ 已完成 |
| `WorkChapterEditor.tsx` | 组件名已改 | ✅ 已完成 |
| `PlanningActions.tsx` | 列表页 action | 变量 `project` → `work` |
| `StudioActions.tsx` | 列表页 action | 变量 `project` → `work` |
| `EditorialActions.tsx` | 列表页 action | 变量 `project` → `work` |
| `LibraryActions.tsx` | 列表页 action | 变量 `project` → `work` |
| `GraveyardActions.tsx` | 列表页 action | 变量 `project` → `work` |
| `EditorialPage.tsx` | 部门列表页 | 变量 `project` → `work` |
| `LibraryPage.tsx` | 部门列表页 | 变量 `project` → `work` |
| `LibraryDetailPage.tsx` | 文集详情页 | 变量 `project` → `work` |
| `ReviewDetailPage.tsx` | 审阅详情页 | 变量 `project` → `work` |
| `WritingEditorPage.tsx` | 写作编辑器 | 变量 `project` → `work` |

### 6.3 P1 — 需 adapter 层

| 文件 | 原因 | 建议 |
|------|------|------|
| `api.ts` `Project` 接口 | 后端返回类型 | 新增 `type Work = Project` 别名；函数签名不变 |
| `api.ts` `projectsApi` | API 调用集合 | 保留函数名；新增 `worksApi = projectsApi` alias |
| `api.ts` `WorkDetailResponse.project` | 返回 key | 新增 `.work` getter |

### 6.4 P2 — 需暂缓（后端耦合）

| 文件 | 原因 |
|------|------|
| `ChapterManager.tsx` | prop 名 `projectId` 来自后端 |
| `KanbanBoard.tsx` | 看板组件，依赖 Project 类型 |
| `ProjectManagementPanel.tsx` | 文件名含 Project |
| `ProjectMetadataPanel.tsx` | 同上 |
| `CreateProjectModal.tsx` | 创建作品模态框，调用 `projectsApi.create` |
| `dashboard.ts` | 仪表盘数据聚合，调用 `projectsApi.getAll` |
| `ShelfPage.tsx` | 暂存池页面，依赖 shelved 状态 |
| `ScrapsPage.tsx` / `ScrapFormModal.tsx` | 灵感碎片，关联 projectId |

### 6.5 推荐 P0 实施顺序

```
1. api.ts 新增 type Work = Project
2. api.ts 新增 export const worksApi = projectsApi
3. 6 个 department action 组件 project → work 变量重命名
4. 4 个部门列表/详情页 project → work 变量重命名
5. 不改任何函数签名、API 路径、props 名称
```

```
npx tsc --noEmit   ✅ 零错误
npx vite build     ✅ 通过（所有产物正常）
```

---

## §6 记录

| 时间 | 事件 |
|------|------|
| 2026-06-11 | Audit v1。21 项残留，6 项已修正。 |
