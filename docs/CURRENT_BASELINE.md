# Novel Writer — 当前基线

> **单一真相源**：协作状态、已合并战役、下一战、暂不做项，以此文件为准。  
> **维护**：战役封版或 merge 后更新；根目录散落 `TASK-*.md` 不再作为基线依据。

**最后更新**：2026-06-17（616-B 封版）

---

## 当前基线

| 项 | 值 |
|----|-----|
| **主分支** | `feature/workdetail-p1` @ `0447350` |
| **产品版本** | 2.0（五部门管线 + 616 设定侧已闭环） |
| **协作档位** | 轻量战役制 |

---

## 已合并战役

| 战役 | 摘要 |
|------|------|
| **0608 P1–P4** | 五部门三工作区骨架、路由、`?from=` 上下文、WorkDetail 守卫收口 |
| **616-A** | 产品命名「作品设定」、梗概双轨读模型、遗留资料只读 |
| **616-B** | 设定侧闭环 — 见 [TASK-616-B-closure.md](./tasks/TASK-616-B-closure.md) |
| ↳ B-A | `workSetting` 四块编辑器（企划课） |
| ↳ B-A2 | 立项继承 + 确认企划三必硬拦 |
| ↳ B-A3 | 创意组设定雏形 UI |

---

## 当前推荐下一战

**P1-a：入口治理（裸链 + dashboard 绕路）**

- 设计依据：`design-P1-entry-architecture.md`（根目录，待入库或摘录）
- 执行卡：待 Codex 审卡 / 司令部授权
- 616-C 仅设计讨论，**不开实现**

---

## 暂不做

- **616-C** 章节模型实现
- 完成企划的章节成熟度门槛
- `release-to-studio` / 创作室放行门槛
- legacy 六字段迁移 / 全局写入封禁
- P1 全量一次收口（先 P1-a，再 P1-b）
- 新增长篇立宪文档

---

## 轻量战役制

1. 未 merge 的实现 PR 不开新实现战役
2. 执行卡先做只读核验（HEAD、关键符号、与假设差异）
3. 小卡：目标 / 范围 / 不做 / 验收 / 回报
4. Codex 审卡封版；Cursor 实现；司令部拍板 merge
5. 文档以本文件 + `docs/tasks/` 为准

---

## 设计依据

- 流程：`docs/design/0608-constitutional-guidance/`
- 内容：`docs/design/616-content-asset-constitution-v0.2.1.md`
- 设定模型：`docs/design/616-B-work-setting-minimal-model-draft.md`
- 流程×内容交界：`docs/design/0608-616-coordination-draft.md`

---

## 已知滞后（非阻塞）

- 根 `README.md`、里程碑文档偏旧
- 根目录历史 `TASK-*.md` 未入库
