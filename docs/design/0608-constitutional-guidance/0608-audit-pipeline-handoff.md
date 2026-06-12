# 0608-audit-pipeline-handoff.md — 五部门流水线 / 放行 / 跨桶流转审计

> **文档角色**：对 novel-writer 前端五部门列表页流程动作、后端流转端点、`stage-guard` 桶守卫、状态标签的一致性审计。补 `0608-audit-work-content-model.md`（详情页内容模型）与 `0608-audit-legacy-10-residuals.md`（1.0 残留）未覆盖的**跨部门流水线**盲区。
> **优先级**：P0 — 含两处会直接失败的真实动作 + 三处违宪假放行。
> **状态**：Audit v1（2026-06-11，Hermes 复检）
> **基线**：HEAD `8f165d6` + 未提交工作树（约 50 文件大重构）
> **核验方式**：前端逐文件读取 + 后端 `projects.ts` 端点 + `stage-guard.ts` 桶/白名单交叉验证；`npx tsc --noEmit` 干净通过。

---

## §0 审计摘要

今早（06-11）的修正案（`amendment-work-content-model` v1.1、`design-workdetail-restructure` v1.3 等）把 **WorkDetailPage / 内容模型** 这条线补成闭环，代码已对齐。但修正案**未触碰**列表页流程动作与后端流转，导致五部门流水线存在断点：

> **当前状态下，作品无法通过 UI 走完「创作 → 编审 → 归档」全流程。**

根因：前端按 0608 新交互重写了动作层，但后端的「放行」端点（`release-to-*` / `archive`）与 `IN_BUCKET_TRANSITIONS` 白名单未同步；前端把缺失的放行渲染成了**看似可用、实则空操作**的按钮。

---

## §1 残留清单总表

| # | 等级 | 部门 | 问题 | 性质 |
|---|:--:|------|------|------|
| H01 | 🔴 P0 | 文集库 | 「归入文集库」`reviewed→archived` 跨桶被 stage-guard 硬拒 | 真实报错 |
| H02 | 🟠 P1 | 企划课 | 「退回企划中」`planned→planning` 被桶内白名单拒 | 真实报错 |
| H03 | 🟠 P1 | 企划课/创作室/编审部 | 三个「放行」按钮空操作 + 假成功提示 | **违宪** |
| H04 | 🟠 P1 | 全局 | 放行门禁缺失：作品按 status 即在上下游双部门可见 | 违背原则 #2 |
| H05 | 🟡 P2 | 编审部/文集库 | `statusLabels` 边界态标签缺口，徽章漏英文原文 | 违背原则 #6/#8 |
| H06 | 🟡 P2 | 编审部 | `start-review` 复用 `submitReview`（命名误导） | 可维护性 |
| D01 | 🟡 P2 | 文档 | `audit-legacy-10-residuals` §4 与 §5 自相矛盾 + 引用已删组件 | 文档 stale |
| D02 | 🟡 P2 | 代码 | `softShelve` + 后端 `/soft-shelve` 死代码（无调用方，仍写 `shelved`）| 死代码 |
| D03 | 🟢 P3 | 文档 | `restructure §2` 仍写 `ProjectMetadataPanel`（实际为 `WorkMetadataPanel`）| 文档 stale |

---

## §2 P0 — 功能阻断

### H01 文集库「归入文集库」必失败

`LibraryPage` 归档动作走通用 `transition`：

```text
frontend/src/pages/LibraryPage.tsx:173-175
  if (action === 'archive') {
    await projectsApi.transition(id, 'archived')   // reviewed → archived
```

后端 `transition` 套用 `assertAllowedTransition` → `assertSameStage`，而两端分属不同桶：

```text
backend/src/middleware/stage-guard.ts:4-11
  editorial: ['reviewing', 'reviewed'],
  terminal:  ['archived'],
```

`reviewed`（editorial 桶）→ `archived`（terminal 桶）= 跨桶 → 抛 `CROSS_STAGE_FORBIDDEN`。
后端**没有**专用 archive 端点（`projects.ts` 仅有 start-writing / mark-written / submit-review / undo-written）。

**后果**：流水线终点动作彻底不可用，作品永远无法归档；用户点击只见"操作失败"。

---

## §3 P1 — 功能损坏 / 违宪

### H02 企划课「退回企划中」必失败

```text
frontend/src/pages/planning/PlanningProjectsPage.tsx:31-32
frontend/src/pages/planning/PlanningPage.tsx:42-43
  await projectsApi.transition(id, 'planning')      // planned → planning
```

桶内白名单中 `planned` 无任何出边：

```text
backend/src/middleware/stage-guard.ts
  planned: [],
```

`planned→planning` 虽同属 planning 桶，但不在白名单 → 抛 `TRANSITION_NOT_ALLOWED`。
**直接违背原则 #4「允许部门内退回 `planned→planning`」。**

### H03 三个「放行」按钮是空操作 + 假成功提示（违宪）

| 部门 | 按钮 | 实际行为 | 证据 |
|------|------|---------|------|
| 企划课 | 提交创作室 `release-to-studio` | 只弹"已提交创作室"，无 API | `PlanningPage.tsx:50-52` |
| 创作室 | 提交编审部 `submit-to-editorial` | `handleAction` **无该分支**，仍弹"已提交编审部" | `WritingProjectsPage.tsx:68-77` |
| 编审部 | 提交文集库 `submit-to-library` | `handleAction` **无该分支**，仍弹"已提交文集库" | `EditorialPage.tsx:67-71` |

`0608-amendment-decision-separation.md` §3.1 与 §5-P2 明确要求：**放行是独立、显式、可审计、记录交接事实的流程动作**。当前实现弹出虚假成功提示却不产生任何交接事实，**从"未实现"升级为"违宪"**。

### H04 放行门禁缺失（系统性）

下游列表纯按 `status` 过滤，无放行标记参与：

```text
EditorialPage.tsx:61   pending = status === 'written'
LibraryPage.tsx:156    pending = status === 'reviewed'
WritingProjectsPage.tsx:64  planned = status === 'planned'
```

因此 `mark-written` 一置 `written`，作品**同时**出现在「创作室·已完成创作」与「编审部·待审阅」；`planned`、`reviewed` 同理双现。等于 status 即可见，**没有放行环节**——违背原则 #2「确认完成 ≠ 放行下一部门」。这也是 H03 三个按钮"无事可做"的根因。

---

## §4 P2 — 标签 / 命名

### H05 `statusLabels` 下游边界态缺口

```text
frontend/src/services/statusLabels.ts:34-53
  editorial: 仅 writing/reviewing/reviewed   ← 缺 'written'（实际待审阅态）
  library:   仅 archived                      ← 缺 'reviewed'（实际待归库态）
```

- 编审部「待审阅」列（`written`）徽章 → 漏原文 `written`。
- 文集库「待归库」列（`reviewed`）徽章 → 漏原文 `reviewed`。
- editorial 还把永不入列的 `writing` 误标为"待审阅作品"（死映射）。

修复建议：`editorial` 增 `written → 待审阅作品`；`library` 增 `reviewed → 待归库作品`；删除 `editorial` 的 `writing` 分支。

### H06 `start-review` 复用 `submitReview`（命名误导）

```text
EditorialPage.tsx:67   if (a === 'start-review') await projectsApi.submitReview(id)
backend projects.ts:817  POST /submit-review  →  written → reviewing
```

功能正确（确实做 `written→reviewing`），但端点名"提交审阅"语义上属于创作室→编审部交接，却用作编审部内部"开始审阅"，是未来误用的种子。

---

## §5 文档 / 死代码一致性

### D01 `audit-legacy-10-residuals` 自相矛盾 + 引用已删组件

- §4 标注 `softShelve → softDelete 替换`、`PlanningActions/StudioActions` 删除为"✅ 已完成"。
- §5.1 / §5.4 仍把 `PlanningActions / StudioActions / EditorialActions / LibraryActions` 的 `softShelve` 列为现存高危风险。
- 这四个组件在当前工作树**已删除**。§5 表格 stale，与 §4 打架，建议同步。

### D02 `softShelve` 死代码

```text
frontend/src/services/api.ts:603   softShelve()  →  POST /soft-shelve
backend projects.ts:920            /soft-shelve  实际写 status='shelved'（不碰 deletedAt）
```

四个 *Actions 组件删除后，`softShelve` **无任何前端调用方**，但函数与后端端点仍在，且行为名不副实（声称软删却写 shelved）。建议列入删除候选。

### D03 文档 stale（低优）

- `design-workdetail-restructure.md §2` 元数据编辑入口写 `ProjectMetadataPanel`，实际代码已改用 `WorkMetadataPanel`（代码比文档更合规）。
- `PROJECT_STATUS_LABEL` 全局单层字典仍被 `StatsPage / ShelfPage / ProjectCard` 引用（audit R11 已记 P1 欠账，与原则 #8 冲突）。
- `WorkMetadataPanel` 代码注释残留"章节规划"字样一处。

---

## §6 已确认合规（复检确认，非问题）

- ✅ WorkDetailPage 双态编辑（只读 → 编辑作品详情）符合 `amendment-work-content-model §3.0`。
- ✅ 三分法（作品元数据 / 作品章节 / 作品正文）+ 创作资料。
- ✅ `getWorkPermissions` 与 `restructure §4` 可写权限表逐格一致。
- ✅ 分区保存（WorkMetadataPanel / WorkChapterEditor / 写作编辑器）独立确认。
- ✅ `getWorkSynopsis` 按 `metadata.synopsis → description` 读取，符合 `synopsis-unification §3`。
- ✅ `PlanningProposal` 评估弹窗 reject / shelve 用户路径已屏蔽。
- ✅ 流程决策已从详情页移除、下沉到列表页条目（符合原则 #11/#14）。
- ✅ `tsc --noEmit` 干净通过。

---

## §7 推荐治理顺序

```
G0 先固化（治理前置）:
  □ 将工作树约 50 文件大重构按部门/层拆成小而可审 commit 固化
    （原则 #10；现违反封版复盘 §5「未 commit 不得当基线」）

G1 先定模型（H03/H04 的总根源）:
  ✅ 放行模型已裁决为 A（见 0608-amendment-org-tier-model.md §2，司令部 2026-06-11）
    A = 补 release-to-* / archive 端点 + 交接时间戳，下游按"已放行"过滤
    → H03 三个假放行按钮补成真实端点（不删）；H04 下游列表改按"已放行"过滤
    （理由：三层科层中"确认完成=员工层""放行=主管层"，是要模拟的科层审批）

G2 修真实报错:
  □ H01 文集库归档：新增 archive 端点或放宽 reviewed→archived（含终态语义）
  □ H02 企划课退回：IN_BUCKET_TRANSITIONS.planned 加 'planning'，或加专用 undo 端点

G3 修标签 / 命名:
  □ H05 statusLabels 补 editorial.written / library.reviewed，删 editorial.writing
  □ H06 评估是否新增语义端点名（低优）

G4 清死代码 / 同步文档:
  □ D02 删除 softShelve + /soft-shelve
  □ D01/D03 同步 audit-legacy-10-residuals §5、restructure §2
```

---

## §8 记录

| 时间 | 事件 |
|------|------|
| 2026-06-11 | Audit v1。Hermes 复检五部门流水线：2 处真实报错（H01/H02）+ 3 处违宪假放行（H03/H04）+ 标签/命名/文档/死代码若干。WorkDetail/内容模型线复检确认合规。 |
