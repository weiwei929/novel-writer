# TASK-700-D: 作品详情补「提交编审」+ 删除 StudioActions 死组件

> **状态**：⏳ 待授权 · 2026-07-27 **退回重写**（原「submit-review 合一」版不予授权）  
> **模式**：小卡 · 前端补入口 + 删死文件  
> **上游**：TASK-700 拍板 **F**（缓冲区保留）· [TASK-700-A 侦察](./TASK-700-A-cursor-scout.md)  
> **操作员**：Cursor IDE  
> **基线**：`feature/workdetail-p1`  
> **建议顺序**：700-B 合入后再做（同改 `WorkDetailPage`，减少冲突）

---

## 背景

原 700-D 按 C=(1) 字面把创作室一键打进 `reviewing`，会掏空编审「待处理」缓冲区，与对齐后的 **F** 冲突，**已驳回**。

对齐结论：

- 创作室列表**现状正确**：已调 `releaseToEditorial`（只打 `_releasedToEditorialAt`，status 仍 `written`）。
- 开审由编审部点「开始审阅」→ `submitReview`。
- **缺的是**：作品详情页没有「提交编审」入口。
- `StudioActions.tsx` 调 `submitReview`，且**零引用**——错误样板，删掉以免再误导。

## 假设（已声明）

1. 详情页「提交编审」= `projectsApi.releaseToEditorial(id)`，与列表同语义；**不**调用 `submitReview`。  
2. 展示条件：`work.status === 'written' && !hasReleasedToEditorial(work)`；建议在 `from=writing`（创作室上下文）显示，与「开始创作」条同区或紧邻。  
3. 已放行则显示只读提示（类似企划放行成功态），不重复打戳（后端幂等亦可）。  
4. 后端 `submit-review` / `release-to-editorial` **本卡零改动**。  
5. 只删 `StudioActions.tsx`；其它 `*Actions` 死组件另卡。

## 范围

**可改：**

- `frontend/src/pages/WorkDetailPage.tsx` — 增加提交编审入口  
- `frontend/src/components/work/StudioActions.tsx` — **删除文件**

## 不做什么

- 不改 `WritingProjectsPage` 列表（已正确）  
- 不改后端任何路由  
- 不删编审「待处理」列、不改 `EditorialPage`  
- 不改 `submit-review` 语义  
- 不删 `EditorialActions` / `LibraryActions` / `PlanningActions`  
- 不做创作手记

## 操作步骤

1. `WorkDetailPage`：import `hasReleasedToEditorial`；新增 `handleReleaseToEditorial` → `releaseToEditorial` + 成功提示 + `load()`。  
2. 在创作室上下文、`written` 且未放行时渲染「提交编审部」按钮；已放行则短提示。  
3. 确认「开始创作」仍绑 `handleStartWriting`（700-B 的放行卡仍绑 confirm+release）。  
4. 删除 `StudioActions.tsx`；`rg StudioActions` 确认零引用后 `frontend` lint/build 通过。

## 预期结果

- 详情页可把 `written` 作品放行到编审「待处理」，与列表一致。  
- 仓库不再存在调 `submitReview` 的创作室死组件样板。

## 验证方法（必须可执行）

```powershell
cd D:\workspace\content\docs\novel-writer
rg -n "releaseToEditorial|hasReleasedToEditorial|提交编审" frontend/src/pages/WorkDetailPage.tsx
# 预期：有 releaseToEditorial 调用；无 submitReview

rg -n "StudioActions" frontend/src
# 预期：无命中（文件已删）

cd frontend
npm run lint
npm run build
```

运行时：`written` 作品在详情（`?from=writing`）点提交编审 → metadata 有 `_releasedToEditorialAt`，status 仍为 `written`，编审「待处理」可见。

## 回滚方案

```powershell
git checkout HEAD -- frontend/src/pages/WorkDetailPage.tsx
git checkout HEAD -- frontend/src/components/work/StudioActions.tsx
```

无 DB 变更。

## 回报格式

- 做了什么
- 改了哪些文件
- 如何验证
- 还剩什么
- 风险或阻塞
