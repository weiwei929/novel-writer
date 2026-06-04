# Day 1 设计审阅 — v4.1 落库说明

> **日期**：2026-06-04  
> **动作**：将 Claude Day 1 锁定稿 + Cursor 冷评修订合入仓库  
> **权威源**：`docs/design/overall-architecture.md` v4.1

---

## v4.1 相对 v4 / 仓库 v3 的修订

| 修订点 | 落库处理 |
|--------|----------|
| `shelved` 仅主动暂存；通过 → `approved` | §0 + §4.4 已统一（原 §4.4 误写 shelved 已改） |
| `accept-into-planning` / `confirm-greenlight` | §0 API 表 |
| 节点 #2 退回 → planning in-progress | §二 + §4.5 |
| Chapter 仅 draft/writing/completed | §0 |
| 正式立项 → `planned`（非 `draft`） | §4.5 已改 |
| L2「立项总账」命名 | §一 ASCII 图已改 |
| 实现文件名 | §5.6 → `WorkDetailPage.tsx` |

## 新增文档

- `docs/design/v2-migration-map.md` — D1~D4 + Proposal/Project 映射 + M1 阻塞说明
- `docs/design/code-conflict-analysis.md` — 升至 C-01~C-18 + 10 步 + M1/M2/M3

## 落库时未改的设计债（留 Day 2/3）

- §6.3 编审「退回修改 → 创作室」与「跨阶段不退回」需在编审部专稿中拆语义（本阶段 `reviewed → reviewing` vs 批注回流）
- 创意组 L2 仍写「灵感碎片」；VPS UI 为「灵感手记」— 实现以代码为准（D1 适配）

## 发卡门禁

1. 评审 `v2-migration-map.md` §3 Proposal、§4 Project  
2. **再发** TASK-200（M1 only）
