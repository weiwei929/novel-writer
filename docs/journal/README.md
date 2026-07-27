# 💡 Thinklogs (思维日志)

> "Programming is the art of thinking clearly."

## 🎯 什么是 Thinklog？

Thinklog (Thinking Log) 是本项目独有的一种文档形式。与关注结果的 Changelog 或关注实现细节的 Devlog 不同，**Thinklog 专注于记录决策背后的思维过程**。

如果说代码是"结果"，那么 Thinklog 就是"推导过程"。

### 核心要素

一篇合格的 Thinklog 应包含以下三个维度的复盘：

1. **提出问题 (Issue)**：我们将要解决的本质冲突是什么？
2. **思考问题 (Reasoning)**：为什么选择方案 A 而不是方案 B？经历了怎样的思维博弈？
3. **解决问题 (Resolution)**：最终的落地形式是如何呼应最初的思考的？

---

## 📂 索引

> 完整列表见 [docs/INDEX.md](../INDEX.md) 的 Thinklogs 章节。

### 📅 2025

- **[2025-12-24: 从审查到重生](./2025-12-24_Thinklog_From_Review_to_Rebirth.md)**
- **[2025-12-15: 架构的自我校准](./2025-12-15_Thinklog_Architecture_Calibration.md)**
- **[2025-12-13: 注入灵魂与系统稳定性](./2025-12-13_Thinklog_Injecting_Soul_and_System_Stability.md)**
- **[2025-12-11: 对齐与粒度](./2025-12-11_Thinklog_Alignment_and_Granularity.md)**
- **[2025-12-08: 技术栈评估](./2025-12-08_Tech_Stack_Evaluation.md)**
- **[2025-11-04: 文档体系重构](./2025-11-04_Documentation_Restructure_Report.md)**
- **[2025-11-04: UX 改进](./2025-11-04_UX_Improvements_Report.md)**

### 📅 2026 — 项目治理（TASK-617-A）

- **[2026-06-18: 项目文件治理通报](./2026-06-18-project-governance-update.md)** — 根目录大扫除、Cursor 规则体系、AGENTS.md
- **[Ponytail 适用性评估](./ponytail-evaluation.md)** — TASK-617-A 第一阶段调研

### 📅 2026 — 入口 / 战役 A+B / Pipeline

- **[入口交互治理 — 修正版审计](./audit-entry-corrected.md)**
- **[三方讨论：命名规范 + 战役 A + B](./discussion-three-way-campaign-ab.md)**
- **[战役 A + B 执行指令](./campaign-ab-execution.md)**
- **[Pipeline 审计](./cursor-pipeline-audit.md)**
- **[Pipeline 断裂修复（P0 × 3）](./cursor-pipeline-fix.md)**

### 📅 2026 — 三问题修复

- **[三问题讨论纲要](./cursor-discussion-three-issues.md)**
- **[三问题执行指令](./cursor-execution-three-issues.md)**
- **[WorkDetailPage 语义返回修复](./cursor-backnav-fix.md)**

### 📅 2026 — Git / 分支卫生

- **[2026-07-06: 分支回溯 + 换行符/视觉改动分离提交](./2026-07-06_Thinklog_Git_Branch_Audit_and_Hygiene.md)**

---

## 📝 编写指南

建议使用以下模板记录 Thinklog：

```markdown
# YYYY-MM-DD Title

## 💡 背景 (Context)
...

## 🤔 思考过程 (Decision Model)
- 选项 A：...
- 选项 B：...
- 决策：...

## ✅ 结论与行动 (Outcome)
...
```

新增 Thinklog 后，同步更新本文件与 [docs/INDEX.md](../INDEX.md)。

---

## 为什么叫 Thinklog 而不是 ThinkingLog？

Changelog、Devlog、Backlog 都用短词根 + Log 的构词节奏；**Thinklog** 与之对称，更像一个封装好的思维产物（artifact），而不是"正在记录的过程"。

- **Changelog** 记录 What — 做了什么
- **Devlog** 记录 How — 怎么实现的
- **Thinklog** 记录 Why — 为什么这么做

在 AI 辅助开发时代，决策路径和思维模型往往比实现细节更有长期价值。
