# TASK-616-D：创作室边界 / materialize / start-writing — 加速会诊卡

**状态**：已会诊 · D-A 已授权 · 未授权 D-A 以外实现
**基线**：`feature/workdetail-p1`（616-B + 616-C-A + 616-C-A2 已闭环）
**前置**：[TASK-616-C-D-consultation.md](./TASK-616-C-D-consultation.md)（C 已落地；D 原则已初裁，本卡聚焦未决实现边界）

---

## 背景

企划课侧已闭环：

| 已落地 | 说明 |
|--------|------|
| **616-B** | `workSetting` 三必 |
| **616-C-A** | `metadata.chapterPlanning` canonical；planning 保存不写 `chapters` |
| **616-C-A2** | `confirm-greenlight` = B 三必 + C 最低章节 |

现场仍存在的 **C → D 断层**：

- 企划期章节 SSOT = `metadata.chapterPlanning`
- 创作室写作编辑器读 **`chapters` 表**（`Chapter.content` 正文）
- `start-writing`（`planned → writing`）与 `release-to-studio` 端点存在，**与 616 materialize 策略未对齐**
- 首轮 D 会诊（C-D 卡）定了原则边界，**materialize 时机与 start-writing 关系仍 defer**

---

## 今日目标

1. **裁清 616-D 实现边界**（消费什么、何时 materialize、正文与梗概如何分）
2. **裁 `start-writing` vs `release-to-studio` 与 materialize 的先后**（只定规则，不改代码）
3. **输出**：会诊纪要 → 下一张卡只开 **616-D-A**（或等价首实现小卡），**本卡不写代码**

---

## 616-D 待裁 6 问

| # | 问题 | 现场事实（只读） |
|---|------|------------------|
| D1 | **创作室入口消费什么**？ | 首轮裁定：workSetting 四块 + 章节结构（title/order/summary），无正文。创作室 UI 现状多读 `chapters` 表 |
| D2 | **materialize 触发点**：`confirm-greenlight` / `start-writing` / `release-to-studio` / 首次打开写作器 — 选哪个（或组合）？ | C-A 明确 confirm **不** materialize；C-D 卡 defer 到 D 后续 |
| D3 | **materialize 映射规则**：`chapterPlanning[]` → `Chapter` 行如何创建？（order/title/summary → title/order/summary；content 空串？） | 旧 `WorkChapterEditor` legacy 路径曾 sync 创建 chapters；planning 路径已关闭 |
| D4 | **正文 vs 梗概**：写作器编辑 `content`；规划梗概只读还是可在创作室改 `summary`？ | 首轮：content 唯一正文写入面；改 summary/结构 = 内容 save，不回流企划 status |
| D5 | **`start-writing` 门槛**：是否要求 chapters 已 materialize？是否复用 B/C readiness 或只检查 chapters 存在？ | 端点已有；与 confirm 成熟度关系未 616 化 |
| D6 | **`release-to-studio` 本阶段裁到哪**？与 start-writing / 0608 流程专项如何分工？ | 端点写 `_releasedToStudioAt`；本轮 baseline **暂不实现 release 门槛** |

---

## 建议默认裁决（司令部倾向 · 可修订）

| 议题 | 建议 |
|------|------|
| **D1 消费** | 创作室只读参考：workSetting + 本章 summary（来自 materialize 后的 `Chapter.summary` 或仍读 metadata — 二选一，禁止长期双源） |
| **D2 materialize 时机** | **`start-writing` 前一次性 materialize**（`planned → writing` 事务内）；confirm 仍只写 metadata |
| **D3 映射** | 按 order 创建/对齐 `Chapter` 行：title/order/summary 来自 canonical；`content=''`；已存在同 order 行则 patch title/summary，不覆盖 content |
| **D4 正文边界** | 写作器主编辑 `content`；summary 侧栏只读（或 D-A2 再开「创作室改梗概」小卡） |
| **D5 start-writing** | 要求 materialize 成功 + ≥1 章 chapters；**不**重复跑 B/C readiness（confirm 已做） |
| **D6 release** | **本会诊不裁实现**；记为 0608 / release 专项；D-A 不做 release 门槛 |

---

## 明确不做

- **任何实现代码**（会诊授权前）
- 改 `confirm-greenlight` / 616-C-A / C-A2 已落地行为
- `release-to-studio` 门槛实现（可讨论，不落地）
- 正文编辑器大改 / ReferenceSidebar 全量重做
- legacy 迁移 / 删 `chapterPlanning`
- 编审部章节级状态机

---

## 会诊后下一张实现卡候选

**616-D-A：start-writing 前 materialize + 创作室最小读模型**

- 范围：D2–D3 + start-writing 接入；创作室列表读 materialize 后的 `chapters`
- 不做：release 门槛、正文编辑器大改、summary 可编辑（除非会诊明确纳入）

---

## 会诊产出（会后填写）

| 项 | 裁定 |
|----|------|
| D1 创作室接收物 | 创作室消费 **`metadata.workSetting` + `chapters` 表**（materialize 后的章节结构/梗概/正文载体） |
| D2 materialize 触发点 | **`start-writing`**（`planned → writing` 前/事务内）；`confirm-greenlight` **不** materialize |
| D3 materialize 映射规则 | `chapterPlanning[]` → `Chapter`：`order`/`title`/`summary` 映射；`content=''`；已存在同 `order` 则 patch `title`/`summary`，**不覆盖 `content`** |
| D4 正文 vs 梗概 | 正文唯一写入面 = **`Chapter.content`**；`summary` 创作室阶段 **只读** |
| D5 start-writing 门槛 | materialize **成功**且 **`chapters` ≥ 1**；**不**重复 B/C readiness（confirm 已做） |
| D6 release 归属 | **`release-to-studio` 归后续 0608 / release 专项**；不进 D-A |
| D-A 是否授权 | **授权** [TASK-616-D-A.md](./TASK-616-D-A.md)：`start-writing` 前 materialize `chapterPlanning` → `chapters` |

---

## 依据

- [616-content-asset-constitution-v0.2.1.md](../design/616-content-asset-constitution-v0.2.1.md) §2–3
- [0608-616-coordination-draft.md](../design/0608-616-coordination-draft.md) §7
- [TASK-616-C-D-consultation.md](./TASK-616-C-D-consultation.md) §616-D 首轮原则
