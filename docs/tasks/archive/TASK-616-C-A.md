# TASK-616-C-A：企划课章节规划 canonical + 最小编辑收口

**状态**：已合并 · PR [#9](https://github.com/weiwei929/novel-writer/pull/9)
**基线**：`feature/workdetail-p1`
**目标分支**：`feature/616-c-a-chapter-planning`（已合并删除）

---

## 收束摘要

- `metadata.chapterPlanning` canonical = `order` / `title` / `summary`
- 企划课 `from=planning` 章节 Tab 读 metadata，不依赖 `chapters` 表
- `WorkChapterEditor` planningMode 保存只写 metadata，**不 sync `chapters`**
- legacy `synopsisText` 兼容读取；保存持久化 canonical
- `getChapterPlanningReadiness()` 已落地，**confirm 接入留给 C-A2**

---

## 下一小卡

**616-C-A2** — [TASK-616-C-A2.md](./TASK-616-C-A2.md)：把章节 readiness 接入 `confirm-greenlight`（B 三必 + C 最低章节并列检查）

---

## 原卡范围（归档）

<details>
<summary>背景 / 目标 / 验收（展开）</summary>

616-B 已把「作品设定」收成 `metadata.workSetting`。本卡负责企划课章节规划 canonical 与最小编辑收口。

### 目标

```ts
Project.metadata.chapterPlanning: Array<{
  order: number
  title: string
  summary: string
}>
```

### 明确不做（均已遵守）

- 不接入 `confirm-greenlight`（→ C-A2）
- 不改 `release-to-studio` / start-writing
- 不 materialize 到 `chapters` 表
- 不做 616-D 实现

</details>
