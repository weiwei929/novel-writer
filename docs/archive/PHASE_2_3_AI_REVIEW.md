# Phase 2.3: AI 全局审校官与 Tier C 架构

> **状态**: 草案 (Draft)
> **日期**: 2025-12-15
> **目标**: 实现 Tier C (全局上下文) 并构建 AI 全书审校功能。

## 1. 核心概念

### Tier C: 全局审阅层 (Global Review Context)
Tier C 是 AI 理解“整本书”的关键。它不是简单地拼接全书正文（那会消耗数百万 Token），而是基于 **"摘要聚合" (Summary Aggregation)**。

*   **组成**:
    *   **Tier A**: 核心元数据 (书名、世界观、人物表)。
    *   **Chapter List**: 每一章的 `Title` + `Summary`。
*   **用途**:
    *   检查全书节奏 (Pacing)。
    *   检查伏笔回收 (Plot Holes)。
    *   检查人物性格一致性 (Character Consistency)。

## 2. 交互设计 (UX)

### 2.1 审阅入口
在 AI 助手面板中增加 **"全书体检" (Full Book Check)** 按钮。
点击后，AI 进入 **Review Mode**。

### 2.2 审阅报告
AI 输出不应是流式对话，而应是结构化的报告：
> **全书体检报告**
> *   **逻辑一致性**: ⚠️ 第3章提到的“无剑设定”在第10章被打破。
> *   **人物OOC**: ✅ 主角性格保持稳定。
> *   **节奏建议**: 第5-8章剧情推进过慢，建议压缩。

## 3. 技术实现

### 3.1 Context Manager (Tier C)
```typescript
buildGlobalContext(projectId):
  1. Fetch Project Metadata (Tier A)
  2. Fetch ALL Chapters (id, title, summary) ordered by index
  3. Construct Context:
     "--- Chapter 1: The Beginning ---"
     "Summary: [Summary content...]"
     "--- Chapter 2: The Journey ---"
     "Summary: [Summary content...]"
  4. Truncate if > 30k chars (Token Safety)
```

### 3.2 Prompt Engineering
System Prompt for Reviewer:
"You are a Senior Editor. Analyze the following chapter summaries for continuity errors and pacing issues. Output in structured Markdown."

## 4. 风险与限制
*   **摘要质量**: 如果各章的 `Summary` 本身为空或质量差，Tier C 将失效。
    *   *对策*: 在 `ContextManager` 中，如果发现 Summary 为空，尝试截取正文前 200 字作为临时摘要。
*   **Token 成本**: 即使是摘要，长篇小说可能也会很大。
    *   *对策*: 仅允许付费/高级用户使用，或限制每日次数。
