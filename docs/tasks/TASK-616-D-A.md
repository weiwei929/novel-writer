# TASK-616-D-A：start-writing materialize chapterPlanning → chapters

**状态**：已合并 · PR [#11](https://github.com/weiwei929/novel-writer/pull/11)
**基线**：`feature/workdetail-p1`
**目标分支**：`feature/616-d-a-start-writing-materialize`（已合并删除）
**前置**：[TASK-616-D-consultation.md](./TASK-616-D-consultation.md)

---

## 收束摘要

- `POST /projects/:id/start-writing` 事务内 materialize `metadata.chapterPlanning` → `chapters`
- 映射：`order` / `title` / `summary`；新建 `content=''`；同 order 只 patch title/summary，**不覆盖 content**
- 空规划 → 400，`status` 仍为 `planned`
- 未改 `confirm-greenlight` / `release-to-studio`；不重复 B/C readiness

企划成果现已可交接创作室（`chapters` 表）。

---

## 下一战

**616-D-B** — [TASK-616-D-B.md](./TASK-616-D-B.md)：创作室只读展示 `workSetting` + 本章 `summary`

---

## 原卡范围（归档）

<details>
<summary>背景 / 目标 / 验收（展开）</summary>

### 目标

`planned → writing` 前将 canonical `chapterPlanning` 落到 `chapters` 表。

### 验收（均已满足）

- materialize 后 chapters 与规划对齐
- 已有 content 不被覆盖
- 空规划 start-writing 400

</details>
