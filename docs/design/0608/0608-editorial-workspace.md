# 0608-editorial-workspace.md — 编审部三工作区前端实现蓝图

> **文档角色**：编审部三工作区（待处理/进行中/已完成）的前端实现蓝图。
> **优先级**：P3 — 编审部阶段。
> **关系**：引用 `0608-dept-workspace-model.md` §2（编审部）、`0608-status-context-labeling.md` §3.3（编审部标签）、`0608-file-staging-pool.md` §2（UI 文案）。

---

## §1 编审部三工作区映射

| 0608 三工作区 | `Project.status` | 编审部上下文标签 |
|--------------|-----------------|-----------------|
| 待处理 | `written` | 待审阅作品 |
| 进行中 | `reviewing` | 审阅中作品 |
| 已完成 | `reviewed` | 已审阅作品 |

## §2 EditorialPage.tsx

P3-A ✅：`getAll()` + 三区 filter；`openWork` → `/work/:id?from=editorial`；`openReview` → `/editorial/:id`。

## §3 WorkDetailPage 编审部上下文（P3-A+）

- `isEditorialContext = from === 'editorial'`
- `written` + editorial →「开始审阅」→ `submitReview`
- `reviewing` + editorial →「确认审阅完成」+「进入审阅」
- `handleBack` → `/editorial`
- `stageManageButton` 排除 editorial 上下文

## §4 ReviewDetailPage（P3-B）

- `ProjectStatusBadge phase="editorial"`
- 「确认审阅完成」→ `markReviewed`
- AI 报告占位保留 Day 3

## §4.3 编审部端点映射（G4 已修正）

| 动作 | 端点 |
|------|------|
| 开始审阅 | `POST /projects/:id/submit-review` |
| 确认审阅完成 | `POST /projects/:id/mark-reviewed` |
| 确认创作完成 | `POST /projects/:id/mark-written` |

**不可**对跨桶转换使用 `transition`（`stage-guard` 会 `CROSS_STAGE_FORBIDDEN`）。

## §6 P3 执行顺序

- P3-A ✅ EditorialPage 三区
- P3-A+ WorkDetailPage + api wrappers + statusLabels G1 + G6
- P3-B ReviewDetailPage 整理
- P3-C Day 3 AI 集成
