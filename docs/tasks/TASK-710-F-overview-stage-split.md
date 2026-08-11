# TASK-710-F: 总览分段（缘起与构思分列）

> **状态**：⚡ 执行中 · 创建 2026-08-03
> **模式**：小卡 · 纯前端 UI · **无 Schema 变更**
> **架构师**：Claude（参谋长）
> **操作员**：Antigravity Agent
> **上游**：[TASK-710](./TASK-710-creative-seed-chain.md) 序 5
> **基线**：710-A / 710-B / 710-D / 710-C / 710-E 之后

---

## 背景

在创意组总览页面 `CreativeWorkspace.tsx` 中，“作品构思中”列表中既有处于初始“灵感缘起”阶段的提案，也有已进入“创意构思”精细化阶段的提案。为了提高区分度与视觉引导，需在列表中按阶段分段列出。

---

## 范围

### 可改文件

| 路径 | 动作 |
|---|---|
| `frontend/src/components/creative/CreativeWorkspace.tsx` | 中列按 `origin` 与 `conceiving` 阶段分段展示构思中作品 |

---

## 操作步骤

1. 在 `CreativeWorkspace.tsx` 中使用 `getCreativeStage(meta)` 将草稿提案划分为 `originList`（灵感缘起初始）与 `conceivingList`（构思深化中）。
2. 在中列面板中展示两级区分分组，清晰标注状态和操作提示。

---

## 验证计划

1. `npm run test` (backend)：后端测试全绿。
2. `npm run lint` (backend & frontend)：代码检查通过。
3. `npm run build` (frontend)：打包编译通过。
