# 2025-12-15 开发随笔：架构的自我校准 (Architecture Calibration)

> **Time**: 2025-12-15 12:30  
> **Topic**: AI Review Refactoring, Architecture Correction  
> **Mood**: Calm & Reflective  

今天的开发进程非常有意思，它不仅是一次功能的堆叠，更是一次对业务理解的“自我校准”。

## 1. 概念的混淆与澄清

在 Phase 2.3 的最初设计中，我犯了一个典型的“工程师思维”错误：**将“技术实现”凌驾于“业务场景”之上。**

我认为“审阅 (Review)”就是一个动作，无论是在写这一章时，还是在书写完时，无非就是 Prompt 不同 context 不同。所以，我一开始在 `AIAssistantPanel`（编辑器右侧边栏）里塞进了一个“全书体检”按钮。

**这犯了两个错：**
1.  **场景错位**：编辑器是“高频、专注、微观”的场所。在这里进行全书级别的扫描，不仅打断心流，而且 UI 上那个巨大的听诊器图标也显得突兀。
2.  **流程错位**：“全书审阅”在出版界，不仅是编辑的工作，更往往发生在“初稿完成”之后。它属于“归档/出版”流程的一部分，而不是“写作”流程。

**Correction (修正)：**
在用户的指引下，我们迅速调整了方向：
*   **Tier B (Chapter Level)** 归还给 **编辑器**。命名为“章节诊断”，像一个贴心的文字教练，只看当下。
*   **Tier C (Global Level)** 归还给 **看板 (Kanban)**。命名为“全书体检”，只有当项目卡片被拖到 `Completed` 区域时，才允许触发。

这不仅是 UI 的改变，更是体现了 **Architecture Mirroring Reality (架构映射现实)** 的原则。

## 2. Token 与 429 的启示

验证阶段，我们顺利撞上了 Google Gemini API 的 `429 Too Many Requests` 限流墙。

这在一个依赖 Tier C (Global Context) 的功能中是必然的。全书摘要的聚合包非常大（几万字），一次性扔给 LLM，瞬间消耗极高的配额。

但这反而是好事。它提醒我们：**AI 架构必须设计“弹性 (Resilience)”。**
如果未来要商用，我们不能只写 `await ai.chat()`，而需要引入：
*   **Queue System**: 将耗时任务放入后台队列。
*   **Progressive Loading**: 现在的“转圈圈”Loading 是最基础的，未来可能需要 Websocket 实时回传“正在阅读第 3 章...”。

## 3. 下一步：从工具到伙伴

现在，我们的 Novel Writer 已经具备了完整的 AI 闭环：
*   **Plan**: 帮你想点子。
*   **Write**: 帮你写句子。
*   **Review**: 帮你找茬子。

基础建设 (Infrastructure) 已毕。接下来的 Phase 2.4，我们终于可以慢下来，打磨那个最柔软的部分——**“体验”**。让 AI 不再是一个冷冰冰的 API 调用者，而是一个甚至能懂你未尽之言的“书友”。

下午见。
