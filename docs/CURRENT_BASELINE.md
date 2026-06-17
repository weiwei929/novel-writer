# Novel Writer — 当前基线

> **单一真相源**：协作状态、已合并战役、下一战、暂不做项，以此文件为准。  
> **维护**：战役封版或 merge 后更新；根目录散落 `TASK-*.md` 不再作为基线依据。

**最后更新**：2026-06-17

---

## 当前基线

| 项 | 值 |
|----|-----|
| **主分支** | `feature/workdetail-p1` |
| **产品版本** | 2.0（五部门管线 + 616 语义校准中） |
| **协作档位** | 轻量战役制（见下文） |

> 本地 clone 若仍停在旧 feature 分支，先 `git fetch` 并对齐 `feature/workdetail-p1` 再开新战役。

---

## 已合并战役

| 战役 | 摘要 |
|------|------|
| **0608 P1–P4** | 五部门三工作区骨架、路由、`?from=` 上下文、WorkDetail 守卫收口 |
| **616-A** | 产品命名「作品设定」、梗概双轨读模型、遗留资料只读 |
| **616-B-A** | `Project.metadata.workSetting` 四块编辑器（企划课主路径） |
| **616-B-A2** | 立项时 `_settingSketch` → `workSetting` 继承；确认企划完成三必硬拦（前后端双保险） |

---

## 当前推荐下一战

**616-B-A3：创意组设定雏形 UI**

- 把 `_settingSketch` 从「API 可测」变成「用户可填、可存、立项可继承」
- 任务卡：`docs/tasks/TASK-616-B-A3.md`（待 Codex 审卡）

---

## 暂不做

- **616-C** 作品章节模型主战役
- 完成企划的**章节成熟度**门槛（≥1 章、梗概等）
- `release-to-studio` / 创作室放行门槛改造
- legacy 六字段 → `workSetting` 自动迁移
- `PUT` 全局 legacy 写入封禁
- P1 入口治理大收口（可单独立项，不与此战捆绑）
- 新增长篇「司令部裁定」式总纲文档

---

## 轻量战役制（协作规则）

1. **未 merge 的实现 PR 不开新实现战役**（设计讨论除外）
2. **每张执行卡先做只读核验**：当前 HEAD、关键符号、与卡假设差异；差异大则缩卡
3. **小卡结构**：目标 / 范围 / 不做 / 验收 / 回报（不写长篇裁定）
4. **分工**：Codex 管边界、审卡、封版；Cursor 做实现与只读评估；用户（司令部）拍板 merge
5. **文档**：本文件 + 必要 CHANGELOG；任务卡合并进 `docs/tasks/`，避免根目录堆积

---

## 设计依据（只读引用）

- 流程：`docs/design/0608-constitutional-guidance/`
- 内容：`docs/design/616-content-asset-constitution-v0.2.1.md`
- 设定模型：`docs/design/616-B-work-setting-minimal-model-draft.md`
- 流程×内容交界：`docs/design/0608-616-coordination-draft.md`

---

## 已知滞后（非阻塞）

- 根 `README.md` 未反映 616 战役（低优先）
- `docs/milestones/PROJECT_MILESTONE_SUMMARY.md` 仍为 v1.0 技术栈描述
- 根目录历史 `TASK-*.md` 未入库，以本文件与 `docs/tasks/` 为准
