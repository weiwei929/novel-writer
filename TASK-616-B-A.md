# TASK-616-B-A：企划课作品设定最小模型（第一刀）

**立宪依据**：
- [docs/design/616-content-asset-constitution-v0.2.1.md](docs/design/616-content-asset-constitution-v0.2.1.md)（v0.2.2，§2 连续生长）
- [docs/design/616-B-work-setting-minimal-model-draft.md](docs/design/616-B-work-setting-minimal-model-draft.md) §4、§5.2、§8
- [docs/design/0608-616-coordination-draft.md](docs/design/0608-616-coordination-draft.md) §3、§4（企划中 = 内容劳动 / save）
- [TASK-616-A-closure.md](TASK-616-A-closure.md)（命名与梗概已收官）

**状态**：已审卡 · 已执行（`feature/616-b-a-work-setting`）  
**类型**：616-B 第一轮实现战役  
**母卡**：616-B（作品设定最小模型）  
**建议分支**：`feature/616-b-a-work-setting`（自 `feature/workdetail-p1` 切出）  
**前置**：616-A 已合并；Creative-v2-A 不阻塞本卡（本卡改 `Project`，不改创意组主路径）

## 背景

616-B 会诊草案已定「作品设定三必一选」，但现场企划课仍用旧六字段心智：

- `WorkDetailPage` → `ContentMetadataCard` 展示 `characters` / `timeline` / `settings` 等 legacy 键
- `MetadataEditor` 仍可向旧六字段写入
- 企划中劳动与 creative-v2 交付的「创意作品雏形」之间，**缺少新版作品设定承接面**

若不先落第一刀，创意链路会停在企划门口：作者接收入企划课后，看到的仍是 1.0 设定表单，而非 616-B 描述式四块。

## 目标

在**不改 schema、不碰 616-C、不硬拦流程按钮**的前提下，落地企划课「作品设定」最小可写闭环：

1. 裁定并写入 **canonical 存储结构**（`Project.metadata`）
2. 企划中作品详情提供 **新版四块描述式编辑 UI**（三必一选）
3. **save 只写内容键，不推进 `status`**
4. 旧六字段 **只读兼容**；**planning 新主写入路径**禁止新写 legacy 键
5. 为后续「完成企划成熟度检查」「创意组设定雏形继承」留接口，本卡不实现

## 范围

### P0：canonical 键与读写单点

本卡裁定 `Project.metadata.workSetting`（对象，描述式文本）：

| 键 | 产品标签 | 必填（本卡 UI） |
|----|----------|-----------------|
| `charactersAndRelations` | 人物与关系 | 必（可空起步，不设机器字数） |
| `timeAndPlace` | 时间与地点 | 必 |
| `eventsAndPlot` | 事件与情节 | 必 |
| `narrativeStyle` | 叙事风格 / 创作心流 | 选 |

要求：

- 新建 `frontend/src/services/workSetting.ts`（或 `utils/workSetting.ts`）+ 必要时 `backend` 辅助校验/merge
- 提供 `getWorkSetting(metadata)`、`normalizeWorkSetting(partial)`、`isWorkSettingBlockFilled()` 等最小 helper
- **planning 新主写入路径**（`WorkSettingEditor` 及本卡接线的 save）**禁止**向 `characters` / `timeline` / `settings` / `relationships` / `plotStructure` / `worldBuilding` 写入

### P1：企划中编辑 UI

- 在 `WorkDetailPage`「作品设定」Tab（`from=planning` 且 `status=planning` 可编辑态）：
  - **新增** `WorkSettingEditor`（或等价组件）：单页纵向四块 `textarea`，描述式，不用子字段表单
  - **替换** 该场景下 `ContentMetadataCard` + `MetadataEditor` 的**主写入路径**
- 只读场景（创作室参考、非 planning 编辑态）：
  - 优先展示 `workSetting` 四块
  - 若仅有 legacy 六字段，可继续只读展示 legacy（沿用 `readMetadataFieldValue`），**不迁移**
- 保留 A1「遗留资料（只读）」入口与 `MetadataProjectPage` 冻结线，不扩展 WorldBuilding

### P2：save 语义

- 作品设定保存走 `PUT /projects/:id`（或现有 metadata 更新路径），**仅更新** `metadata.workSetting`（及必要 merge，不抹掉其他 metadata 键）
- 保存按钮文案/提示对齐 0608-616：**「仅保存当前内容，不改变作品流程状态」**
- **不得**在 save 时调用 `confirmGreenlight` / `release-to-studio` / 任何 status 变更

### P3：软准备度（默认不做）

- **默认不做**准备度 UI；本卡核心目标是 canonical 键 + 详情页四块编辑器 + save 语义
- **若实现者认为必须加**：只允许在**作品设定编辑区内**做只读摘要（如「三必已填 x/3」）
- **禁止**扩到 `PlanningInProgressPage` 或其他企划列表页（留给后续卡）
- **不得**在本卡为 `confirm-planning` 增加硬门槛（成熟度硬拦留给 616-B-A2 或协同专项）

### P4：legacy 写入边界（审卡收紧）

| 层 | 规则 |
|----|------|
| **前端 · planning 新路径** | `WorkSettingEditor` 保存时只写 `metadata.workSetting`；该场景下禁用 / 移除对 legacy 六字段的 `MetadataEditor` 写入入口 |
| **后端** | **不做** `PUT /projects/:id` 全局拒绝 legacy 六字段新写入（避免误伤本卡范围外的旧页面、旧入口、只读兼容流） |
| **后端 · 可选双保险** | 仅当请求体显式携带本卡新接入的 `workSetting` 字段时：做结构 normalize / merge；**不**以此为由拦截其他 metadata 键的既有写入行为 |
| **全局封禁** | 留给 **616-B-A2** 或更后面的迁移卡再讨论 |

## 明确不做

- 不处理 **616-C** 作品章节模型、章节验收、拆章 legacy
- 不改 **Prisma schema**、不写 migration
- 不实现创意组 **设定雏形** UI / `_settingSketch` 写入（可留类型占位，不强制）
- 不在 `acceptIntoPlanningCore` 做雏形复制（留给 616-B-A2 或 creative 衔接卡）
- 不硬拦「确认企划完成」「提交创作室」
- 不做旧六字段 → 新四块 **自动迁移** 或「一键复制助手」
- **不做** `PUT /projects/:id` **全局** legacy 六字段写入封禁
- 不改造 `PlanningInProgressPage` 列表页（含准备度条）
- 不重启 WorldBuilding / Character / Timeline 表写入
- 不改 AI prompt 适配层
- 不顺手做 creative 文案清扫、ReferencePicker、企划课列表大重组

## 文件候选

### 必改（前端）

- `frontend/src/pages/WorkDetailPage.tsx` — 作品设定 Tab 接入新编辑器
- `frontend/src/components/metadata/ContentMetadataCard.tsx` — 只读路径识别 `workSetting`；planning 主写入路径迁出
- **新建** `frontend/src/components/metadata/WorkSettingEditor.tsx`（名可微调）
- **新建** `frontend/src/services/workSetting.ts`

### 可能改（前端）

- `frontend/src/components/metadata/MetadataEditor.tsx` — **仅 planning 场景**禁用旧六字段写入入口（非全局删除）

### 可能改（后端 · 最小）

- `backend/src/routes/projects.ts` — `PUT /:id`：当且仅当本卡 `workSetting` 写入路径时，做 `workSetting` normalize/merge 双保险；**不**全局拦截 legacy 六字段

### 明确不改

- `frontend/src/pages/planning/PlanningInProgressPage.tsx`（列表页准备度等）
- `backend/src/routes/proposals.ts`（`acceptIntoPlanningCore`）
- `frontend/src/pages/creative/*`

### 只读参考，默认不改

- `WritingEditorPage` 右侧设定参考（本卡可只读展示新四块，全量创作室体验另卡）

## 执行步骤

1. 只读核对：`WorkDetailPage` 设定 Tab、`MetadataEditor`、`ContentMetadataCard`、企划 save 路径。
2. 落 `workSetting` canonical 键与 helper。
3. 实现 `WorkSettingEditor` + planning 场景接线；封禁**该路径**对 legacy 六字段的新写入。
4. 后端（若改）：仅 `workSetting` 路径最小双保险，**不做**全局 legacy 硬拦。
5. `npm run build` + API smoke + 建议 UI smoke 两条路径。

## 验收标准

```text
[ ] Project.metadata.workSetting 四键可读写（三必 + 一选）

[ ] 企划中（status=planning）作品详情可编辑新版四块描述式设定

[ ] save 不推进 Project.status / 不放行创作室

[ ] planning 新主写入路径不向 legacy 六字段写入新内容

[ ] 其他旧页面 / 旧入口的 metadata 保存行为不因本卡回归（抽样：非 planning 场景若有 legacy 编辑入口仍按改前行为）

[ ] 后端未做 PUT 全局 legacy 六字段硬拦

[ ] 未改造 PlanningInProgressPage 列表页

[ ] 未实现 616-C 章节验收、未硬拦 confirm-planning / release-to-studio

[ ] frontend npm run build 通过

[ ] backend npm run build 通过（若有后端改动）

[ ] API smoke：创建/更新 workSetting；save 后 status 不变

[ ] UI smoke（建议）：
    1. 接收入企划课 → 作品详情 → 编辑三必一选 → 保存 → 刷新仍在 planning
    2. legacy 六字段有数据的项目 → 新 UI 不破坏只读展示
```

## GitHub 审查点

- `workSetting` 是否为 **planning 新路径的唯一新写入目标**（相对 legacy 六字段）
- 后端是否误做 **全局** legacy 封禁
- save 是否误触 status / release 端点
- 是否夹带 616-C、列表页改造、自动拆章、creative `references[]`
- UI 是否回到旧表单子字段 / 「世界观」「设定集」等压迫性标签

## 风险边界

| 风险 | 边界 |
|------|------|
| 新旧 UI 并存混淆 | 本卡仅切 planning 主写入；legacy 只读保留 |
| 全局 legacy 封禁误伤 | 本卡明确禁止；留给 B-A2 |
| 列表页范围膨胀 | P3 默认不做；禁止改 PlanningInProgressPage |
| canonical 键名后续调整 | 本卡裁定四键；变更需新卡 |
| 完成企划无硬拦 | 故意留给 B-A2；PR 须写明 |
| 创意组雏形未继承 | 本卡不复制 Proposal → Project |

## 回报格式

（与 Creative-v2-A 相同：做了什么 / 改了哪些文件 / 如何验证 / 还剩什么 / 风险或阻塞）
