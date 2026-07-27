# AI 辅助功能规格说明

> **状态**：⛔ **已冻结 · 设计留档** · 最后核对 2026-07-27
> 前端入口已由 `frontend/src/config/aiFreeze.ts`（`AI_UI_FROZEN = true`）统一关闭，显示「AI 集成开发中」。
> 后端代码（`AIService` / `ContextManager` / `PromptManager` / `routes/ai.ts`）保留未删。
> **本文档描述的是解冻后的目标形态，不是当前可用能力。** 勿据此判断项目进度。

**版本**: 2.0  
**日期**: 2025-12-24（内容未随冻结更新）

---

## 📋 概述

本文档定义了 Novel Writer 的 AI 辅助功能架构和实现规范。所有 AI 功能遵循**"作者为主，AI 为客"**的核心原则，通过对话式交互帮助作者构思和创作，而非替代作者。

---

## 🏗️ 核心架构

### 1. 上下文管理（Context Management）

采用**三层分级策略**，实现 Token 优化和逻辑一致性：

#### Tier A：核心元数据层
- **定义**: 作品的"灵魂"和"骨架"
- **内容**: 项目元数据（标题、梗概、人物、世界观等）+ 章节元数据
- **特性**: 所有 AI 请求必须包含，AI 必须严格遵循
- **实现**: `ContextManager.buildProjectContext()`

#### Tier B：章节工作层
- **定义**: 当前创作环境
- **内容**: Tier A + 当前章节内容 + 上一章摘要（可选）
- **适用**: AI 写作助手、章节审阅
- **实现**: `ContextManager.buildChapterContext()`

#### Tier C：全局审阅层
- **定义**: 作品全貌
- **内容**: 所有章节的完整内容或摘要
- **适用**: 全书审阅、全局逻辑检查
- **实现**: `ContextManager.buildGlobalContext()`

---

## 🎯 核心功能

### 1. AI 元数据助手（AIMetadataAssistant）

**功能**: 统一的对话式元数据生成界面

**设计原则**: Chat-Confirm-Commit 工作流

**工作流程**:
```
用户点击字段旁的"AI 协助"
  ↓
打开对话界面
  ↓
AI 引导用户构思（多轮对话）
  ↓
AI 生成结构化内容（Markdown）
  ↓
用户审核/编辑
  ↓
确认保存到指定字段
  ↓
成为 Tier A 元数据（AI 的"法律"）
```

**适用字段**:
- **项目元数据**: synopsis, characters, worldview, outline, themes 等
- **章节元数据**: summary, goal, conflicts 等

**技术实现**:
- 组件: `AIMetadataAssistant.tsx`
- API: `/api/ai/metadata-chat`
- 参数: `type`, `entityId`, `field`, `fieldLabel`

**约束**:
- 单次生成不超过 1000 字
- 侧重结构化、条理性
- 用户必须确认才能保存

---

### 2. AI 元数据提取（Metadata Extraction）

**功能**: 从导入的文本自动提取项目元数据

**工作流程**:
```
用户导入文件
  ↓
后台异步提取（最多 50k 字符）
  ↓
保存到 _draft 字段
  ↓
前端轮询检测
  ↓
弹出审核模态框
  ↓
用户编辑/确认
  ↓
写入正式元数据字段
```

**技术实现**:
- 后端: `extractMetadataInBackground()`
- 前端: `MetadataReviewModal` + `MetadataMissingPrompt`
- 状态反馈: 持续 Loading 横幅 + 成功指引

**用户体验**:
- ✅ 全程状态可见
- ✅ 可编辑提取结果
- ✅ 明确保存位置

---

### 3. AI 写作助手（Writing Assistant）

**功能**: 在编辑器中提供续写、润色、扩写等辅助

**适用场景**:
- 续写下文
- 润色文字
- 头脑风暴
- 描写场景
- 刻画心理

**技术实现**:
- 组件: `AIAssistantPanel`
- 上下文: Tier B（项目元数据 + 当前章节）
- 输出: 可插入编辑器的内容

**约束**:
- 单次生成不超过 300 字
- 防止 AI 抢夺创作权
- 内容插入而非替换

---

### 4. AI 审阅功能（Review）

**功能**: 对章节或全书进行逻辑、文笔、情节审阅

#### 章节审阅
- **触发**: 编辑器中的"审阅"按钮
- **上下文**: Tier B
- **输出**: 章节级别的改进建议

#### 全书审阅
- **触发**: 看板"已完成"区域
- **上下文**: Tier C
- **输出**: 全局逻辑检查、情节连贯性分析

**技术实现**:
- 组件: `AIReviewPanel`
- 后端: `ContextManager.buildGlobalContext()`

**注意事项**:
- 全书审阅可能遇到 429 限流
- 需要进度反馈机制

---

## 🔧 技术组件

### 后端服务

```
backend/src/services/ai/
├── AIService.ts           # Gemini API 集成
├── ContextManager.ts      # 上下文管理（Tier A/B/C）
└── PromptManager.ts       # Prompt 模板管理
```

**核心方法**:
- `AIService.chat()`: 调用 Gemini API
- `ContextManager.buildProjectContext()`: 构建 Tier A
- `ContextManager.buildChapterContext()`: 构建 Tier B
- `ContextManager.buildGlobalContext()`: 构建 Tier C
- `PromptManager.getMetadataExtractPrompt()`: 获取提取 Prompt
- `PromptManager.getMetadataChatPrompt()`: 获取对话 Prompt

### 前端组件

```
frontend/src/components/
├── ai/
│   ├── AIMetadataAssistant.tsx        # 元数据对话助手
│   ├── CharacterGenerationModal.tsx   # ❌ 已废弃
│   └── OutlineGenerationModal.tsx     # ❌ 已废弃
├── writer/
│   ├── AIAssistantPanel.tsx           # 写作助手面板
│   └── AIReviewPanel.tsx              # 审阅面板
└── import/
    └── MetadataReviewModal.tsx        # 元数据审核模态框
```

---

## 📐 设计原则

### 1. 作者为主，AI 为客（Host-Guest Protocol）

- ✅ AI 生成内容需用户确认
- ✅ 元数据提取有审核环节
- ✅ 写作助手字数限制
- ✅ 内容插入而非替换

### 2. 按需注入（Injection on Demand）

- ✅ Tier A/B/C 分级策略
- ✅ 章节审阅只用 Tier B
- ✅ 全书审阅才用 Tier C
- ✅ Token 优化

### 3. 对话 → 确认 → 入库（Chat-Confirm-Commit）

- ✅ 元数据生成有确认环节
- ✅ 对话内容可编辑
- ✅ 保存后成为"法律"

---

## 🚀 API 端点

### 元数据相关
- `POST /api/projects/:id/extract-metadata` - 触发元数据提取
- `POST /api/projects/:id/confirm-metadata` - 确认/拒绝提取结果
- `POST /api/ai/metadata-chat` - 元数据对话生成

### 写作助手
- `POST /api/ai/writing-assist` - 写作辅助

### 审阅功能
- `POST /api/ai/review-chapter` - 章节审阅
- `POST /api/ai/review-book` - 全书审阅

---

## 📊 完成度

> ⚠️ **下表为 2025-12-24 冻结前的自评，已不代表可用性。**
> 「已实现」指后端代码存在，**不代表用户能用到** —— 前端入口自 `AI_UI_FROZEN = true` 起全部关闭。
> **对外可用完成度：0%。** 引用本项目进度时请以 `docs/ROADMAP.md` 为准。

| 功能模块 | 冻结前自评 | 当前对外可用 |
|---------|-----------|-------------|
| AI 元数据助手 | 100% | ⛔ 冻结 |
| AI 元数据提取 | 100% | ⛔ 冻结 |
| AI 写作助手 | 90% | ⛔ 冻结 |
| AI 章节审阅 | 95% | ⛔ 冻结 |
| AI 全书审阅 | 95% | ⛔ 冻结 |
| 上下文管理 | 95% | ⛔ 冻结 |
| Prompt 管理 | 90% | ⛔ 冻结 |

---

## 🎯 待完善项

### 短期（1-3 小时）
1. 补充各字段的引导 Prompt 模板
2. 完善元数据面板的 AI 按钮集成

### 中期（4-6 小时）
1. 为写作助手添加更多预设场景
2. 优化全书审阅性能（分批处理）
3. 实现上下文缓存机制

### 长期（6-8 小时）
1. 添加自动化测试
2. 性能优化
3. 创建 Prompt 编写指南

---

## 📝 使用示例

### 示例 1：生成人物设定

```typescript
// 在 ProjectMetadataPanel 中
<AIMetadataAssistant
  isOpen={showAI}
  onClose={() => setShowAI(false)}
  type="project"
  entityId={project.id}
  field="characters"
  fieldLabel="人物设定"
  onSave={(content) => {
    updateMetadata('characters', content)
  }}
/>
```

### 示例 2：生成章节摘要

```typescript
// 在 ChapterMetadataPanel 中
<AIMetadataAssistant
  isOpen={showAI}
  onClose={() => setShowAI(false)}
  type="chapter"
  entityId={chapter.id}
  field="summary"
  fieldLabel="章节摘要"
  onSave={(content) => {
    updateChapterMetadata('summary', content)
  }}
/>
```

---

## ⚠️ 注意事项

1. **Token 限制**: 注意 Gemini API 的 Token 限制
2. **429 限流**: 全书审阅可能触发限流，需要重试机制
3. **数据安全**: 元数据一旦确认保存，成为 AI 的约束条件
4. **用户控制**: 始终让用户保持最终决策权

---

## 📚 相关文档

- [AI 功能完成情况复盘](./AI_FEATURES_STATUS_REVIEW.md)
- [Cursor 审查总结](./archive/CURSOR_REVIEW_SUMMARY.md)
- [开发随笔：从审查到重生](./thinklogs/2025-12-24_Thinklog_From_Review_to_Rebirth.md)

---

**文档维护**: 本文档反映当前实际实现，如有变更请及时更新。
