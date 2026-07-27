# TASK-700-E: 创意组入口清理（路由改名 + 删除 ChatPage）

> **状态**：⏳ 待授权 · 创建 2026-07-27 · **二选一已由司令官定死 2026-07-27**  
> **模式**：小卡 · 路由/死页清理  
> **上游**：TASK-700 拍板 A 经 [700-A 侦察](./TASK-700-A-cursor-scout.md) **推翻「必须新建」**  
> **操作员**：Cursor IDE  
> **基线**：`feature/workdetail-p1`

---

## 背景

`/creative/chat` 实际挂载 `CreativeWorkspace`，`ChatPage.tsx` 为零引用死文件。名实错位已实际误导过对齐判断。本卡只做清理，**禁止新建总览页**。

## 假设（已声明 · 已定死）

1. **路由改名**：主入口改为 `/creative/workspace`，渲染现有 `CreativeWorkspace`。  
2. **旧路径兼容**：`/creative/chat` → `Navigate` 到 `/creative/workspace`（`replace`），避免书签/外链断裂。  
3. **`/creative` 与 `/creative/`**：重定向到 `/creative/workspace`（若当前仍指 chat，一并改）。  
4. **`ChatPage.tsx`：直接删除**，不留注释版。  
5. 全前端凡链到 `/creative/chat` 的「返回创意组」等，改为 `/creative/workspace`（同卡内改完，避免半截）。  
6. `AiSearchPage` 属 AI 冻结，本卡不删。  
7. 不在本卡加「创思研发」新 UI。

## 范围

**可改：**

- `frontend/src/App.tsx`  
- `frontend/src/components/Layout.tsx`（`to` + 若有误导 label）  
- `frontend/src/pages/CreativePage.tsx`（若负责 `/creative` 重定向）  
- 所有仍写死 `/creative/chat` 的前端源文件（`rg` 扫出的链接）  
- **删除** `frontend/src/pages/creative/ChatPage.tsx`

## 不做什么

- **不新建**总览页、不复制 Workspace  
- 不改 `CreativeWorkspace` 业务逻辑  
- 不改提案/立项/企划流  
- 不删 `EvaluationPage` / `MetadataPage`  
- 不动 AI 解冻

## 操作步骤

1. `rg "/creative/chat|ChatPage" frontend/src` 列出全部命中。  
2. `App.tsx`：新增/改 `workspace` 路由 → `CreativeWorkspace`；`chat` 改为 `<Navigate to="/creative/workspace" replace />`；默认 `/creative` 指向 workspace。  
3. 批量替换导航与「返回创意组」链接为 `/creative/workspace`。  
4. 删除 `ChatPage.tsx`。  
5. `frontend` lint + build 通过。

## 预期结果

- 侧栏进创意组落到 `/creative/workspace`，内容仍为 Workspace。  
- `/creative/chat` 自动跳到 workspace。  
- 仓库无 `ChatPage.tsx`。

## 验证方法（必须可执行）

```powershell
cd D:\workspace\content\docs\novel-writer
rg -n "ChatPage|/creative/chat|/creative/workspace" frontend/src

# 预期：
# - 无 ChatPage.tsx 文件；无 import ChatPage
# - Layout / 返回链接使用 /creative/workspace
# - /creative/chat 仅作为 Navigate 源（若保留兼容）

cd frontend
npm run lint
npm run build
```

## 回滚方案

```powershell
git checkout HEAD -- frontend/src/App.tsx frontend/src/components/Layout.tsx frontend/src/pages/CreativePage.tsx
git checkout HEAD -- frontend/src/pages/creative/ChatPage.tsx
# 其它被改的链接文件一并 checkout
```

无 DB 变更。

## 回报格式

- 做了什么
- 改了哪些文件
- 如何验证
- 还剩什么
- 风险或阻塞
