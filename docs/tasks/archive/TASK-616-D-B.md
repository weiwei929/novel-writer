# TASK-616-D-B：创作室只读参考 / 本章梗概展示收口

**状态**：已合并 · PR [#12](https://github.com/weiwei929/novel-writer/pull/12)
**基线**：`feature/workdetail-p1`
**目标分支**：`feature/616-d-b-studio-read-reference`（已合并删除）
**前置**：[TASK-616-D-A.md](./TASK-616-D-A.md) · [TASK-616-D-consultation.md](./TASK-616-D-consultation.md) §D1/D4

---

## 收束摘要

- `ReferenceSidebar` 新增「设定」「本章」只读 Tab（默认「设定」）
- `WritingEditorPage` 传入 `getWorkSetting(project.metadata)` 与当前章 `summary` / 章标签
- 「设定 / 本章」不依赖 legacy `workApi` 加载；人物/故事线/心流 Tab 未删
- 未改 `Chapter.content` 保存、`start-writing`、`confirm`、`release-to-studio`

---

## 验收（已达成）

- [x] writing 项目写作器参考区可见 `workSetting` 四块（只读）
- [x] 当前章 `summary` 可见（只读）
- [x] 正文编辑保存逻辑不变
- [x] `frontend npm run build` 通过
- [x] 合并前 smoke：writing 项目数据路径 + frontend dev 可达

---

## 风险边界（已接受）

- 侧栏 5 Tab 略挤 — 体验微调，不挡本卡；后续可单开 UI 小整理
- 只读 `metadata.workSetting` + `Chapter.summary`，不读 `chapterPlanning`

---

## 关联

- 616-D 会诊：[TASK-616-D-consultation.md](./TASK-616-D-consultation.md)
- 基线：[CURRENT_BASELINE.md](../CURRENT_BASELINE.md)
