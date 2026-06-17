# TASK-616-D-B：创作室只读参考 / 本章梗概展示收口

**状态**：待执行
**基线**：`feature/workdetail-p1`（616-D-A 已合并 PR #11）
**目标分支**：`feature/616-d-b-studio-read-reference`
**前置**：[TASK-616-D-A.md](./TASK-616-D-A.md) · [TASK-616-D-consultation.md](./TASK-616-D-consultation.md) §D1/D4

---

## 背景

D-A 已在 `start-writing` 将 `chapterPlanning` materialize 到 `chapters`。创作室写作器（`WritingEditorPage`）正文写 `Chapter.content`，但参考侧栏 `ReferenceSidebar` 仍主要展示 legacy 人物/故事线/心流，**未按 616 展示企划成果**。

会诊裁定（D1/D4）：

- 创作室消费 **`workSetting` + `chapters`**（含本章 `summary`）
- `summary` 创作室阶段 **只读**；正文只写 `content`

---

## 目标

写作器在参考/侧栏区域（或等价只读区块）明确展示：

1. **`metadata.workSetting` 四块**（只读，走现有 `getWorkSetting` helper）
2. **当前章 `Chapter.summary`**（只读，来自 materialize 后的 `chapters` 表）

作者打开 `/writing/:projectId/:chapterId` 时能看见企划设定与本章梗概，无需回企划课 Tab。

---

## 范围

1. 只读 UI：在 `WritingEditorPage` / `ReferenceSidebar`（或新增轻量「作品设定」「本章梗概」区块）展示上述内容
2. 数据：`workApi.getDetail` 或现有 `project` + `currentChapter` 状态；`workSetting` 用 `getWorkSetting`
3. 空态：无 workSetting / 无 summary 时简短提示，不阻断写作
4. 标注「只读参考」，与正文编辑区视觉区分

---

## 明确不做

- 不改 `Chapter.content` 编辑/保存逻辑
- 不可编辑 `summary` / `workSetting`
- 不碰 `release-to-studio` / `start-writing` / materialize
- 不大改 `ReferenceSidebar` 整体架构（可增 Tab/区块，不删 legacy 参考除非会诊另裁）
- 不做 confirm / 企划课路径改造

---

## 执行步骤

1. 只读核验：`WritingEditorPage` 如何加载 project/chapter；`ReferenceSidebar` 现有 Tab 结构
2. 增加只读展示：`workSetting` 四块 + 当前章 `summary`
3. `frontend npm run build`
4. 手工：start-writing 后进入写作器，侧栏可见设定与本章梗概

---

## 验收标准

- `writing` 项目进入写作器，参考区可见 `workSetting`（有内容时）
- 当前章有 `summary` 时可见本章梗概（只读）
- 编辑正文并保存行为与改前一致
- `frontend npm run build` 通过

---

## 回报格式

```md
## 做了什么
## 改了哪些文件
## 如何验证
## 还剩什么
## 风险或阻塞
```

---

## 风险边界

- 只读 `project.metadata.workSetting` + `currentChapter.summary`，不读 `chapterPlanning` metadata（D-A 后应以 chapters 为准）
- 若侧栏空间不足，优先「作品设定」折叠块 + 「本章梗概」单块，不做全页 redesign
