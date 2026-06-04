# Day 1 — VPS v2-dev 代码索引（2026-06-03 修正版）

> `day1-design.md` §13 中部分路径/行号已过时。实现与侦察以**本文件**为准。  
> 分支：`v2-dev` | 创意组：TASK-101/102 已交付 | 生产：`novel.pf2008.com`（Caddy→dist，API :5000）

## 后端

| 路径 | 说明 |
|------|------|
| `backend/prisma/schema.prisma` | Project 7 状态；Proposal 已存在（含 metadata/references） |
| `backend/src/routes/projects.ts` | **~816 行**（非 655）；含 `transition`、`shelve`、`import` |
| `backend/src/routes/proposals.ts` | 创意组 evaluate/approve；approve 创建 `Project(draft)` |
| `backend/src/routes/chapters.ts` | Chapter status: `draft/writing/completed` |
| `backend/src/routes/scraps.ts` | 灵感手记 API |
| `backend/src/routes/fileReferences.ts` | 外来参考 API |
| `backend/src/types/metadata.ts:14` | `writingStyle` 仍在 metadata JSON |
| `backend/src/services/status-migration.ts` | 读时映射 `imported→draft` 等 |

## 前端

| 路径 | 说明 |
|------|------|
| `frontend/src/services/api.ts` | `PROJECT_STATUSES` 7 值；`proposalsApi` |
| `frontend/src/components/Layout.tsx` | 五阶段 L1 + 创意组/企划课 sub |
| `frontend/src/App.tsx` | 路由；`AuthGuard` 包在路由树内 |
| `frontend/src/pages/WorkDetailPage.tsx` | **作品详情页**（非 ProjectDetailPage） |
| `frontend/src/pages/WritingEditorPage.tsx` | **编辑器**（非 EnhancedEditorPage）；四模式 pure/ai/reference/review |
| `frontend/src/components/projects/StageTransitionModal.tsx` | 含跨阶段「回退」 |
| `frontend/src/pages/ShelfPage.tsx` | `/shelf` 作品暂存（Day 1 拟由墓园替代） |
| `frontend/src/components/creative/*` | 创意组 4 Tab（TASK-101/102） |
| `frontend/src/components/auth/AuthGuard.tsx` | 路由内复检 + 401 事件（热修后） |

## 设计文档 vs 代码：已知差异

| 设计假设 | VPS 实况 |
|----------|----------|
| 新建 Proposal 模型 | **已存在**，需扩展非重建 |
| ProjectDetailPage | → `WorkDetailPage.tsx` |
| EnhancedEditorPage | → `WritingEditorPage.tsx` |
| 8 旧导航 | 已是五阶段；缺墓园 L1 |
| 创意组 Proposal 流 | `draft/submitted` + `metadata._discussionSubmitted`，与 Day 1 `creating/created` 待映射 |

## 相关文档

- `docs/design/day1-design.md`
- `docs/design/code-conflict-analysis.md`
- `docs/plan/DAY1-DESIGN-REVIEW-2026-06-03.md`
- `docs/tasks/CURSOR_REFERENCE.md` §十一 VPS 开发规范
