# TASK-616-C-A2：confirm-greenlight 接入章节 readiness

**状态**：已合并 · PR [#10](https://github.com/weiwei929/novel-writer/pull/10)
**基线**：`feature/workdetail-p1`
**目标分支**：`feature/616-c-a2-confirm-chapter-readiness`（已合并删除）
**前置**：[TASK-616-C-A.md](./TASK-616-C-A.md) · [TASK-616-B-closure.md](./TASK-616-B-closure.md)

---

## 收束摘要

- `confirm-greenlight` = **作品设定三必（B）+ 章节最低规划（C）** 并列检查
- 前端 `confirmPlanningWithReadiness` + 后端 `assertPlanningConfirmReady` 双保险
- C 规则：≥1 章，每章 `title` / `summary` 非空；只读 `metadata.chapterPlanning`
- 三入口统一：`PlanningActions` / `PlanningInProgressPage` / `PlanningPage`
- 未 materialize、未改 release/start-writing、未写 `chapters`

**企划课 confirm 从此带内容成熟度门槛，不再只是 status 流转。**

---

## 下一战

**616-D 会诊** — [TASK-616-D-consultation.md](./TASK-616-D-consultation.md)（创作室边界 / materialize / start-writing；不写代码）

---

## 原卡范围（归档）

<details>
<summary>背景 / 目标 / 验收（展开）</summary>

### 目标

在「确认企划完成」前，前后端同时检查 B + C；未达标 400。

### 明确不做（均已遵守）

- 不改 `release-to-studio` / `start-writing`
- 不 materialize 到 `chapters`
- 不做 616-D 实现

</details>
