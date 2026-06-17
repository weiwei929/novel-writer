# TASK-616-C-A：企划课章节规划 canonical + 最小编辑收口

**状态**：待执行  
**基线**：`feature/workdetail-p1`（616-B 已闭环，P1 已收束，C/D 会诊已定案）  
**目标分支**：`feature/616-c-a-chapter-planning`

---

## 背景

616-B 已把「作品设定」收成 `metadata.workSetting`。616-C 负责企划课的另一半内容资产：章节规划。

当前现场：

- WorkDetail 已有「作品章节」Tab，并在 planning 场景使用 `WorkChapterEditor`。
- `WorkChapterEditor` 现有主写入为 `Project.metadata.chapterPlanning`。
- `WorkChapterEditor` 现状会在保存后同步创建/更新 `chapters` 表；会诊已裁定 C-A 不写 `chapters`，因此本卡需移除或 gate 掉该 sync。
- 旧章节规划字段存在 `synopsisText` / `plannedLength` / `status` 等；C-A canonical 用 `summary`，但读取需兼容旧 alias。
- WorkDetail 「作品章节」Tab 现状主要读 `data.chapters`；去掉 sync 后，planning 场景必须改读 `metadata.chapterPlanning`，否则保存后列表仍显示空。
- `Chapter` 表含 `title/order/summary/content/status`，但本轮视为创作室正文载体，不作为企划期 SSOT。

---

## 目标

把企划期章节规划收成一个清晰 canonical：

```ts
Project.metadata.chapterPlanning: Array<{
  order: number
  title: string
  summary: string
}>
```

并提供最小 readiness helper，为后续「完成企划 = B 三必 + C 最低章节」小卡预留钩子。

---

## 范围

1. 新增或收口章节规划 helper：
   - `normalizeChapterPlanning(value)`
   - `getChapterPlanning(projectOrMetadata)`
   - `getChapterPlanningReadiness(value)`
2. readiness 最低规则：
   - 至少 1 章
   - 每章必须有非空 `title`
   - 每章必须有非空 `summary`
3. WorkDetail planning 路径继续使用现有「作品章节」Tab / `WorkChapterEditor`。
4. 保存只写 `metadata.chapterPlanning`，不得写 `chapters` 表，不得推进流程状态。
5. 只补最小 UI 文案或空态，让作者知道这里是「企划阶段章节规划」，不是正文。
6. 兼容读取 legacy `synopsisText`，但保存时只持久化 canonical `summary`。

---

## 明确不做

- 不接入 `confirm-greenlight`
- 不改 `release-to-studio` / start-writing
- 不 materialize 到 `chapters` 表
- 不改写作编辑器正文逻辑
- 不做 616-D 实现
- 不迁移历史 chapterPlanning / chapters 数据
- 不做大 Tab 重组或新页面

---

## 执行步骤

1. 只读核验：
   - 当前分支 / HEAD
   - `WorkDetailPage` 如何读取 `chapterPlanning`
   - `WorkChapterEditor` 如何保存
   - 后端 `PUT /projects/:id` metadata merge 行为
2. 实施 helper：
   - 优先放在 `frontend/src/services/chapterPlanning.ts` 或现有相邻服务文件
   - 若后端也已有章节规划写入口，按需补同名 util；没有则不强行新增后端
3. 接入 UI：
   - `WorkDetailPage` 读取时走 helper
   - planning 场景「作品章节」Tab 列表读 `metadata.chapterPlanning`，展示 `order/title/summary`
   - `WorkChapterEditor` 保存前 normalize
   - 移除或 gate 掉 `WorkChapterEditor` 保存后的 `chapters` 表同步逻辑
   - planning 场景隐藏或降级 `plannedLength` / `status` 这类非 canonical 字段；如保留 UI 过渡，保存时不得持久化
   - planning 场景显示最小说明/空态
4. 验证：
   - frontend build
   - 若改后端，backend build
   - 手工/API smoke：保存章节规划后 `status` 不变，`metadata.workSetting` 不变，`chapters` 表不新增/不改写

---

## 验收标准

- `metadata.chapterPlanning` 只保留 canonical 三字段语义：`order/title/summary`
- 旧 `synopsisText` 能被读取为 `summary`；保存后不再写回 `synopsisText`
- 空数组 / 非数组 / 脏数据不会炸 UI
- 保存章节规划不推进 status
- 保存章节规划不写 `chapters` 表
- planning 场景保存后刷新，章节 Tab 仍能从 `metadata.chapterPlanning` 展示规划内容
- readiness helper 能返回：
  - `ready: false` + 缺项原因
  - `ready: true` 当至少一章且每章标题/梗概非空
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

- 如果现有数据结构与卡假设差异超过 30%，暂停并回报，不要硬做。
- 移除 `chapters` 同步属于本卡 in-scope；但不得顺手改 `Chapter.content`、写作编辑器或 release/start-writing。
- 本卡只收 canonical 与最小 UI，不把 C 门槛塞进 confirm。
