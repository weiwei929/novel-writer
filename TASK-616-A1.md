# TASK-616-A1：产品命名与过渡心智

**宪法依据**：[docs/design/616-content-asset-constitution-v0.2.1.md](docs/design/616-content-asset-constitution-v0.2.1.md) §2.2、§3、§8.1  
**母卡**：[TASK-616-A.md](./TASK-616-A.md)

**状态**：任务卡已确认 · A1 实施完成（待审查）  
**依赖**：无  
**前置**：616 v0.2.1 已落盘于 `docs/design/616-content-asset-constitution-v0.2.1.md`

## 目标

1. **用户可见文案**：「作品元数据 / 内容元数据 / 项目元数据 / 作品内容元数据」→ 容器级 **「作品设定」**。
2. 旧 `settings` 子字段 UI 展示名 → **「背景设定」**（§8.1；**不改 storage key**）。
3. WorkDetail「创作资料」Tab → **「遗留资料（只读）」**（§8.1；保留 Tab 位置，不删不并）。
4. 过渡期内 **不得** 父级「作品设定」与子项「作品设定」同名（§8.1）。

## 修改范围

### P0 — 必改（用户可见）

| 文件 | 变更要点 |
|---|---|
| `frontend/src/pages/WorkDetailPage.tsx` | Tab label、区块标题、按钮「编辑作品设定」、空态/提示；去除用户可见「元数据」；`world` Tab →「遗留资料（只读）」；辅助说明与 §3 一致 |
| `frontend/src/components/metadata/ContentMetadataCard.tsx` | 卡片标题「作品设定」；`settings` label →「背景设定」；编辑 title / 底部提示 |
| `frontend/src/components/editor/WorkMetadataPanel.tsx` | 抽屉标题「作品设定」；`settings` field label →「背景设定」 |
| `frontend/src/components/writer/ReferenceSidebar.tsx` | 「参考作品设定」→ **「写作参考」** |
| `frontend/src/pages/planning/MetadataListPage.tsx` | 标题「作品内容元数据」→「作品设定」或「作品设定（企划）」 |
| `frontend/src/pages/planning/PlanningPage.tsx` | 副文案「作品元数据」→「作品设定」 |
| `frontend/src/pages/writing/WritingProjectPage.tsx` | 只读说明中的「作品内容元数据」→「作品详情 · 作品设定」或等价表述 |
| `frontend/src/components/ai/ChapterOutlineGenerator.tsx` | 用户可见「作品元数据 / 项目元数据」→「作品设定」 |

### P1 — 并入同一 A1 PR（仅文案与 legacy 提示，不改行为）

| 文件 | 变更要点 |
|---|---|
| `frontend/src/components/import/MetadataReviewModal.tsx` | `worldBuilding` 行 label →「背景设定」；「项目元数据面板」→「作品设定」 |
| `frontend/src/components/writer/AIAssistantPanel.tsx` | 「存为作品设定」→「存为背景设定」（key 仍为 `settings`） |
| `frontend/src/pages/planning/MetadataPage.tsx` | Placeholder 标题对齐 616 或标 legacy |
| `frontend/src/pages/planning/MetadataProjectPage.tsx` | legacy 横幅：优先使用作品详情 · 作品设定；本页为遗留资料入口 |

### 文档（同 PR 小改）

| 文件 | 变更要点 |
|---|---|
| `docs/specs/METADATA_FIELD_CONVENTION.md` | 增「616 产品语义」节 |
| `docs/design/0608-constitutional-guidance/0608-design-workdetail-restructure.md` | 文首：产品命名以 616 v0.2.1 为准 |

### 明确不改

- `metadata` / `Project.metadata` / `updateMetadata` 等 **技术命名**
- `FIELDS` / `metadataFields` 的 **storage key**
- `ContextManager.ts` / `PromptManager.ts`
- `WorldBuildingPage` 行为与 API
- `ProjectMetadataPanel.tsx`（orphan；不扩 scope 删文件）
- `ChapterMetadataPanel.tsx`（已 `@deprecated`）

## 验收标准

### 用户可见文案（非机械全库清零）

以下 **允许保留**，不计入验收失败：

- 代码注释、JSDoc、`@deprecated` 文件内说明
- `docs/archive/`、历史 CHANGELOG、未改动的旧设计文档正文
- API 方法名、`metadata` 技术标识、`updateMetadata` 等

### 必须满足

```text
[ ] frontend/src 用户可见 UI 文案（组件渲染字符串、title、placeholder、按钮、Tab label）：
    不得再出现「作品元数据」「内容元数据」「项目元数据」「作品内容元数据」

[ ] 无 UI：父「作品设定」+ 子标签「作品设定」
    （settings / worldBuilding 等已改为「背景设定」）

[ ] WorkDetail world Tab 显示「遗留资料（只读）」

[ ] ContentMetadataCard / WorkMetadataPanel：容器「作品设定」，settings 子项「背景设定」

[ ] npm run build 通过

[ ] PR 截图：WorkDetail Tab1、设定抽屉、遗留资料 Tab、写作编辑器设定弹窗、P1 入口各一
```

## 风险与缓解

| 风险 | 缓解 |
|---|---|
| WorldBuilding 与 JSON 设定文案混用 | legacy 横幅 +「遗留资料」Tab 标注 |
| 改文案后不知去哪编辑 | `WritingProjectPage` 指向作品详情 |

## Git 纪律

- 自 `feature/workdetail-p1` 切分支
- **仅 stage 本任务卡列出的文件** + 本任务新增的 TASK 卡（若尚未跟踪）
- 不 stage 仓库内其他 dirty / untracked 文件

## 部署

适合 **本地 → GitHub 审查 → VPS** 独立发布（以前端文案为主）
