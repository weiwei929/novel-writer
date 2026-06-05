# M1-B 前端 Modal 拆解（TASK-203 产出 · M1-A 不实现）

> **范围**：M1-B（TASK-205~209）  
> **禁止**：M1-A 不得修改 `frontend/src/**` 实现本表

## 4 专用 Modal（C-14）

| 旧 `StageTransitionModal` 场景 | 新组件 | 后端端点 | 替换的前端调用 |
|-------------------------------|--------|----------|----------------|
| 企划课 · 立项评估（节点 #1） | `ProposalEvaluateModal` | `POST /proposals/:id/accept-into-planning`、`POST .../reject` | 移除 `PUT .../evaluate` |
| 企划课 · 正式立项（节点 #2） | `ConfirmGreenlightModal` | `POST /projects/:id/confirm-greenlight` | 移除 `transition` planning→planned |
| 创作室 · 提交审阅（节点 #3） | `SubmitReviewModal` | `POST /projects/:id/submit-review` | 移除 `transition` written→reviewing |
| 编审部 · 文集入库（节点 #4） | `ArchiveModal` | `POST /projects/:id/archive`（TASK-208 定稿） | 移除 `transition` reviewed→archived |

## UI 接线（M1-B 205~209）

| 页面/组件 | 改动 |
|-----------|------|
| `WorkDetailPage.tsx` | 拆 `StageTransitionModal`；按 status 渲染上表 4 Modal；`api.transition()` 改语义 POST |
| `PlanningProposal.tsx` / 企划 Tab② | `ProposalEvaluateModal`；`approved` 徽章（C-21） |
| `WorkDetailPage.tsx` | 「查看原提案」`proposalId` 链接（C-20） |
| `api.ts` | **TASK-203 不碰**；M1-B 统一 11 值 + 废弃 `transition()` |
| `ShelfPage.tsx` | `soft-shelve` / `unshelve` / `restore` 分支文案对齐 |

## 服务端硬拒后的前端兜底

- `transition` 返回 400 `CROSS_STAGE_FORBIDDEN` → Toast 指向对应语义按钮（见 TASK-202.md §0）
- `written` 撤销完成**仅** `POST /projects/:id/undo-written`；**禁止**再提示走 transition
- `transition` 响应含 `Deprecation: true` + `Warning: 299` — M1-B 逐步移除 `StageTransitionModal` 调用

**C-20 / C-21**（M1 验收必做）：在 `PlanningProposal.tsx` / 企划课 Tab② / `WorkDetailPage.tsx` 加链接与 `approved` 徽章，不经过上表 Modal。
