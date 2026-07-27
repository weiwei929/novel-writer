# TASK-700-B: 修复 WorkDetail 企划放行错接线

> **状态**：✅ 已完成 · 授权并执行 2026-07-27  
> **模式**：小卡 · 前端单点修复  
> **上游**：[TASK-700](./TASK-700-v2.7.27-pipeline-completion.md) · [TASK-700-A 侦察](./TASK-700-A-cursor-scout.md)  
> **操作员**：Cursor IDE  
> **基线**：`feature/workdetail-p1` @ `11647b6`（或其后含 700-A 文档的 HEAD）

---

## 背景

侦察实测：`WorkDetailPage` 企划上下文中，按钮文案为「确认企划完成 · 提交创作室」，但 `onClick` 调用的是 `handleStartWriting()` → `POST /start-writing`。

该端点要求 `status === 'planned'`，而卡片仅在 `status === 'planning'` 时渲染 → **点击必 400**。

列表页 `PlanningPage` 已正确分步：`confirm-greenlight` → `release-to-studio`。详情页是真断点。

## 假设（已声明）

1. 按钮语义 = **一键完成两步**：`confirmGreenlight`（经 `confirmPlanningWithReadiness`）+ `releaseToStudio`。  
   - 不调用 `startWriting`（0608：放行 ≠ 开始写作）。
2. 放行成功后卡片因 `status` 变为 `planned` 且通常已有 `_releasedToStudioAt` 而离开「planning 未放行」态；用户从创作室列表「开始写作」。
3. 前端已有 `canReleaseToStudio` 门槛；后端 `confirm-greenlight` 有双保险。不改后端门槛。
4. AI 冻结相关不在本卡。

## 范围

**只改：**

- `frontend/src/pages/WorkDetailPage.tsx`

**可引用、不改实现：**

- `frontend/src/services/planningConfirm.ts`
- `frontend/src/services/api.ts`（已有 `confirmGreenlight` / `releaseToStudio`）
- `frontend/src/services/releaseHandoff.ts`

## 不做什么

- 不改 `PlanningPage` / `PlanningInProgressPage` 列表流
- 不改 `start-writing` 后端、不改创作室「开始写作」按钮（约 L350，仍走 `handleStartWriting`）
- 不做 submit/release 编审合一（见 700-D）
- 不新建创意组页面、不删 legacy 表、不动手记
- 不改路由、不改 API 契约

## 操作步骤

1. 在 `WorkDetailPage` 新增 `handleConfirmAndReleaseToStudio`（命名可调整）：
   - `assert`/`confirmPlanningWithReadiness(work)`
   - `projectsApi.releaseToStudio(work.id)`
   - 成功提示 + `load()` 刷新
   - 错误用现有 `notifyError`
2. 将企划放行卡按钮（文案「确认企划完成 · 提交创作室」）的 `onClick` 从 `handleStartWriting` 改为上述 handler。
3. **确认**创作室上下文「开始写作」按钮仍绑定 `handleStartWriting`，勿误改。
4. 本地手动点一次（或 API 等价）：`planning` + 设定齐全 → 按钮 → status=`planned` 且 `_releasedToStudioAt` 有值。

## 预期结果

- `planning` + gate.ready 时点击放行卡：200 级成功，作品进入「已放行待创作」。
- 不再出现 `Status "planning" not allowed; expected one of: planned`。
- `writing`/`planned` 下「开始写作 / 进入创作室」行为不变。

## 验证方法（必须可执行）

```powershell
# 1) 静态：放行卡不再引用 handleStartWriting
cd D:\workspace\content\docs\novel-writer
rg -n "确认企划完成|handleStartWriting|releaseToStudio|confirmPlanningWithReadiness" frontend/src/pages/WorkDetailPage.tsx

# 预期：放行卡 onClick 附近是 confirm/release；handleStartWriting 仍存在且仅服务「开始写作」

# 2) 后端 lint/test（本卡几乎不碰后端，作回归门禁）
cd backend
npm run lint
npm test

# 3) 运行时（需 dev server；用临时作品，标题勿用生产名）
# login → 准备 status=planning 且设定+章节齐全的作品 id=$ID
# POST /api/v2/projects/$ID/confirm-greenlight  → 200, status planned
# POST /api/v2/projects/$ID/release-to-studio   → 200, metadata._releasedToStudioAt 有值
# （UI 等价：详情页一键应依次完成这两步）
```

## 回滚方案

```powershell
cd D:\workspace\content\docs\novel-writer
git checkout HEAD -- frontend/src/pages/WorkDetailPage.tsx
# 若已 commit：git revert <该卡 commit>
```

回滚后行为回到「点击必 400」的旧态（已知坏），无数据迁移。

## 回报格式

- 做了什么
- 改了哪些文件（完整路径）
- 如何验证（贴命令输出摘要）
- 还剩什么
- 风险或阻塞
