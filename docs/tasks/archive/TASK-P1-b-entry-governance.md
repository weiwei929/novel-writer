# TASK-P1-b：入口治理 — ShelfPage / ProjectCard 上下文

**状态**：**已合并**（PR [#8](https://github.com/weiwei929/novel-writer/pull/8)）  
**基线**：`feature/workdetail-p1`（P1-a / PR #7 已合并）  
**分支建议**：`feature/p1-b-entry-governance`（自 `feature/workdetail-p1` 切出）  
**设计依据**：根目录 `design-P1-entry-architecture.md`（原则 6/7；§Q2 ShelfPage、ProjectCard；§P1-C 映射表）

**前置**：P1-a 已完成（创意组目录无裸链 `/work/`）

---

## 0. 只读核验（执行前必做，回报差异）

```bash
git branch --show-current && git log --oneline -3
rg '`/work/' frontend/src/pages/ShelfPage.tsx frontend/src/components/projects/ProjectCard.tsx
rg 'from=' frontend/src/pages/ShelfPage.tsx
rg 'ProjectCard' frontend/src --glob '!**/ProjectCard.tsx'
```

**起草时事实**：

| 项 | 状态 |
|----|------|
| `ShelfPage` 标题链 | ❌ 裸链 `to=/work/${id}`（无 `from=`） |
| `_shelved.source` | ✅ 后端写入：`planning`/`writing`/`review`/`library`/`creative`/`project_card`/`stage_transition` 等 |
| `ProjectCard` 标题/编辑 | ❌ 裸链 `/work/${id}`（L56、L125–127） |
| `ProjectCard` 引用 | ⚠️ 仅 `KanbanBoard.tsx`（**死代码**，无 page import） |
| P1-a 创意组 | ✅ 已无裸链 |

---

## 目标

1. **ShelfPage**：暂存项进 WDP 时，`from=` 从 `_shelved.source` 派生，不再裸链
2. **ProjectCard**：不再自决部门语境；由调用方注入 `workDetailFrom`，无注入则标题不可点进 WDP

---

## 范围

### P1：`ShelfPage.tsx`

新增 helper（本文件内或 `frontend/src/services/` 小函数均可）。

**一级：`shelved.source`**

```text
planning / writing / review / library  → 同名 from（review → editorial）
creative / project_card / stage_transition / 未知 → 进入二级 fallback
```

**二级：`_shelved.previousStatus` fallback**（source 无法直接映射时使用）

```text
planning / planned              → from=planning
writing / written               → from=writing
reviewing / reviewed            → from=editorial
archived / published / library  → from=library
creative / unknown / 无法判断   → 不可点（不进 WDP）
```

- 可映射：`Link to=/work/${id}?from=${derived}`
- 不可映射：标题 `<span>`（非链接）；还原/删除不变
- **`creative` 来源不进 WDP**（无 Shelf→Proposal 反查链路，不做半套回收站）

### P2：`ProjectCard.tsx`

- 新增可选 prop：`workDetailFrom?: 'planning' | 'writing' | 'editorial' | 'library'`
- **有** `workDetailFrom`：标题 → `/work/${id}?from=${workDetailFrom}`
- **无** `workDetailFrom`：标题不可点（`<span>`，禁止裸 `/work/`）
- **编辑按钮**（L118–128）：
  - 有 chapters → `/writing/${id}/${chapterId}`（保持）
  - 无 chapters **且** 有 `workDetailFrom` → `/work/${id}?from=${workDetailFrom}`
  - 无 chapters **且** 无 `workDetailFrom` → **不 navigate**（禁止 fallback 裸 `/work/`）

### P3：`KanbanBoard.tsx`（可选，仅当改动 ≤5 行）

- 若仍引用 `ProjectCard`：传入合理 `workDetailFrom` 或确认 Kanban 仍无 page 引用则可不改
- **不**复活 Kanban 到任何 page

---

## 不做

- ShelfPage 部门局部暂存区、全局/局部双视图（原则 7 完整态）
- `CreateProjectModal`（死代码）
- 改 WDP 守卫、后端 shelve API、schema
- 616 / legacy / 616-C
- 改合规三列入口（已有 `?from=` 的 Planning/Writing 等）
- 搬 `design-P1-entry-architecture.md` 入库（审卡可裁定）

---

## 文件候选

| 文件 | 要点 |
|------|------|
| `frontend/src/pages/ShelfPage.tsx` | source → from；不可映射则不链 |
| `frontend/src/components/projects/ProjectCard.tsx` | `workDetailFrom` 注入 |
| `frontend/src/components/projects/KanbanBoard.tsx` | 可选，随 ProjectCard API 微调 |

---

## 验收

- [ ] `ShelfPage.tsx` 无裸链 `/work/`（`rg` 仅允许 `` `/work/${...}?from=` `` 形式）
- [ ] 至少 smoke：planning 来源暂存项 → 点标题带 `from=planning` 进 WDP
- [ ] `ProjectCard` 无 `workDetailFrom` 时标题不 navigate 裸 `/work/`
- [ ] `ProjectCard` 传入 `workDetailFrom` 时链正确
- [ ] `npm run build`（frontend）通过

---

## 回报格式

1. 只读核验与 source→from 映射表（最终裁定）
2. 改了哪些文件 / diff 规模
3. grep 证据（ShelfPage、ProjectCard 无裸链）
4. 剩余 P1 债务（如 CreateProjectModal）
5. **不 commit / 不 push**，除非另行授权

---

## 后续（非本卡）

- P1 收束或 P1-c（入口文案统一、暂存池部门摘要）
- **616-C** 设计卡（仅会诊）
