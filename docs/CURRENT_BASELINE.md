# Novel Writer — 当前基线

> **单一真相源**：协作状态、已合并战役、下一战、暂不做项，以此文件为准。

**最后更新**：2026-06-17（616-D-A 合并后）

---

## 当前基线

| 项 | 值 |
|----|-----|
| **主分支** | `feature/workdetail-p1`（含 PR #7–#11） |
| **协作档位** | 轻量战役制 · **小卡快审 / 低风险快合** |

---

## 已合并战役

| 战役 | 摘要 |
|------|------|
| **616-B** | 设定侧闭环 — [TASK-616-B-closure.md](./tasks/TASK-616-B-closure.md) |
| **P1 入口治理** | **暂收束**（不做 P1-c） |
| ↳ P1-a | PR [#7](https://github.com/weiwei929/novel-writer/pull/7) 创意组裸链 → 企划课承接 |
| ↳ P1-b | PR [#8](https://github.com/weiwei929/novel-writer/pull/8) ShelfPage / ProjectCard `?from=` 治理 |
| **616-C** | 章节规划侧闭环（企划课） |
| ↳ C-A | PR [#9](https://github.com/weiwei929/novel-writer/pull/9) · [TASK-616-C-A.md](./tasks/TASK-616-C-A.md) |
| ↳ C-A2 | PR [#10](https://github.com/weiwei929/novel-writer/pull/10) · [TASK-616-C-A2.md](./tasks/TASK-616-C-A2.md) |
| **616-D-A** | start-writing materialize — PR [#11](https://github.com/weiwei929/novel-writer/pull/11) · [TASK-616-D-A.md](./tasks/TASK-616-D-A.md) |

0608 五部门骨架、616-A 命名/梗概等见历史封版记录。

**企划 → 创作室主链（已贯通）：**

```text
_settingSketch → workSetting + chapterPlanning
  → confirm（B 三必 + C 最低章节）
  → start-writing（materialize → chapters）
  → 创作室写 Chapter.content
```

| 阶段 | SSOT / 载体 |
|------|-------------|
| 企划课设定 | `metadata.workSetting` |
| 企划课章节规划 | `metadata.chapterPlanning` |
| 创作室章节/正文 | `chapters` 表（D-A materialize 后） |

---

## 当前推荐下一战

**616-D-B：创作室只读参考 / 本章梗概展示收口** — [TASK-616-D-B.md](./tasks/TASK-616-D-B.md)

- 写作器明确只读展示 `workSetting` + 当前章 `Chapter.summary`
- 不改正文编辑逻辑；不碰 `release-to-studio`

---

## 暂不做

- P1-c 及入口文案大收口
- `release-to-studio` 门槛改造
- 正文编辑器大改（D-B 仅加只读参考）
- 创作室改 `summary` / 章节结构
- legacy 迁移 / 全局写入封禁
- 长篇立宪文档

---

## 设计依据

- `docs/design/616-content-asset-constitution-v0.2.1.md`
- `docs/design/616-B-work-setting-minimal-model-draft.md`
- `docs/design/0608-616-coordination-draft.md`
- `docs/tasks/TASK-616-D-consultation.md`（616-D 会诊 · 已结案）
- `design-P1-entry-architecture.md`（根目录，P1 已收束）
