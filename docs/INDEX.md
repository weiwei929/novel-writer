# 文档索引

欢迎来到 Novel Writer 文档中心。

> **Agent 入口**：[AGENTS.md](../AGENTS.md) — 先读 `CURRENT_BASELINE` → `CURSOR_REFERENCE` → `ARCHITECTURE`
>
> **本索引最后更新**：2026-07-07（补全 2026 年 thinklog / 设计 / 任务卡索引）

---

## 单一真相源（SSOT）

协作状态、已合并战役、暂不做项，以这些文件为准：

| 文件 | 用途 |
|------|------|
| [AGENTS.md](../AGENTS.md) | 多 Agent 协作总纲（角色、主战场、worktree、冻结分支） |
| [CURRENT_BASELINE.md](./CURRENT_BASELINE.md) | 当前基线、主分支、616-D 主链、暂不做清单 |
| [BASELINE_E2E_V01.md](./BASELINE_E2E_V01.md) | 核心流程 E2E 验证清单（历史基线记录） |
| [tasks/CURSOR_REFERENCE.md](./tasks/CURSOR_REFERENCE.md) | Cursor 编码规范与实现约束 |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 系统架构、技术栈、设计决策 |

---

## 核心文档

- **[项目概述](./README.md)** — 项目简介、功能特性、快速开始
- **[开发指南](./DEVELOPMENT.md)** — 开发环境、工作流程、最佳实践

---

## 任务卡

- **[任务卡说明](./tasks/README.md)** — 生命周期、格式、目录约定
- **[任务卡模板](./tasks/TEMPLATE.md)**

### 活跃 / 参考任务卡

| 类别 | 文件 | 说明 |
|------|------|------|
| 工作区治理 | [TASK-617-A](./tasks/TASK-617-A-cursor-self-optimize.md) | Cursor 规则、根目录大扫除（已执行） |
| 616 战役 | [616-B 收束](./tasks/TASK-616-B-closure.md)、[616-C-A](./tasks/TASK-616-C-A.md)、[616-C-A2](./tasks/TASK-616-C-A2.md)、[616-D-A](./tasks/TASK-616-D-A.md)、[616-D-B](./tasks/TASK-616-D-B.md) | 已合并战役的结案/参考卡 |
| P1 入口 | [P1-a](./tasks/TASK-P1-a-entry-governance.md)、[P1-b](./tasks/TASK-P1-b-entry-governance.md) | 入口治理（已收束） |
| 历史编号 | [TASK-001](./tasks/TASK-001.md)～[TASK-016](./tasks/TASK-016.md)、[TASK-200](./tasks/TASK-200.md)～[TASK-204](./tasks/TASK-204.md) | 早期运维/迁移任务 |

### 已归档任务卡

- **[docs/tasks/archive/](./tasks/archive/)** — 30 份已结案 TASK（`TASK-p0-*`、`TASK-p1-*`、`TASK-616-A*` 等；2026-06-18 TASK-617-A 归档）

---

## 设计文档

- **[设计文档索引](./design/README.md)** — Day 1 权威链、历史参考、协作入口

### 当前活跃

| 文件 / 目录 | 说明 |
|-------------|------|
| [quick-writing-entry-2026-07-07.md](./design/quick-writing-entry-2026-07-07.md) | HomePage 快速入口设计；原「新建作品直达写作页」方案已证伪，更正为「继续写作」（恢复最近创作中作品/章节，不新建对象），已实施 |
| [design-mode-trial-2026-06-20.md](./design/design-mode-trial-2026-06-20.md) | Design Mode 视觉试验记录；代码在分支 `ui/design-mode-trial` |
| [0608-constitutional-guidance/](./design/0608-constitutional-guidance/) | 0608 立宪指导与 workspace 模型 |
| [616-content-asset-constitution-v0.2.1.md](./design/616-content-asset-constitution-v0.2.1.md) | 616 内容资产宪法 |

### 历史 / 参考

- [design/archive/](./design/archive/) — 早期流程讨论、侦察任务书等
- [plan/](./plan/) — Day 1 审阅、Claude ↔ Cursor 对齐记录

---

## 详细指南

- **[部署指南](./guides/DEPLOYMENT.md)** — 生产环境部署、配置、维护
- **[编码规范](./guides/CODING_STANDARDS.md)** — 代码风格、命名约定
- **[快速开始](./guides/QUICK_START.md)** — 5 分钟快速上手
- **[测试设置](./guides/TESTING_SETUP.md)** — 测试环境、测试策略

---

## 规格说明

- **[AI 功能规格](./specs/AI_FEATURES_SPECIFICATION.md)**
- **[元数据字段约定](./specs/METADATA_FIELD_CONVENTION.md)**

---

## Thinklogs（开发随笔）

- **[Thinklog 说明](./thinklogs/README.md)** — 什么是 Thinklog、编写模板

### 2025

- [2025-11-04: 文档重构报告](./thinklogs/2025-11-04_Documentation_Restructure_Report.md)
- [2025-11-04: UX 改进报告](./thinklogs/2025-11-04_UX_Improvements_Report.md)
- [2025-12-08: 技术栈评估](./thinklogs/2025-12-08_Tech_Stack_Evaluation.md)
- [2025-12-11: 对齐与粒度](./thinklogs/2025-12-11_Thinklog_Alignment_and_Granularity.md)
- [2025-12-13: 注入灵魂与系统稳定性](./thinklogs/2025-12-13_Thinklog_Injecting_Soul_and_System_Stability.md)
- [2025-12-15: 架构的自我校准](./thinklogs/2025-12-15_Thinklog_Architecture_Calibration.md)
- [2025-12-24: 从审查到重生](./thinklogs/2025-12-24_Thinklog_From_Review_to_Rebirth.md)

### 2026 — 项目治理（TASK-617-A）

- [2026-06-18: 项目文件治理通报](./thinklogs/2026-06-18-project-governance-update.md)
- [Ponytail 适用性评估](./thinklogs/ponytail-evaluation.md)

### 2026 — 入口 / 战役 A+B / Pipeline

- [入口交互治理 — 修正版审计](./thinklogs/audit-entry-corrected.md)
- [三方讨论：命名规范 + 战役 A + B](./thinklogs/discussion-three-way-campaign-ab.md)
- [战役 A + B 执行指令](./thinklogs/campaign-ab-execution.md)
- [Pipeline 审计](./thinklogs/cursor-pipeline-audit.md)
- [Pipeline 断裂修复（P0 × 3）](./thinklogs/cursor-pipeline-fix.md)

### 2026 — 三问题修复

- [三问题讨论纲要](./thinklogs/cursor-discussion-three-issues.md)
- [三问题执行指令](./thinklogs/cursor-execution-three-issues.md)
- [WorkDetailPage 语义返回修复](./thinklogs/cursor-backnav-fix.md)

### 2026 — Git / 分支卫生

- [2026-07-06: 分支回溯 + 换行符/视觉改动分离提交](./thinklogs/2026-07-06_Thinklog_Git_Branch_Audit_and_Hygiene.md)

---

## 归档文档

历史文档、评估报告、计划文档等，便于查阅但不干扰当前开发：

- **[归档说明](./archive/ARCHIVE_README.md)**
- **[评估报告](./archive/evaluations/)**
- **[计划文档](./archive/plans/)**
- **[演示文档](./archive/presentations/)**
- **[其他归档](./archive/)** — 含 `2025_12_11logs/`、`code-snapshots/` 等

---

## 工作区外材料（未入库）

以下目录存在于工作区但**尚未纳入 git**，查阅时注意与 SSOT 区分：

| 路径 | 说明 |
|------|------|
| `handoffs/opendesign-ui-audit-2026-06-18/` | Open Design 冻结战役的历史会诊材料 |
| `reports/` | 杂项验证报告 |
| `nul` | Windows 保留名误生成文件，可删 |

---

## 快速导航

### 新手入门

1. [项目概述](./README.md)
2. [快速开始](./guides/QUICK_START.md)
3. [开发指南](./DEVELOPMENT.md)

### Agent / Cursor 开工

1. [CURRENT_BASELINE.md](./CURRENT_BASELINE.md) — 当前阶段与暂不做
2. [CURSOR_REFERENCE.md](./tasks/CURSOR_REFERENCE.md) — 编码约束
3. [ARCHITECTURE.md](./ARCHITECTURE.md) — 系统结构

### 深入了解

1. [设计文档索引](./design/README.md)
2. [AI 功能规格](./specs/AI_FEATURES_SPECIFICATION.md)
3. [Thinklogs](./thinklogs/)

---

## 索引维护约定

新增或移动文档时，同步更新：

1. **本文件** `docs/INDEX.md` — 顶层入口
2. **子目录 README** — `thinklogs/README.md`、`design/README.md`、`tasks/README.md`
3. **SSOT** — 若影响协作状态，更新 `CURRENT_BASELINE.md`
