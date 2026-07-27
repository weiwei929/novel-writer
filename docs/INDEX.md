# 文档索引

> **状态**：现役 · 最后核对 2026-07-27

---

## 先读这三份

| 文件 | 回答什么问题 |
|------|-------------|
| **[ROADMAP.md](./ROADMAP.md)** | 项目现在是什么、能做什么、往哪走 |
| **[CURRENT_BASELINE.md](./CURRENT_BASELINE.md)** | 当前分支、已合并内容、暂不做清单（单一真相源） |
| **[../AGENTS.md](../AGENTS.md)** | 多工具协作的角色分工与红线 |

**AI 工具开工，读这三份即可上手。**

---

## 现役文档全集

三份之外，现役区只有这些。**列表之外的一切，都在 `journal/` 或 `archive/` 里，不作为操作依据。**

### 顶层

| 文件 | 用途 |
|------|------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 系统架构与技术栈 |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | 开发环境与工作流程 |
| [README.md](./README.md) | 文档区说明 |

### 操作指南 `guides/`

| 文件 | 用途 |
|------|------|
| [QUICK_START.md](./guides/QUICK_START.md) | 5 分钟跑起来 |
| [DEPLOYMENT.md](./guides/DEPLOYMENT.md) | 生产部署 |
| [CODING_STANDARDS.md](./guides/CODING_STANDARDS.md) | 代码风格 |
| [TESTING_SETUP.md](./guides/TESTING_SETUP.md) | 测试环境 |

### 规格 `specs/`

| 文件 | 用途 |
|------|------|
| [METADATA_FIELD_CONVENTION.md](./specs/METADATA_FIELD_CONVENTION.md) | 元数据字段约定 |
| [AI_FEATURES_SPECIFICATION.md](./specs/AI_FEATURES_SPECIFICATION.md) | ⛔ **已冻结 · 设计留档**，不代表当前能力 |

### 任务卡 `tasks/`

| 文件 | 用途 |
|------|------|
| [README.md](./tasks/README.md) | 任务卡生命周期与约定 |
| [TEMPLATE.md](./tasks/TEMPLATE.md) | 模板 |
| [CURSOR_REFERENCE.md](./tasks/CURSOR_REFERENCE.md) | Cursor 编码约束 |
| [TASK-621-docs-governance.md](./tasks/TASK-621-docs-governance.md) | 🔄 进行中：文档治理 |

已结案任务卡 → [`tasks/archive/`](./tasks/archive/)

### 设计 `design/`

仅保留**仍在指导实现**的设计。

| 文件 | 用途 |
|------|------|
| [616-content-asset-constitution-v0.2.1.md](./design/616-content-asset-constitution-v0.2.1.md) | 内容资产模型（现行依据） |
| [616-B-work-setting-minimal-model-draft.md](./design/616-B-work-setting-minimal-model-draft.md) | 作品设定最小模型 |
| [0608-616-coordination-draft.md](./design/0608-616-coordination-draft.md) | 0608 与 616 的衔接 |
| [design-P1-entry-architecture.md](./design/design-P1-entry-architecture.md) | 入口架构（已收束） |
| [quick-writing-entry-2026-07-07.md](./design/quick-writing-entry-2026-07-07.md) | 快速写作入口（已实施） |
| [design-mode-trial-2026-06-20.md](./design/design-mode-trial-2026-06-20.md) | Design Mode 视觉试验（分支 `ui/design-mode-trial`） |

已实施 / 已过期设计稿 → [`design/archive/`](./design/archive/)

---

## 非现役区

| 位置 | 装什么 | 能否作为依据 |
|------|--------|-------------|
| **[journal/](./journal/)** | 学习档案：思考、讨论、会诊、复盘、随笔（**59 份，一份未删**） | ❌ 只作参考 |
| **[archive/](./archive/)** | 历史归档：已完成的任务卡、里程碑、旧规格 | ❌ 只作溯源 |

学习档案有独立索引：**[journal/INDEX.md](./journal/INDEX.md)** —— 按主题 / 时间 / **结论是否仍成立** 三维检索。

---

## 状态行规则

每份文档标题下应有一行状态标记：

```markdown
> **状态**：现役 · 最后核对 YYYY-MM-DD
> **状态**：学习记录 · 不作为操作依据
> **状态**：⛔ 已冻结 · 设计留档
> **状态**：历史 · 已由 XXX 取代
```

**无状态行的文档，不得作为操作依据。**

理由：状态标记跟着文件走。文件被移动、被搜索命中、被另一个 AI 读到时，标记都在；而集中式索引必须靠人同步——本仓库已经证明它会掉队（本文件曾滞后 17 天，并遗漏整整 26 份文件）。

---

## 维护约定

- 新增现役文档 → 加状态行 + 在本文件登记
- 文档失效 → **改状态行**，而不是等着谁来更新索引
- 过程性记录 → 直接放 `journal/`，不进现役区
