# TASK-616-D-A：start-writing materialize chapterPlanning → chapters

**状态**：待执行
**基线**：`feature/workdetail-p1`（616-D 会诊已定案）
**目标分支**：`feature/616-d-a-start-writing-materialize`
**前置**：[TASK-616-D-consultation.md](./TASK-616-D-consultation.md)

---

## 背景

- 企划期 SSOT：`metadata.chapterPlanning`（C-A）
- 创作室正文载体：`chapters` 表（`Chapter.content`）
- 会诊裁定：**materialize 触发点 = `start-writing`**；confirm 不 materialize

---

## 目标

在 `POST /projects/:id/start-writing`（`planned → writing`）时，将 canonical `chapterPlanning` **一次性落到 `chapters` 表**，使创作室可读可写正文。

---

## 范围

1. **materialize 服务**（前后端择一或双端，至少后端必做）：
   - 读 `normalizeChapterPlanning(metadata.chapterPlanning)`
   - 对每个规划项按 `order` upsert `Chapter`：
     - 新建：`title` / `order` / `summary` 来自规划；`content=''`
     - 已存在同 `order`：patch `title` / `summary`；**不覆盖 `content`**
2. **`start-writing` 接入**：
   - `planned` 状态下先 materialize，成功后再 `status → writing`
   - materialize 失败 → 400，不推进 status
   - 成功后 `chapters` 至少 1 行（与 C confirm 门槛一致；不重复跑 B/C readiness）
3. **最小验证**：materialize 后写作器/WorkDetail 非 planning 路径能读到 `chapters` 列表

---

## 明确不做

- 不改 `confirm-greenlight` / 616-C-A / C-A2
- 不实现 `release-to-studio` 门槛
- 不大改正文编辑器 / ReferenceSidebar
- 创作室 **不改** `summary`（只读）
- legacy 迁移 / 删 `chapterPlanning`
- 企划课 planning 路径恢复写 `chapters`

---

## 验收标准

- `planned` 项目 `start-writing` 后：`chapters` 行与 `chapterPlanning` order/title/summary 对齐
- 已有 `content` 的章节：materialize **不覆盖** `content`
- materialize 失败或 0 章：`start-writing` 400，`status` 仍为 `planned`
- `frontend npm run build` / `backend npm run build` 通过

---

## 回报格式

```md
## 做了什么
## 改了哪些文件
## 如何验证
## 还剩什么
## 风险或阻塞
```
