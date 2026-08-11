# TASK-710-E: 部门边界（接收动作归企划课）

> **状态**：⚡ 执行中 · 创建 2026-08-03
> **模式**：小卡 · 前端与路由隔离 · **无 Schema 变更**
> **架构师**：Claude（参谋长）
> **操作员**：Antigravity Agent
> **上游**：[TASK-710](./TASK-710-creative-seed-chain.md) 结论 3 · 0608 立宪原则
> **基线**：710-A / 710-B / 710-D / 710-C 之后

---

## 背景

按 0608 规范与五部门职责划分：
1. **创意组只有“提交”**：创作者在创意组（`/creative/*`）完善提案后，只能提交至企划课，不能自行触发“接收入企划课”。
2. **企划课才有“接收”**：接收/立项动作属于企划课（`/planning/*`）的审阅与接收入口。从企划课路由访问提案详情或在企划课列表中，才提供“接收入企划课”的操作。

---

## 范围

### 可改文件

| 路径 | 动作 |
|---|---|
| `frontend/src/pages/creative/ProposalDetailPage.tsx` | 根据路由上下文（`/planning/*` 还是 `/creative/*`）严格限定“接收入企划课”按钮仅在企划课路径呈现；创意组接入“提交至企划课”并引导跳转 |
| `frontend/src/components/proposals/ProposalStatusBadge.tsx` | 优化已提交状态提示文案（如需） |

---

## 操作步骤

1. **路由与权限识别**：在 `ProposalDetailPage.tsx` 中使用 `useLocation()` 检查是否为 `/planning/*` 路径或 `?from=planning`。
2. **限制接收动作**：
   - 创意组视图（`/creative/*`）：隐藏“接收入企划课”按钮。已提交提案展示“已提交企划课”状态面板与跳转引导。
   - 企划课视图（`/planning/*`）：展示“接收入企划课”按钮，并在点击接收后成功引导至企划课作品页面 (`/work/:projectId?from=planning`)。

---

## 验证计划

1. `npm run test` (backend)：通过所有单元测试。
2. `npm run lint` (backend & frontend)：类型检查零报错。
3. `npm run build` (frontend)：前端打包编译无 error。
