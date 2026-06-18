# TASK-616-B-A2：企划课闭环 — 雏形继承与完成企划成熟度

**立宪依据**：
- [docs/design/616-B-work-setting-minimal-model-draft.md](docs/design/616-B-work-setting-minimal-model-draft.md) §5、§6.2
- [docs/design/0608-616-coordination-draft.md](docs/design/0608-616-coordination-draft.md) §4（完成企划成熟度）、§5.3
- [docs/design/creative-v2-consultation-agenda.md](docs/design/creative-v2-consultation-agenda.md)（创意组可选设定雏形）
- [TASK-616-B-A.md](TASK-616-B-A.md)（**已合并**）

**状态**：已执行 · 待合并审查（`feature/616-b-a2-planning-closure` → `feature/workdetail-p1`）  
**司令部裁决（2026-06-16）**：
1. confirm-planning **硬拦**（三必未填不得 `planning → planned`）
2. 后端 `POST /projects/:id/confirm-greenlight` **必做**成熟度双保险
3. **P3 章节检查不纳入**本卡
**类型**：616-B 第二轮实现战役  
**母卡**：616-B（作品设定最小模型）  
**建议分支**：`feature/616-b-a2-planning-closure`（自 `feature/workdetail-p1` 切出）  
**前置**：616-B-A 已合并（`workSetting` canonical 键 + planning 编辑器）

## 背景

616-B-A 已在企划课落地 `Project.metadata.workSetting` 四块编辑器，但企划闭环仍有两处断层：

1. **创意组 → 企划课**：`acceptIntoPlanningCore` 未复制创意组可选「设定雏形」，作者在企划课常从空白四块重新开始。
2. **企划中 → 已完成企划**：`confirmGreenlight` /「确认企划完成」**无成熟度检查**，三必未填也可 `planning → planned`，与 0608-616 协同稿不一致。

本卡补齐 **企划课段闭环**，不启动 616-C 章节模型战役。

## 目标

1. 立项时把 Proposal 上的设定雏形**继承**到 `Project.metadata.workSetting`（有则复制，无则跳过）
2. 在「确认企划完成」流程动作前，检查 **workSetting 三必**是否已有内容
3. 未达标时给出明确提示；是否硬拦由本卡裁定（默认建议：**硬拦**，叙事风格/创作心流始终可选）

## 范围

### P0：设定雏形继承（立项单点）

在 `acceptIntoPlanningCore`（及唯一立项路径）：

- 读取 `Proposal.metadata._settingSketch`（对象，键与 `workSetting` 四键对齐）
- 若有非空块，写入新建 `Project.metadata.workSetting`（**不**写 legacy 六字段）
- 与已有 `synopsis` 双写逻辑并存；**不**触发拆章、**不**写 `references[]`
- 若 Project 侧将来已有 `workSetting`，立项时以雏形为 seed merge（incoming 非空覆盖空位）

**本卡可裁定 `_settingSketch` 键名**（与 `workSetting` 同构）：

| 键 | 标签 |
|----|------|
| `charactersAndRelations` | 人物与关系 |
| `timeAndPlace` | 时间与地点 |
| `eventsAndPlot` | 事件与情节 |
| `narrativeStyle` | 叙事风格 / 创作心流（可选） |

### P1：成熟度读模型

新建共享 helper（前后端择一或双端）：

- `getPlanningSettingReadiness(project)` → `{ requiredFilled: 0..3, missingLabels: string[], ready: boolean }`
- 「有内容」= `trim().length > 0`（与 616-B 草案一致，无最低字数）
- **仅检查 workSetting 三必**；`narrativeStyle` 不参与 `ready`

### P2：confirm-planning 门槛（列表条目）

在企划课 **「企划进行中」列表**触发 `confirmGreenlight` 之前（`PlanningInProgressPage` / `ProjectPickerView`）：

- 未达标时 **硬拦**并提示缺项（列缺失块名称）
- **不得**在作品详情 Tab / `WorkSettingEditor` 的 save 中隐式触发 confirm
- `save` 仍只写内容，不推进 status
- 后端 `confirm-greenlight` **必须**同步硬拦（非可选）

### P3：章节成熟度（默认不做，审卡可开）

0608-616 协同稿「完成企划」草案亦含章节条件（≥1 章、每章标题+梗概）。**默认不纳入本卡**，避免与 616-C 纠缠。

若审卡明确要求纳入：仅允许读取**现有** `chapters` 表或 `metadata.chapterPlanning` 做只读检查，**不**新建章节模型、不改造章节 UI。

## 明确不做

- 不启动 **616-C** 作品章节模型主战役
- 不改造 `release-to-studio` / 创作室放行门槛
- 不做 legacy 六字段 → `workSetting` 自动迁移
- 不做 `PUT` 全局 legacy 写入封禁
- 不扩展 creative-v2 主路径（`references[]`、自动拆章）
- **不强制**本卡实现创意组设定雏形 **UI**（仅立项复制；创意侧 UI 可另卡）
- 不在 `WorkDetailPage` 详情内放「确认企划完成」流程按钮（0608 目标态）

## 文件候选

### 必改

| 文件 | 要点 |
|------|------|
| `backend/src/routes/proposals.ts` | `acceptIntoPlanningCore` 复制 `_settingSketch` → `workSetting` |
| `frontend/src/services/workSetting.ts` | `getPlanningSettingReadiness()` |
| `frontend/src/pages/planning/PlanningInProgressPage.tsx` | confirm 前 readiness 检查 |
| `frontend/src/components/projects/ProjectPickerView.tsx` | 同上（若动作在此触发） |

### 可能改

| 文件 | 要点 |
|------|------|
| `backend/src/utils/workSetting.ts` | 服务端 readiness（若前端检查不足） |
| `backend/src/routes/projects.ts` | `confirm-greenlight` 服务端**必做**硬拦 |
| `frontend/src/services/api.ts` | `ProposalMetadata` 增加 `_settingSketch` 类型 |

### 明确不改

- `frontend/src/components/metadata/WorkSettingEditor.tsx`（save 语义已在 A-A 收口）
- `PlanningInProgressPage` 列表准备度条（非本卡必须）
- Prisma schema

## 执行步骤

1. 只读核对立项路径与 `confirmGreenlight` 调用链。
2. 实现 `_settingSketch` → `workSetting` 立项复制 + API smoke。
3. 实现 readiness helper。
4. 接线 confirm-planning 前检查（列表条目）。
5. build + smoke（含：有雏形立项、三必未填拦截、三必已填可通过）。

## 验收标准

```text
[x] accept 后 Project.metadata.workSetting 含 Proposal._settingSketch 非空块

[x] 无 _settingSketch 时立项行为与 A-A 后一致（不回归）

[x] 三必未填时「确认企划完成」不推进 status（硬拦）

[x] 三必已填时可正常 confirm-planning（planning → planned）

[x] save 作品设定仍不触发 confirm / 不改 status

[x] 未夹带 616-C 章节模型、release 门槛、references[]、拆章

[x] frontend / backend npm run build 通过

[x] API smoke：
    1. Proposal 带 _settingSketch → accept → workSetting 继承
    2. 三必未填 confirm-greenlight 400；补全后 200 → planned
```

## GitHub 审查点

- 立项是否**只**写 `workSetting`（非 legacy 六字段）
- confirm 检查是否在**列表流程动作**而非 save/详情内
- readiness 是否**仅**三必（非 narrativeStyle）
- 是否误开 616-C 或章节 UI 改造

## 风险边界

| 风险 | 边界 |
|------|------|
| 创意组无雏形 UI | 本卡只做复制；测试用 API 种子 |
| 章节条件扯入 616-C | 默认不做；审卡单开 P3 |
| 前后端双重检查不一致 | 前端体验 + 后端 **必拦** |
| `_settingSketch` 键名漂移 | 与 `workSetting` 同构，本卡裁定 |

## 未决问题（已裁决）

1. confirm-planning：**硬拦** ✅
2. `confirm-greenlight` 后端：**必做**双保险 ✅
3. P3 章节检查：**不纳入**本卡 ✅

## 回报格式

（做了什么 / 改了哪些文件 / 如何验证 / 还剩什么 / 风险或阻塞）
