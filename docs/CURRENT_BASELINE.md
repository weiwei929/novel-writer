# Novel Writer — 当前基线

> **单一真相源**：协作状态、已合并战役、下一战、暂不做项，以此文件为准。

**最后更新**：2026-06-17（616-C-A 合并后）

---

## 当前基线

| 项 | 值 |
|----|-----|
| **主分支** | `feature/workdetail-p1`（含 PR #7–#9） |
| **协作档位** | 轻量战役制 · **小卡快审 / 低风险快合** |

---

## 已合并战役

| 战役 | 摘要 |
|------|------|
| **616-B** | 设定侧闭环 — [TASK-616-B-closure.md](./tasks/TASK-616-B-closure.md) |
| **P1 入口治理** | **暂收束**（不做 P1-c） |
| ↳ P1-a | PR [#7](https://github.com/weiwei929/novel-writer/pull/7) 创意组裸链 → 企划课承接 |
| ↳ P1-b | PR [#8](https://github.com/weiwei929/novel-writer/pull/8) ShelfPage / ProjectCard `?from=` 治理 |
| **616-C-A** | 章节规划 canonical — PR [#9](https://github.com/weiwei929/novel-writer/pull/9) · [TASK-616-C-A.md](./tasks/TASK-616-C-A.md) |

0608 五部门骨架、616-A 命名/梗概等见历史封版记录。

**616-C-A 收束要点：**

- `metadata.chapterPlanning` canonical = `order` / `title` / `summary`
- 企划课 planning 保存只写 metadata，**不写 `chapters` 表**
- legacy `synopsisText` 兼容读取；持久化 canonical

---

## 当前推荐下一战

**616-C-A2：confirm-greenlight 接入章节 readiness** — [TASK-616-C-A2.md](./tasks/TASK-616-C-A2.md)

- 完成企划 = **B 三必 + C 最低章节**（前后端 confirm 双保险）
- 616-D 仍暂不实现

---

## 暂不做

- P1-c 及入口文案大收口
- 616-D 实现
- legacy 迁移 / 全局写入封禁
- `release-to-studio` 门槛改造
- 长篇立宪文档

---

## 设计依据

- `docs/design/616-content-asset-constitution-v0.2.1.md`
- `docs/design/616-B-work-setting-minimal-model-draft.md`
- `docs/design/0608-616-coordination-draft.md`
- `docs/tasks/TASK-616-C-D-consultation.md`（C/D 会诊结论）
- `design-P1-entry-architecture.md`（根目录，P1 已收束）
