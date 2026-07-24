# Novel Writer — 当前基线

> **单一真相源**：协作状态、已合并战役、下一战、暂不做项，以此文件为准。

**最后更新**：2026-07-24（quick-writing-loop 收束与测试防线建立）

---

## 当前基线

| 项 | 值 |
|----|-----|
| **主分支** | `feature/workdetail-p1`（含 PR #7–#15、`quick-writing-loop` 合并点 `5bdc507`） |
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
| **616-D** | 企划 → 创作室交接（**主链已贯通**） |
| ↳ D-A | PR [#11](https://github.com/weiwei929/novel-writer/pull/11) · [TASK-616-D-A.md](./tasks/TASK-616-D-A.md) start-writing materialize |
| ↳ D-B | PR [#12](https://github.com/weiwei929/novel-writer/pull/12) · [TASK-616-D-B.md](./tasks/TASK-616-D-B.md) 创作室只读参考（设定 / 本章） |
| ↳ D-C | PR [#13](https://github.com/weiwei929/novel-writer/pull/13) 写作器入口可用性（作品详情 + 创作室列表 → 自动进写作器） |
| ↳ D-D | PR [#14](https://github.com/weiwei929/novel-writer/pull/14) 写作参考侧栏 legacy 降噪（一级 Tab 仅设定 / 本章） |
| **quick-writing** | [TASK-618-quick-writing-loop.md](./tasks/TASK-618-quick-writing-loop.md) · HomePage「继续写作」入口与保存可靠性解耦 |
| **draft-recovery** | [TASK-619-draft-recovery-offline-guard.md](./tasks/TASK-619-draft-recovery-offline-guard.md) · 创作室本地草稿自动镜像与一键恢复横幅 |
| **release gate** | commit `43b9c24` — `backend` `build` / `lint` 前置 `prisma generate` |

0608 五部门骨架、616-A 命名/梗概等见历史封版记录。

**企划 → 创作室主链（已贯通）：**

```text
_settingSketch → workSetting + chapterPlanning
  → confirm（B 三必 + C 最低章节）
  → release-to-studio → start-writing（materialize → chapters）
  → 写作器：入口（D-C）+ 参考侧栏设定/本章（D-B/D-D）+ 正文保存
```

| 阶段 | SSOT / 载体 |
|------|-------------|
| 企划课设定 | `metadata.workSetting` |
| 企划课章节规划 | `metadata.chapterPlanning` |
| 创作室章节/正文 | `chapters` 表（D-A materialize 后） |
| 创作室参考（主） | `workSetting` + `Chapter.summary`（D-B / D-D 只读） |
| 创作室参考（legacy） | `Character` / `TimelineEntry` / `CreativeFlow` 表 → 折叠「遗留参考」（D-D） |

---

## 当前状态判断

- **616-D 主链人工 smoke 已通过**（作品详情入口、列表入口、正文保存、侧栏参考）
- **2.0 主骨架初步成型**（五部门导航、WorkDetail 中枢、创作室编辑器、616 内容主链）

---

## 已知风险

| 风险 | 说明 |
|------|------|
| 空测试 | `npm run test` 仍为占位，无真实用例 |
| CSS minify warning | 前端 `vite build` 偶发 CSS 压缩告警 |
| Prisma deprecation | Prisma 7 将弃用 `package.json#prisma` 等配置 |
| Windows DLL 锁 | `npm run build` / `lint` 会触发 `prisma generate`；backend dev 运行时可能锁 `query_engine-windows.dll.node`，需先停 dev |
| legacy 数据层 | 人物 / 故事线 / 心流表与 legacy metadata 未清理，仅 UI 降噪 |

---

## 当前推荐下一战

**战果归档 / 休整** — 616-D（D-A–D-D）已收束；无授权新实现卡前不主动开战役。

可选后续（非当前授权）：

- 616 阶段复盘与 TASK 封板补全（D-C / D-D）
- 测试补强（替换空 `npm test`）
- legacy 数据层后续清理（不删表，逐步降级）
- `DEVELOPMENT.md` 其余章节与现仓对齐
- `release-to-studio` 门槛改造

---

## 暂不做

- P1-c 及入口文案大收口
- `release-to-studio` 门槛改造（未授权）
- 正文编辑器大改
- 创作室改 `summary` / 章节结构 SSOT
- legacy 表删除 / 全局写入封禁
- 长篇立宪文档修订

---

## 设计依据

- `docs/design/616-content-asset-constitution-v0.2.1.md`
- `docs/design/616-B-work-setting-minimal-model-draft.md`
- `docs/design/0608-616-coordination-draft.md`
- `docs/tasks/TASK-616-D-consultation.md`（616-D 会诊 · 已结案）
- `docs/design/design-P1-entry-architecture.md`（P1 已收束）
