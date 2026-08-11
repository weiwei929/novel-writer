# 0608 立宪 · 现役条款

> **状态**：现役 · 立宪级 · 2026-07-29 建立
> **由来**：0608 立宪原文此前全部存放于 `docs/journal/0608-constitutional-guidance/`，而治理规则规定 `journal/` 为「学习档案 · **不作为操作依据**」。
> **结果**：司令官反复援引的立宪，被归档在"不得采信"的目录下。参谋长因遵守治理规则排除该目录，**漏读 F-001（禁止跨部门退回）**，重复讨论了已决事项。
> **处置**：2026-07-29 司令官裁定取回。**本目录 11 份为现役立宪，原文一字未改，仅加状态行。**

---

## 规则优先级

```text
0608 立宪（本目录 + 阶段边界准则）
  >  616 内容资产立宪（docs/design/616-content-asset-constitution-v0.2.1.md）
  >  CURRENT_BASELINE.md
  >  CURSOR_REFERENCE.md
  >  当前授权 TASK 卡
  >  Ponytail
```

---

## 本目录

### 纲领

| 文档 | 内容 |
|---|---|
| [`0608-dept-workspace-model.md`](./0608-dept-workspace-model.md) | **五部门三状态核心模型**。基本模型、流转规则、状态机映射 |
| [`0608-legacy-freeze-list.md`](./0608-legacy-freeze-list.md) | **35 条冻结项权威清单**——"不再做什么"的宪法。执行前必查（F-001 跨部门退回禁令在此） |
| [`../0608-stage-boundary.md`](../0608-stage-boundary.md) | **阶段边界准则**（2026-07-29 补充条款）。三段三动作、一切皆推、详情页不执行流程 |

### 修正案

| 文档 | 内容 |
|---|---|
| [`0608-amendment-decision-separation.md`](./0608-amendment-decision-separation.md) | **P0**——所有新前端交互、状态推进、详情页与列表页实施前必须遵循 |
| [`0608-amendment-org-tier-model.md`](./0608-amendment-org-tier-model.md) | 组织层级模型 v1 |
| [`0608-amendment-work-content-model.md`](./0608-amendment-work-content-model.md) | 作品内容模型 v1.1 |

### 机制

| 文档 | 内容 |
|---|---|
| [`0608-release-protocol.md`](./0608-release-protocol.md) | 放行协议——部门间交接的契约 |
| [`0608-status-context-labeling.md`](./0608-status-context-labeling.md) | 状态标签的部门上下文化 |
| [`0608-file-staging-pool.md`](./0608-file-staging-pool.md) | 文件暂存池语义。**跨部门退回的唯一替代方案**（见 F-001） |

### 部门细则

| 文档 |
|---|
| [`0608-creative-workspace.md`](./0608-creative-workspace.md) |
| [`0608-editorial-workspace.md`](./0608-editorial-workspace.md) |
| [`0608-library-workspace.md`](./0608-library-workspace.md) |

---

## 留在 journal/ 的（仅作溯源，不得作为依据）

`docs/journal/0608-constitutional-guidance/` 保留 15 份：

- **审计快照** `0608-audit-*.md` ×3 —— 2026-06-11 的现状扫描，早已过时
- **实施蓝图 / 设计记录** `0608-frontend-planning-workspace.md`、`0608-design-*.md` ×2、`0608-release-protocol-execution-spec.md` —— 已实施完毕
- **草案** `0608-ux-interaction-model.md`、`0608-supplement-creative-discovery.md` —— Draft，未定案
- **过程** `0608-phase-closure.md`、`0608-overall-architecture.md`、`architecture-studio-analysis.md`、`claude-feedback-0608.md`、`handoff-to-codex-2026-06-10.md`、`README.md`

**判据**：定了规矩的取回，记了过程的留下。

---

## 同批取回的其他立宪

| 文档 | 去向 | 理由 |
|---|---|---|
| `creative-v2-constitution-draft.md` | → `docs/design/` | 是 `creative-v2-consultation-agenda.md` 自述的**上位依据**，却被归入 journal |
| `creative-v2-consultation-agenda.md` | → `docs/design/` | 头部自标「**司令部定案**（2026-06-16）」，定案不是学习记录 |

**616 内容资产立宪**（`docs/design/616-content-asset-constitution-v0.2.1.md`）**本就在现役区**，无需取回。

---

## 给后来的 Agent

**这批文档没有"过时"的问题——它们从头到尾都是有效的，只是被放错了地方。**

读到与本目录冲突的旧实现时，按 `AGENTS.md` 的判定原则：**以实测为准判断代码现状**，但**规则以本目录为准**。代码不符合立宪的，是代码的缺陷，不是立宪过时。
