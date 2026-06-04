# Day 1 设计方案 — 执行端审阅（2026-06-03）

> 读者：Claude（设计/出卡）+ 用户  
> 对照：`docs/design/day1-design.md` + VPS `v2-dev` 实况  
> 侦察基线：2026-06-03 Cursor 侦察 + 代码 walkthrough

---

## 总评

**权力模型与四节点三选一方向正确**，能修复 v2「到处改状态、跨阶段回退」的结构性问题。

**文档与 VPS 已交付创意组（TASK-101/102）接缝不足**；§8.2/C-02 按「新建 Proposal」写，而 schema 已有完整 Proposal + 创意讨论流。

**设计内部存在 shelved 语义 overload、greenlit 一词两用、流转图跳过创意组** 等矛盾，发卡前建议修文档而非留给实现脑补。

---

## 设计内部矛盾（须设计层先修）

| 问题 | 说明 |
|------|------|
| shelved 三义 | Project 状态 / Proposal「通过」/ 旧 `/shelf` 暂存 — 须词典统一 |
| 创意组未入流转图 | §3 从 imported→planning，与 §1 creating/created 及已交付 Tab 脱节 |
| Tab②「通过→Proposal.shelved」 | 与墓园/暂存心智冲突；建议 approved/transferred |
| greenlit 双端点 | proposals vs projects 同名，API 易混 |
| 节点#2「退回→planning」 | planning 既是阶段又是节点，语义不清 |

---

## §10 冲突表修正

| 编号 | 设计说法 | VPS 实况 |
|------|----------|----------|
| C-02 | 缺 Proposal | ❌ 已存在，应「扩展」 |
| C-09/10 | ProjectDetailPage / EnhancedEditorPage | ❌ → WorkDetailPage / WritingEditorPage |
| C-04 | projects.ts 655 行 | ⚠️ ~816 行 |
| C-13 | AuthGuard 阻塞 | ⚠️ 热修后降级 |
| — | 未列 | C-14~19：创意组双轨、dashboard、approve→draft、shelf/墓园 |

---

## 落地建议

1. **第 0 步**：《已交付资产映射表》再发 TASK-200  
2. **M1**：schema + 企划 Tab②③ + 禁跨阶段回退  
3. **M2**：创作室三栏 + 编辑器 pure  
4. **M3**：墓园 + 立项总账 + 废 `/shelf`（同一里程碑）

**估卡**：Phase 1a 10~12 张，1b 8~10 张；不宜一次 22 张。

---

## 待决策（比 C-05 更急）

| ID | 问题 | 倾向 |
|----|------|------|
| D1 | TASK-101/102 重写 vs 适配？ | 适配优先 |
| D2 | 旧 Proposal 状态如何映射 creating/created？ | 需 SQL 映射表 |
| D3 | `/shelf` vs 墓园 | 替换 |
| D4 | 企划 Tab② vs 创意组「企划建议书 Tab」 | 定单/双入口 |

---

## VPS 部署提醒

- 迁移针对 SQLite `dev.db`；发版后 hard refresh  
- 验收只用 **dist + npm start**，不用 Vite 反代混测  
- 见 `CURSOR_REFERENCE.md` §十一

---

## 一句话

Day 1 设计在权力边界上成熟，在**与已交付创意组的接缝**和**冲突表时效**上不成熟；先补映射表与 shelved 语义，再发 TASK-200。
