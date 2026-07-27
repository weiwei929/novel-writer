# TASK-700-C: ReviewDetail「标记已审」接真实流转

> **状态**：✅ 已完成 · 授权并执行 2026-07-27  
> **执行备注**：成功后导航回 `/editorial`（步骤 4 已定死）  
> **模式**：小卡 · 前端单点修复  
> **上游**：[TASK-700](./TASK-700-v2.7.27-pipeline-completion.md) · [TASK-700-A 侦察](./TASK-700-A-cursor-scout.md)  
> **操作员**：Cursor IDE  
> **基线**：`feature/workdetail-p1`  
> **建议顺序**：可与 700-B 并行；不依赖 700-D

---

## 背景

`ReviewDetailPage` 的「标记已审」当前为：

```ts
notifyInfo('标记已审', '审阅状态流转将在后续版本接入。')
```

编审列表页已能 `transition(id, 'reviewed')`（桶内，实测 200）。详情页是假实现，卡全链路人工验收。

## 假设（已声明）

1. 详情页「标记已审」= 列表「确认审阅完成」= `projectsApi.transition(id, 'reviewed')`（现状唯一可用的桶内路径）。  
   - **不**在本卡新增 `mark-reviewed` 语义端点（留给立宪对齐阶段）。
2. 仅当 `project.status === 'reviewing'` 时可点；其它状态按钮禁用或隐藏。
3. `AI_UI_FROZEN` 的「生成报告」保持冻结提示，本卡不动。
4. 成功后 **导航回 `/editorial`**（已定：与「放入文件暂存」成功后一致；不原地刷新）。

## 范围

**只改：**

- `frontend/src/pages/ReviewDetailPage.tsx`

## 不做什么

- 不改 `EditorialPage` 列表动作
- 不改后端 `transition` / 不新增路由
- 不做创作手记、不改 AI 冻结入口
- 不删 `EditorialActions` 死组件（另卡）
- 不改 `release-to-library` / archive

## 操作步骤

1. 将 `handleMarkReviewed` 改为调用 `projectsApi.transition(project.id, 'reviewed')`（需 `project` 非空）。
2. 加 loading / disabled，避免连点。
3. 成功：`notifySuccess`；失败：`notifyError`（展示错误信息）。
4. 成功后导航回 `/editorial`（或刷新后若 status 已变则禁用按钮——实现时选一种并在回报里写明）。
5. 确认「生成报告」仍走冻结分支。

## 预期结果

- `reviewing` 作品在详情页点「标记已审」→ status 变为 `reviewed`。
- 不再弹出「将在后续版本接入」。
- 列表「确认审阅完成」行为不变。

## 验证方法（必须可执行）

```powershell
cd D:\workspace\content\docs\novel-writer
rg -n "标记已审|handleMarkReviewed|transition|后续版本接入" frontend/src/pages/ReviewDetailPage.tsx
# 预期：无「后续版本接入」；有 transition(..., 'reviewed')

cd backend
npm run lint
npm test
```

运行时探针（dev server + 已登录 session）：

```text
前置：某作品 status=reviewing（可用列表「开始审阅」产生）
POST /api/v2/projects/:id/transition  body: {"to":"reviewed"}
→ 200，Deprecation 头可忽略；data.status === "reviewed"
```

UI：打开 `/review/:id` → 标记已审 → 编审「已完成」列可见该作（且未 `release-to-library` 前）。

## 回滚方案

```powershell
git checkout HEAD -- frontend/src/pages/ReviewDetailPage.tsx
# 或 git revert <commit>
```

无 schema / 无数据迁移；回滚即恢复假提示。

## 回报格式

- 做了什么
- 改了哪些文件
- 如何验证
- 还剩什么
- 风险或阻塞
