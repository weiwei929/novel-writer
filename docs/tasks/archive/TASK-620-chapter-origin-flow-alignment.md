# TASK-620: Chapter Origin Flow Alignment & Baseline Closure

> **状态**：已完成 / 已合并
> **关联宪法**：[0608-dept-workspace-model.md](../design/0608-constitutional-guidance/0608-dept-workspace-model.md) / [616-content-asset-constitution-v0.2.1.md](../design/616-content-asset-constitution-v0.2.1.md)

---

## 1. 任务目标

严格遵循 0608 宪法与 616 内容立宪大纲，对“三大第一起点（作品起点: 创意课, 章节起点: 企划课, 正文起点: 创作室）”进行视觉体验与文案对齐，收束 616 系列战役。

---

## 2. 成果清单

- `frontend/src/pages/WorkDetailPage.tsx`：
  - 在企划课视角的“作品章节”Tab 中，明确“企划起点 · 章节大纲架构”发源地定位。
  - 提供 **`+ 构筑全书章节大纲`**，纯粹更新 `metadata.chapterPlanning`。
- `frontend/src/pages/WritingEditorPage.tsx`：
  - 顶栏按钮术语消除“目录”，规范为 **“章节”**。
- `frontend/src/components/writer/ReferenceSidebar.tsx`：
  - 严守 616-D-B 规范，保留纯粹只读降噪参阅（`workSetting` + `Chapter.summary`）。
