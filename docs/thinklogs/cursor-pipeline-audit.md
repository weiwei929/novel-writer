# 五阶段隔离审计 + "继续测试"流转实证分析

> 场景：用户实测发现 pipeline 断裂 — 创意组提交提案后直接跳到"已立项"
> 任务：后端日志追溯 + 全链路前端后端对齐扫描

---

## 任务 1：从后端日志追溯"继续测试"

查找 VPS 后端日志（`pm2 logs novel-writer-backend --lines 200` 或 journal），定位 `projectId` / `proposalId`，重建完整流转链：

**关键证据链**：
1. 查找 "继续测试" 相关的所有请求（proposal create, proposal update, project create, status transitions）
2. 重建时间线：创建提案 → 提交 → 评估 → 立项 → greenlight
3. 确认：是否存在跳步（例如提案提交后直接调用了 `accept-into-planning` + `confirmGreenlight` 两步连发）

**重点检查**：
- `POST /proposals` — 创建提案
- `PUT /proposals/:id` — 更新提案（含 status 变更）
- `POST /proposals/:id/accept-into-planning` — 进入企划课
- `POST /projects/:id/confirm-greenlight` — 正式立项（planning → planned）
- `POST /projects/:id/start-writing` — 开始写作（planned → writing）

如果日志找不到 "继续测试"，直接查数据库：
```sql
-- 查找最近创建的 proposals
SELECT id, title, status, "projectId", "createdAt" FROM "Proposal" ORDER BY "createdAt" DESC LIMIT 10;
-- 查找最近创建的 projects
SELECT id, title, status, "createdAt" FROM "Project" ORDER BY "createdAt" DESC LIMIT 10;
```

---

## 任务 2：五阶段完整流转对照检查

### 设计期望的流转

```
创意组(ideation)         企划课(planning)       创作室(studio)        编审部(editorial)     文集库(library)
Proposal                    Project                Project               Project               Project

creating                  planning              planned                reviewing             archived
  ↓ (submit)                ↓ (greenlight)        ↓ (start-writing)      ↓ (review)
created                   planned               writing                reviewed
  ↓ (approve↓                                    ↓ (mark-written)        ↓ (archive
  accept-into-planning)                          written                → archived
                             ↓ (submit-review)
                             reviewing
```

### 检查清单

#### A. 创意组 → 企划课 边界
| 检查项 | 位置 | 预期 |
|--------|------|------|
| 提案提交后 status 是什么？ | `CreativeDiscussion.tsx:160` | 当前设 `'draft'`，但 `status-migration.ts:18` 把 `draft` 映射为 `creating` — **这是否正确？** |
| 提案"提交"按钮到底调什么 API？ | `CreativeDiscussion.tsx:150` 全路径 | 检查是否误调了 approve/accept-into-planning |
| 提交后导航到哪里？ | `CreativeDiscussion.tsx:163` `await load()` | 是否跳转到企划课页面？ |
| 企划建议书列表页（ProposalReviewPage）显示哪些状态？ | `ProposalReviewPage.tsx:29` | 预期 `status !== 'draft'` → 但已提交的提案 status 是 `'draft'`（映射为 `creating`），**是不是永远看不到？** |
| 企划课"通过立项"按钮调什么 API？ | `ProposalEvalPage.tsx:63` `proposalsApi.approve(id)` | 后端 `/proposals/:id/approve` 创建 Project 设 status `'planning'` ✅ |
| 但前端 navigate 到哪里？ | `ProposalEvalPage.tsx:69` | `/work/:projectId?from=planning` — 正确 ✅ |

#### B. 企划课内部
| 检查项 | 位置 | 预期 |
|--------|------|------|
| 立项总账页面显示哪些 project？ | `PlanningProjectsPage.tsx` | 预期 `status === 'planned'`（已 greenlit） |
| "正式立项"按钮（confirmGreenlight）是否可用？ | `WorkDetailPage.tsx` | 只在 `status === 'planning'` 时显示 |
| 从 planning → planned 的端点是否正常？ | `backend routes/projects.ts` | `POST /projects/:id/confirm-greenlight` |

#### C. 状态映射 (status-migration.ts)
| 检查项 | 问题 |
|--------|------|
| `draft → planning` 映射（`:13`）| 1.0 的 `draft` project status 映射到 `planning`。是否还有 1.0 残留的 Project 使用 `draft` status？ |
| Proposal `draft → creating` 映射（`:18`）| CreativeDiscussion 提交时设 status `'draft'`，映射后前台看到 `creating`。是否符合 2.0 设计？ |
| 提案完整状态机 | creating → submitted → evaluated → approved 还是 creating → created → approved？ |

#### D. 前端路由完整性
| 路由 | 对应页面 | 阶段 | 状态 |
|------|---------|------|------|
| `/creative/proposals` | ProposalListView | 创意组 — 企划建议书 | ✅ |
| `/planning/proposals` | ProposalReviewPage | 企划课 — 企划建议书评估 | ✅ |
| `/planning/projects` | PlanningProjectsPage | 企划课 — 立项总账 | ✅ |
| `/writing/projects` | WritingProjectsPage | 创作室 — 创作中作品 | ✅ |
| `/work/:id` | WorkDetailPage | 跨阶段详情 | ✅ |
| **创意组 → 提交后 → 去哪里？** | **？？？** | **提交后跳转缺失？** | **⚠️ 疑点** |

---

## 重点怀疑

**怀疑 1：提案提交后 status 设为 `draft` 不对**
- `CreativeDiscussion.tsx:160` 提交时 `status: 'draft'`
- `ProposalReviewPage.tsx:29` 企划课只看 `status !== 'draft'`
- **结论：提案提交后，企划课永远看不到它！** 这是 pipeline 断裂的根因之一

**怀疑 2：Proposal 状态机只有 5 态，缺少 `submitted`→ 显示**
- `PROPOSAL_STATUSES = ['draft', 'submitted', 'evaluated', 'approved', 'rejected', 'shelved']`
- 但前端 `status-migration.ts` 把 `submitted` 映射为 `created`
- 提案提交设 `draft`（映射为 `creating`） → 企划课过滤 `!== draft` → 排除
- 即使提案进入企划课，前端 `ProposalStatusBadge` 显示的是"构思中"而非"待评估"

**怀疑 3：`accept-into-planning` 可能被误触发**
- 检查是否有按钮/流程在"提交企划建议书"时无意中调了 `accept-into-planning`
- 检查 `PlanningProposal.tsx:70` `submitToReview` 是否被误调用

**怀疑 4：status-migration 的 `draft → planning` 映射**
- `PROJECT_STATUS_MAP.draft = 'planning'` — 是否有 1.0 遗留的 Project 使用 `draft` status？
- 如果有，这些 Project 在前端显示为 `planning`，看起来像是"已进入企划课"但实际未经过正常流程

---

## 报告格式

```
## 日志实证
[时间线重建]

## 问题清单
P0: [最严重]
P1: [次严重]
P2: [改进项]

## 根因总结
[一句话总结 pipeline 断裂的原因]
```
