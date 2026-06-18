# TASK-616-A 闭环记录

**状态**：A 阶段已收官（2026-06-16）  
**目标分支**：`feature/workdetail-p1`  
**当前 HEAD**：`76f14aa`（Merge 616-A2 into feature/workdetail-p1）

## PR 与提交

| PR | 分支 | 合并内容 | 关键 commit |
|---|---|---|---|
| [#1](https://github.com/weiwei929/novel-writer/pull/1) | `feature/616-a-naming-readmodel` → `feature/workdetail-p1` | 616 宪法 v0.2.1、A 阶段任务卡、**A1** 命名与遗留只读 | `6db4833`（治理）+ `eab0398`（A1）→ `fd2b622` |
| [#2](https://github.com/weiwei929/novel-writer/pull/2) | `feature/616-a2-synopsis` → `feature/workdetail-p1` | **A2** 梗概读模型、后端双写、review fix | `898e901` + `c1e0bf9` → `76f14aa` |

## A1 解决了什么

- 用户可见「作品元数据」等旧称 → **作品设定**；`settings` UI → **背景设定**（storage key 不变）
- WorkDetail / 企划 / 写作 / 提案评估等：**遗留资料（只读）** + 固定 `WorldBuildingPage readOnly`
- 文档：`METADATA_FIELD_CONVENTION.md` §616、0608 WorkDetail 设计文首指向 616

## A2 解决了什么

- 前端共享 `getWorkSynopsis(description, metadata)`：`metadata.synopsis` → `description` fallback
- 读模型统一：WorkDetail 主梗概区、ProjectNavigationPanel、WorkMetadataPanel、MetadataEditor（仅 synopsis）
- 后端单点双写：立项 `acceptIntoPlanningCore`；`PUT /projects/:id`；`confirm-metadata` 复用同一逻辑
- 空值策略：立项无梗概不写；用户清空则 `metadata.synopsis = ''`、`description = null`
- Review fix（`c1e0bf9`）：局部 `metadata` 更新浅合并，避免覆盖旧 JSON；仅更新 `description` 时同步 `metadata.synopsis`

## A 阶段明确未解决（留给后续）

| 项 | 归属建议 |
|---|---|
| 旧六字段 / `settings` 禁止新写入 | **616-B** |
| 作品设定内部字段结构重构 | **616-B** |
| `ContentMetadataCard` synopsis 无 description fallback | **616-B** 或 A2.5 小卡 |
| Tab 大重组 | 616 宪法 §8 |
| DB 迁移、删 `description` / metadata 键 | 616-B 及以后 |
| 作品预期字段与 UI | 未立项 |
| 编审 / 文集四块同模型视图 | **616-C** |
| import 自动提取链梗概收口 | 另立卡 |
| `CreateProjectModal` 前端双写路径收敛 | 非 A2 范围；可随 P1 或 B 处理 |

## 验收摘要

- [x] A1 用户可见旧称 grep 通过（注释 / orphan / `@deprecated` 除外）
- [x] 所有 `WorldBuildingPage` 入口固定只读
- [x] A2 本地 smoke：立项双写、清空梗概、局部 metadata、description 单向同步
- [x] `frontend` / `backend` `npm run build` 通过
- [ ] `baseline-e2e-v01.mjs` 全量（审查期未跑，可补）

## 战后整理：stash 处置建议

**勿 `stash pop` 全量弹回。** 当前 stash：

### `stash@{1}` — `wip non-616 pre-A2`（20 文件，P1/creative 并行线）

| 类别 | 文件 | 建议 |
|---|---|---|
| **值得恢复（需按 A2 基线重审）** | `ProjectNavigationPanel.tsx` | 仅 P1 命名/组件：`ChapterPlanningEditor`→`WorkChapterEditor`、按钮「编辑作品章节」；**保留**现有 `getWorkSynopsis` 读路径，手工 cherry-pick |
| **值得恢复** | `ChapterManager.tsx`、`PlanningInProgressPage.tsx`、`PlanningProjectsPage.tsx` | P1 章节/企划入口，单独审后恢复 |
| **值得恢复** | `CreateProjectModal.tsx`、`ProjectCard.tsx` | 表单简化；与 A2 后端双写无冲突，但需 smoke 创建路径 |
| **creative 线** | `CreativeDiscussion`、`ReferencePicker`、`TypeLabel`、`ChatPage`、`ProposalsPage`、`ReferencesPage` | 按 creative 战役优先级逐文件审 |
| **设计 doc** | `code-conflict-analysis`、`day1-design`、`overall-architecture` 等 7 个 | 非代码；确认是否与当前设计线一致再决定是否恢复 |
| **低优先** | `frontend/src/types/version.ts` | 构建产物类变更，通常可丢弃 |

### `stash@{0}` — `wip local dirt`（A2 期间误操作残留）

| 文件 | 建议 |
|---|---|
| `WorkDetailPage.tsx` | **丢弃** — 整文件换行符噪音，无功能增量 |
| `proposals.ts` | **丢弃** — 1 行无意义差异 |
| `StageTransitionModal.tsx`（删除） | **单独决策** — 若为 P1 有意删除，应在 P1 任务卡下重做 commit，勿与 stash pop 混用 |

## 下一步（司令部建议）

1. ~~616-A 闭环~~（本文档）
2. 按上表**分文件**恢复 stash，先 `git stash show -p "stash@{N}" -- <path>` 审 diff
3. **暂不启动 616-B** — B 涉及旧六字段封禁与设定结构，需重新会诊后再授权
