# Day 1 设计审阅 — v4.1 / v4.1.1 落库说明

> **v4.1**：2026-06-04，`ecec09a`  
> **v4.1.1**：Claude 对齐微修订（灵感手记、`_planningPhase`、迁移 Q1/Q2）

---

## 权威源（VPS 仓库为准）

```
入门 → docs/design/day1-handoff-brief.md
全文 → docs/design/overall-architecture.md v4.1.1
映射 → docs/design/v2-migration-map.md v4.1.1
索引 → docs/design/README.md + docs/tasks/CURSOR_REFERENCE.md
day1-design.md → 06-03 快照（非权威）
```

Claude 本机 v4.1 草稿**不是**权威源；以 VPS `v2-dev` 提交为准。

## v4.1 落库修正（ecec09a）

- `shelved` / `approved` / `planned` / 立项总账 / §4.4 等内部矛盾
- 新增 `v2-migration-map.md`、`code-conflict-analysis` C-01~18

## v4.1.1 微修订（Claude 回应 Cursor）

| 项 | 处理 |
|----|------|
| L2「灵感碎片」→「灵感手记」 | `overall-architecture.md` §一/§3.3/§8.4；`CURSOR_REFERENCE.md` |
| `metadata._planningPhase` | `v2-migration-map.md` §0；`overall-architecture.md` §二 |
| Proposal `approved` + Project `planning` 双轨 | `v2-migration-map.md` §2.1 |
| 迁移 Q1 proposalId / Q2 draft 区分 | `v2-migration-map.md` §2.2 |
| evaluate 存量 SQL | `v2-migration-map.md` §2.3 |

## 仓库中不存在的 Claude 引用文件

- `planning-dept-v2.md`、`day1-design-source.md` — **未在 VPS 仓库**；内容已并入 `overall-architecture.md` §四。若 Claude 本机仍有副本，以 VPS 为准合并后删除重复。

## 暂不 push

v4.1.1 文档稳定后再 push `origin/v2-dev`（用户/Claude 共识）。

## 设计债（Day 2+）

- §6.3 编审「退回修改」与跨阶段不退回 — Day 2 编审专稿
- `planningPhase` 真字段 — Day 1.1+

## C-19 ~ C-21（v4.1.1+）

| 编号 | 阻塞 TASK-200？ | 阻塞 M1 验收？ |
|------|----------------|----------------|
| C-19 `_planningPhase` UI | 否（M2） | 否 |
| C-20 `proposalId` 关联 UI | 否 | **是**（M1-B） |
| C-21 创意组 `approved` 徽章 | 否 | **是**（M1-B） |

原「C-19 = /shelf」已重编号为 **C-22**（M3）。

## 发卡门禁（7/7 文档绿）

- M1-A：**现在可发** TASK-200~204（后端）
- M1-B：205~209，验收必过 C-20/C-21
- 孤儿 `planning-dept-v2.md` / `writing-studio-v2.md`：仅 Claude 本机清理，VPS 无此文件
