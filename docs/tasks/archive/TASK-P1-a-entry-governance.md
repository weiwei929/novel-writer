# TASK-P1-a：入口治理 — dashboard 核验 + 创意组裸链

**状态**：**已合并**（PR [#7](https://github.com/weiwei929/novel-writer/pull/7) → `feature/workdetail-p1`）  
**基线**：`feature/workdetail-p1` @ `0fc0054`（616-B 封版后）  
**分支建议**：`feature/p1-a-entry-governance`（自 `feature/workdetail-p1` 切出）  
**设计依据**：根目录 `design-P1-entry-architecture.md`（§一待治理、原则 4/5；是否搬入 `docs/design/` 本卡裁定，非必须）

---

## 0. 只读核验（执行前必做，回报差异）

```bash
git branch --show-current && git log --oneline -1
rg '`/work/' frontend/src/services/dashboard.ts frontend/src/pages/HomePage.tsx
rg '`/work/' frontend/src/pages/creative/ frontend/src/components/creative/
rg '"/work/' frontend/src/pages/creative/ frontend/src/components/creative/
```

**起草时事实（`0447350` 后）**：

| 项 | 状态 |
|----|------|
| `dashboard.ts` → `/work/` | ✅ **已无**（`mapProjectItem` 链部门子页；activity 同） |
| `HomePage.tsx` → `/work/` | ✅ **已无** |
| `ProposalDetailPage`「查看作品」裸链 | ❌ `to=/work/${projectId}` |
| `PlanningProposal` 裸链 + toast | ❌ L150 裸链；L55 toast 含 `/work/` |
| `ShelfPage` / `ProjectCard` | ❌ 仍有裸链 → **P1-b，本卡不改** |

若 dashboard 回归出现 `/work/`，纳入本卡修复；否则 dashboard **只核验、不改**。

---

## 目标

1. 确认首页/dashboard **不绕过五部门子页**直达 WDP（原则 5）
2. 移除创意组内 **裸链进 WDP** 的用户路径（原则 4）
3. 已立项提案改为链到 **企划课部门子页**，文案与 0608 创意组边界一致

---

## 范围

### P0：dashboard + HomePage（预期无代码变更）

- 跑 §0 grep；若已合规，回报「dashboard 已在先前几轮收口，P1-a 跳过 dashboard 改动」
- 若发现 `/work/` 回归：按 `TASK-p1a-scope-assessment.md` 倾向 B/C 改回部门路由

### P1：`ProposalDetailPage.tsx`

当 `proposal.projectId` 存在时：

- **删除** `Link to=/work/${projectId}`（裸链）
- **替换**为企划课入口，例如：
  - 文案：**「查看企划承接」**（或「查看承接状态」，二选一，全文件统一）
  - 目标：`/planning/in-progress`（已接收入企划课后在企划课找作品；**不带** `from=` 进 WDP）
- 若 `projectId` 不存在：不显示该链接（保持现状）

### P2：`PlanningProposal.tsx`

- L150：有 `projectId` 时 **不再** `Link to=/work/...`；改为同 P1 的企划课子页 + 文案
- L55：`success` toast 去掉 `/work/${id}` 指引；改为「已接收入企划课，可在企划课查看」类文案（不暴露 WDP 路径）

---

## 不做

- **P1-b 范围**：`ShelfPage`、`ProjectCard`、`CreateProjectModal`（死代码）
- 不改 `WorkDetailPage` 守卫逻辑（P0 兜底保留）
- 不改 App.tsx 旧路由 redirect（L41/L50/L57）
- 不做「继续写作」强入口
- 不碰 616 内容模型、schema、legacy 迁移/封禁
- 不把 `design-P1-entry-architecture.md` 入库（除非审卡明确要求顺手 copy 一份到 `docs/design/`）

---

## 文件候选

| 文件 | 要点 |
|------|------|
| `frontend/src/pages/creative/ProposalDetailPage.tsx` | 移除裸链，改企划课链接 |
| `frontend/src/components/creative/PlanningProposal.tsx` | 列表链接 + toast |
| `frontend/src/services/dashboard.ts` | **仅** grep 发现回归时改 |
| `frontend/src/pages/HomePage.tsx` | **仅** grep 发现回归时改 |

---

## 验收

- [ ] §0 grep：`dashboard.ts`、`HomePage.tsx` 无 `/work/`（或回归已修）
- [ ] `ProposalDetailPage`、`PlanningProposal` 无 `/work/` 导航（`rg` 通过）
- [ ] 已批准且有关联 Project 的提案：用户可见链接进 **企划课子页**，不进 WDP
- [ ] 五部门合规入口（Planning/Writing/Editorial/Library 三列 `?from=`）**未改**
- [ ] `npm run build`（frontend）通过

---

## 回报格式

1. 只读核验（含 dashboard 是否需改）
2. 做了什么 / 改了哪些文件
3. grep 证据（创意组目录无 `/work/`）
4. 剩余裸链清单（应只剩 P1-b：ShelfPage、ProjectCard 等）
5. **不 commit / 不 push**，除非另行授权

---

## 后续（非本卡）

- **P1-b**：`ShelfPage` `from` 派生、`ProjectCard` 调用方注入
- **616-C**：章节模型设计（仅会诊）
