# TASK-616-A2：梗概读写收口

**宪法依据**：[docs/design/616-content-asset-constitution-v0.2.1.md](docs/design/616-content-asset-constitution-v0.2.1.md) §2.1、§7.1、§8.2  
**母卡**：[TASK-616-A.md](./TASK-616-A.md)

**状态**：**已合并**（PR #2 → `feature/workdetail-p1`，含 review fix `c1e0bf9`）  
**依赖**：**TASK-616-A1 已合并**  
**前置**：616 v0.2.1 已落盘

## 目标

按 §7.1 统一 **作品基础信息 · 梗概**：

| 操作 | 规则 |
|---|---|
| **读** | 优先 `metadata.synopsis`，fallback `description` |
| **写（新数据）** | 双写 `metadata.synopsis` 与 `description` |
| **旧数据** | 仅 `description` 仍可展示 |

不处理作品预期、作品设定内部结构、DB 迁移、旧六字段写入封禁（616-B）。

## 读模型边界（司令部确认）

- **仅「梗概 / synopsis」** 走 `metadata.synopsis` → `description` fallback。
- **其他作品设定字段**（`characters`、`timeline`、`settings` 等）仍按各自现有兼容逻辑读取（如 `readMetadataFieldValue`、直读 `metadata[key]`）。
- **禁止** 把所有设定字段统一套成梗概 fallback 逻辑。

## 双写原则（司令部确认）

- **强制后端单点**处理双写。
- 前端 **只消费** 统一后的读取结果，不在 `MetadataEditor` 等处单独维护一套双写。
- 优先覆盖：**立项路径**（`acceptIntoPlanningCore`）及项目更新中涉及 synopsis 的写入。

## 修改范围

### 必改

| 文件 | 变更要点 |
|---|---|
| `frontend/src/utils/metadataField.ts` 或新建 `workSynopsis.ts` | 抽出共享 `getWorkSynopsis(description, metadata)`，实现 §7.1 读规则 |
| `frontend/src/pages/WorkDetailPage.tsx` | 使用共享 helper；删除或内联重复逻辑 |
| `frontend/src/components/editor/ProjectNavigationPanel.tsx` | 梗概展示改用 `getWorkSynopsis`（当前仅读 `metadata.synopsis`） |
| `backend/src/routes/proposals.ts` | `acceptIntoPlanningCore`：由 `proposal.synopsis` **后端双写** `description` + `metadata.synopsis` |

### WorkMetadataPanel / MetadataEditor（限定范围）

| 文件 | 变更要点 |
|---|---|
| `frontend/src/components/editor/WorkMetadataPanel.tsx` | **仅当预览/编辑字段为 `synopsis` 时** 使用 `getWorkSynopsis` 或等价读逻辑 |
| `frontend/src/components/metadata/MetadataEditor.tsx` | 同上：**仅 `field === 'synopsis'`** 时走梗概读模型；其他 field 不变 |

### 建议改（同 PR，后端优先）

| 文件 | 变更要点 |
|---|---|
| `backend/src/routes/projects.ts` | `confirm-metadata` 或 `PUT /projects/:id`：synopsis 写入时后端双写 `description`（与立项逻辑共用辅助函数为佳） |

### 验证脚本

| 文件 | 变更要点 |
|---|---|
| `scripts/baseline-e2e-v01.mjs` | 梗概相关用例仍 pass；可选增「立项后 metadata.synopsis 存在」 |

### 明确不改

- 作品预期字段与 UI
- 作品设定内部结构
- 旧六字段 / `settings` 禁止新写入（616-B）
- import 自动提取链（另立卡）
- 删 `description` 或 metadata 键
- Prisma schema
- 非 synopsis 字段的读取逻辑

## 验收标准

```text
[ ] getWorkSynopsis：metadata.synopsis 优先；仅 description 的旧项目仍显示梗概

[ ] 非 synopsis 字段：读取行为与 A2 前一致（抽样：characters、settings 各一条）

[ ] 新立项（Proposal → acceptIntoPlanning）：
    后端双写；project.description 与 project.metadata.synopsis 均有值且一致

[ ] WorkDetail 梗概区与 ProjectNavigationPanel 展示一致

[ ] 前端无独立双写逻辑（review 确认双写仅在 backend）

[ ] scripts/baseline-e2e-v01.mjs 梗概相关用例 pass

[ ] A1 文案回归：用户可见 UI 仍无「元数据」旧称

[ ] npm run build 通过；立项路径本地 smoke 一条
```

## 实施备注

- 建议新增后端小函数，例如 `applySynopsisWrite(project, synopsisText)`，立项与 confirm-metadata 共用。
- `WorkDetailPage` L365–368 双源提示：可对 **仅历史分裂数据** 保留；新数据双写后是否简化，PR 中说明即可，**非 A2 必做**。

## Git 纪律

- 在 A1 已合并的分支上继续，或 rebase 后实施
- **仅 stage 本任务卡列出的文件**
- A2 单独 commit，message 区分于 A1

## 风险与缓解

| 风险 | 缓解 |
|---|---|
| 触及立项唯一写入点 | 手工立项 + E2E |
| 误将全字段套梗概逻辑 | 按上文「读模型边界」code review |
| 前后端各写一半 | 司令部已裁定后端单点 |

## 部署

**本地 + E2E → GitHub 审查 → VPS**；建议与 A1 **同分支**（A1 commit → A2 commit）
