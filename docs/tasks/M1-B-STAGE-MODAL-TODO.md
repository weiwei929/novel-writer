# M1-B 前端 Modal 拆解（TASK-203 产出 · 本里程碑不实现）

> **范围**：M1-B（TASK-205~209）或 M2 首批 UI 卡  
> **禁止**：M1-A 不得修改 `frontend/src/**` 实现本表

| 旧 `StageTransitionModal` 场景 | 新组件（建议名） | 后端端点 |
|-------------------------------|------------------|----------|
| 企划课 · 立项评估（节点 #1） | `ProposalEvaluateModal` | `POST /proposals/:id/accept-into-planning`、`POST .../reject` |
| 企划课 · 正式立项（节点 #2） | `ConfirmGreenlightModal` | `POST /projects/:id/confirm-greenlight` |
| 创作室 · 提交审阅（节点 #3） | `SubmitReviewModal` | `POST /projects/:id/submit-review` |
| 编审部 · 文集入库（节点 #4） | `ArchiveModal` | `POST /projects/:id/archive`（端点名 TASK-208 定稿） |

**C-20 / C-21**（M1 验收必做）：在 `PlanningProposal.tsx` / 企划课 Tab② / `WorkDetailPage.tsx` 加链接与 `approved` 徽章，不经过上表 Modal。
