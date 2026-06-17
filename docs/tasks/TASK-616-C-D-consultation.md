# TASK-616-C-D：章节模型 × 创作室边界 — 加速会诊卡

**状态**：待会诊 · 未授权实现  
**基线**：`feature/workdetail-p1` @ `9ef056a`（P1 已收束）  
**裁决顺序**：**先 C 后 D**（同卡并行讨论，D 不得先于 C 定案）  
**依据**：`616-content-asset-constitution-v0.2.1.md` §2–3；`0608-616-coordination-draft.md` §7

---

## 背景

- **616-B** 已闭环：企划课 `workSetting` 三必 + confirm 硬拦；创意组 `_settingSketch` 全链路。
- **P1** 已收束：入口裸链与 Shelf/ProjectCard 上下文已治理；不做 P1-c。
- 现场仍存在 **双轨章节数据**：`chapters` 表（正文载体）+ `metadata.chapterPlanning`（规划 JSON）；完成企划 **仅检查设定三必**，章节门槛在 A2 明确 defer 给 C。
- `release-to-studio` 端点已有，**流程门槛未与 616 对齐** — 本卡不裁。

---

## 今日目标

1. **616-C**：章节最小模型 + 存储落点 + confirm 关系 — **可定稿，可衍生 C-A 小实现卡**
2. **616-D**：创作室消费边界 — **只定边界，不做实现**
3. **一条输出**：会诊纪要 + 默认裁决确认/修订 → 下一张卡只开 **616-C-A**

---

## 616-C 待裁 5 问

| # | 问题 | 现场事实（只读） |
|---|------|------------------|
| C1 | **章节最小字段集**是什么？（顺序 / 标题 / 梗概 / 状态 — 还要不要别的？） | 协同稿：≥1 章、每章标题+梗概为草案门槛；`Chapter` 有 title/order/summary/content/status |
| C2 | **canonical 读写落点**：以 `chapters` 表为主，还是以 `metadata.chapterPlanning` 为主，还是企划期只用 planning、立项后 materialize 到 `chapters`？ | 两轨并存；`GET/PUT chapter-planning` 写 metadata；写作编辑器读 `chapters` |
| C3 | **企划课 UI 主路径**改哪？（WorkDetail 章节 Tab / 独立规划页 / 沿用现有 ChapterPlanning 组件） | 多处章节列表与「管理章节规划」入口；与 B 的 WorkSettingEditor 并列 |
| C4 | **是否接入 confirm-planning**？若接，最低门槛是什么？ | 今日 **A2 仅 workSetting 三必**；0608-616 草案写「B 三必 + C 最低章节」 |
| C5 | **与 616-B 的先后关系**：默认「先设定后章节」是 UX 引导还是 save/confirm 硬序？ | 协同稿：允许往返，仅内容顺序，不产生流程事件 |

---

## 616-D 待裁 5 问

| # | 问题 | 现场事实（只读） |
|---|------|------------------|
| D1 | **创作室接收什么**？（设定 snapshot / 章节结构 / 梗概 per 章 / 不含正文？） | `planned → writing` 经 start-writing；release 写 `_releasedToStudioAt` |
| D2 | **正文草稿**写哪里？与「章节规划梗概」如何区分？ | `Chapter.content` 为 Markdown 正文；`summary` 为梗概 |
| D3 | **创作室能否改设定 / 改章节结构**？改完是否回流企划 status？ | 616 连续生长：可修订，不另起作品；0608 不退回 |
| D4 | **写作编辑器**必须展示哪些只读参考？（workSetting 四块 / 本章梗概 / 相邻章？） | ReferenceSidebar 有部分只读；未按 616 统一 |
| D5 | **`release-to-studio` 门槛**今天裁到什么粒度？ | 端点存在；与「完成企划」「开始写作」关系未 616 化 |

---

## 建议默认裁决（司令部倾向 · 可修订）

### 616-C

| 议题 | 建议 |
|------|------|
| **C1 最小模型** | 企划阶段 canonical：**顺序 + 标题 + 梗概**（三字段）；`content` 属 D 正文，不计入 C |
| **C2 存储落点** | **C-A 只读/写 canonical 于一处**：倾向 `metadata.chapterPlanning` 为企划期 SSOT，confirm/start-writing 前 **materialize** 到 `chapters`（或反向 — 会诊二选一，禁止长期双写） |
| **C3 UI** | C-A 最小：**企划课 WorkDetail + `from=planning`** 内嵌章节列表编辑器，不新开路由 |
| **C4 confirm** | **今天不接入**章节门槛；A2 三必保持。C-A 落地 **readiness helper** 后，**另开小卡**接 confirm（与 B 对称） |
| **C5 先后** | **软引导**（文案/空态），confirm **不**硬序「先设定后章节」 |

### 616-D

| 议题 | 建议 |
|------|------|
| **D1 接收** | 创作室入口消费：**workSetting 四块 + 章节结构（标题/顺序/梗概）**；无正文 |
| **D2 正文边界** | **规划梗概** = C 资产；**Chapter.content** = D 唯一正文写入面；二者 UI 不混编辑 |
| **D3 修订** | 创作室可 **content 生长**；改 summary/增删章 = 内容 save，**不**自动 `planning → writing` 回流 |
| **D4 参考侧栏** | D 实现卡再定；会诊只原则：**设定只读 + 本章梗概只读** |
| **D5 release** | **本卡不裁**；标记为 D 后续 / 0608 流程专项 |

---

## 明确不做

- 616-C / 616-D **实现代码**（会诊授权前）
- 今天把章节门槛 **塞回 confirm-greenlight**
- 改 `release-to-studio` / start-writing 流程语义
- legacy 六字段 / DB 迁移 / 删 `chapterPlanning`
- 编审部章节级状态机（见 editorial-dept-v2）
- P1-c、长篇立宪、Tab 大重组

---

## 会诊后下一张实现卡候选

**616-C-A：企划课章节 canonical 读模型 + 最小编辑 UI**

- 范围：C1–C3 + `getChapterPlanningReadiness()` 类 helper；**不接 confirm**
- 不做：materialize 策略若会诊未决则 C-A 只做 planning SSOT 一侧
- 前置：本卡 5+5 问裁决纪要写入本文件 §会诊结论（会诊后补）

---

## 会诊产出（会后填写）

| 项 | 裁定 |
|----|------|
| C2 存储 SSOT | _待填_ |
| C4 confirm 接入时机 | _待填_ |
| D5 release 归属 | _待填_ |
| C-A 是否授权 | _待填_ |
