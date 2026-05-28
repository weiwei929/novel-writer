# Novel Writer - Cursor 代码审查指引

**审查日期**: 2025-12-23  
**项目阶段**: 完整功能开发完成（含 AI 元数据管理系统）  
**审查目的**: 全面代码质量审查、发现潜在问题、优化建议

> ⚠️ **重要提示**：本项目文档存在滞后，README 等文档未及时更新，请以代码实际实现为准。

---

## 一、项目背景

### 1.1 项目简介

这是一个**小说创作辅助系统**，采用**双层架构设计**：

#### 🎯 核心架构：双层设计

**第一层：完整的手工创作工具** ✅
- **完全独立运行**，不依赖任何 AI 服务
- 用户可以手动填写所有元数据
- 手动创作、编辑、管理章节
- 完整的项目管理、文集管理功能
- **已完成测试，可正常运行**

**第二层：AI 专家辅助功能** ✅
- **可选功能**，需要在设置中配置 AI API
- 如果未配置 AI，系统退化为完整的手工版
- AI 功能包括：
  - 元数据对话式构建
  - 章节大纲生成
  - 写作辅助（续写/改进/头脑风暴）
  - 内容审阅
- **今日完成开发，待测试**

> 💡 **设计理念**：AI 是锦上添花，不是必需品。用户可以选择纯手工创作，也可以启用 AI 辅助。

### 1.2 技术栈

**后端**:
- Node.js + Fastify
- Prisma ORM + SQLite
- TypeScript
- Gemini AI API（可选）

**前端**:
- React + TypeScript
- React Router
- Axios
- Tailwind CSS

### 1.3 核心原则

> ⚠️ **这些原则是项目的灵魂，所有代码都应遵守**

1. **双层架构原则** 🆕
   - 手工功能必须完全独立可用
   - AI 功能是可选的增强
   - 未配置 AI 时，不应有任何错误或功能缺失

2. **元数据 = 宪法**（仅 AI 功能）
   - 项目元数据和章节元数据是所有 AI 功能的核心约束
   - 任何 AI 生成的内容都必须符合元数据设定
   - 手工创作时，元数据仅作为参考

3. **AI 克制性**（仅 AI 功能）
   - AI 续写限制 300 字
   - AI 不能擅自改变情节
   - 用户始终保持主导权

4. **用户主导**
   - AI 是辅助工具，不是主要创作者
   - 所有重要决策都需要用户确认
   - 手工创作时，用户拥有完全控制权

---

## 二、项目开发历史和当前状态

### 2.1 已完成并测试的功能（2025-12-22 及之前）

> ✅ **这些功能已经过完整测试，运行正常**

#### 核心编辑器功能 ✅
- 富文本编辑器（基于 Slate.js）
- 实时字数统计
- 自动保存
- 章节导航
- **状态**: 稳定，已测试

#### 项目管理功能 ✅
- 项目创建、编辑、删除
- 章节管理（创建、排序、删除）
- 项目导出（Markdown 格式）
- 项目导入（Markdown/TXT 格式）
- **状态**: 稳定，已测试

#### 文集管理功能 ✅
- 文集创建和管理
- 项目分类和组织
- Kanban 看板视图
- 项目状态管理（草稿/写作中/已完成/已归档）
- **状态**: 稳定，已测试

#### 元数据管理（手工版）✅
- 项目元数据面板
- 章节元数据面板
- 手动填写和编辑
- **状态**: 稳定，已测试

#### 深度策划功能 ✅
- PlannerBoard 组件
- 可视化大纲编辑
- **状态**: 稳定，已测试

### 2.2 今日完成的 AI 功能（2025-12-23）

> ⚠️ **这些功能刚完成开发，尚未进行完整测试**

#### Phase 1-3: AI 元数据管理系统 🆕
- 移除冗余的独立生成接口
- 强化 `ContextManager` 和 `PromptManager`
- 实现统一的 `AIMetadataAssistant` 组件
- 集成到项目和章节元数据面板
- **状态**: 开发完成，待测试

**关键文件**:
- `backend/src/services/ai/ContextManager.ts`
- `backend/src/services/ai/PromptManager.ts`
- `frontend/src/components/ai/AIMetadataAssistant.tsx`
- `frontend/src/components/editor/ProjectMetadataPanel.tsx`
- `frontend/src/components/editor/ChapterMetadataPanel.tsx`

#### Phase 4: AI 章节大纲生成 🆕
- 基于项目元数据一次性生成完整章节大纲
- 支持 1-50 章的规模限制
- 可编辑大纲并批量创建章节
- **状态**: 开发完成，待测试

**关键文件**:
- `backend/src/routes/ai.ts` (章节大纲生成接口)
- `frontend/src/components/ai/ChapterOutlineGenerator.tsx`
- `frontend/src/pages/ProjectDetailPage.tsx`

#### Phase 5: 导入元数据提取 + P0/P1 隐患修复 🆕
- ✅ 强硬的导入格式验证（一级标题=作品名，二级标题=章节名）
- ✅ 规模限制（章节数≤50，单章100-8000字）
- ✅ 元数据确认机制（AI提取→临时保存→用户确认）
- ✅ 元数据预览确认界面
- **状态**: 开发完成，待测试

**关键文件**:
- `backend/src/routes/projects.ts` (格式验证、确认接口)
- `frontend/src/components/FileImportExport/FileImportExport.tsx`
- `frontend/src/components/import/MetadataReviewModal.tsx`

### 2.3 文档滞后问题

> ⚠️ **重要提醒**：以下文档未及时更新，请勿作为主要参考

**滞后的文档**:
- `README.md` - 几乎完全未反映当前进度
- 部分 `docs/specs/` 下的规范文档

**可信的文档**:
- 代码本身（最准确）
- `task.md` - 开发任务清单（最新）
- `system_review.md` - 系统复盘报告（最新）
- `walkthrough.md` - 修复完成报告（最新）
- 本文档 `cursor_review_guide.md`

**建议**:
- 以代码实际实现为准
- 参考最新的 artifact 文档
- 忽略过时的 README 内容


### 2.1 Phase 1-3: 元数据系统强化

**已完成**:
- 移除冗余的独立生成接口
- 强化 `ContextManager` 和 `PromptManager`
- 实现统一的 `AIMetadataAssistant` 组件
- 集成到项目和章节元数据面板

**关键文件**:
- `backend/src/services/ai/ContextManager.ts`
- `backend/src/services/ai/PromptManager.ts`
- `frontend/src/components/ai/AIMetadataAssistant.tsx`
- `frontend/src/components/editor/ProjectMetadataPanel.tsx`
- `frontend/src/components/editor/ChapterMetadataPanel.tsx`

### 2.2 Phase 4: AI 章节大纲生成

**已完成**:
- 基于项目元数据一次性生成完整章节大纲
- 支持 1-50 章的规模限制
- 可编辑大纲并批量创建章节

**关键文件**:
- `backend/src/routes/ai.ts` (章节大纲生成接口)
- `frontend/src/components/ai/ChapterOutlineGenerator.tsx`
- `frontend/src/pages/ProjectDetailPage.tsx`

### 2.3 Phase 5: 导入元数据提取 + P0/P1 隐患修复

**已完成**:
- ✅ 强硬的导入格式验证（一级标题=作品名，二级标题=章节名）
- ✅ 规模限制（章节数≤50，单章100-8000字）
- ✅ 元数据确认机制（AI提取→临时保存→用户确认）
- ✅ 元数据预览确认界面

**关键文件**:
- `backend/src/routes/projects.ts` (格式验证、确认接口)
- `frontend/src/components/FileImportExport/FileImportExport.tsx`
- `frontend/src/components/import/MetadataReviewModal.tsx`

---

## 三、审查范围和重点

### 3.1 审查范围说明

> 📋 **本次审查是全面审查，不仅限于今日开发的 AI 功能**

**包含范围**:
- ✅ 所有核心功能（编辑器、项目管理、文集管理）
- ✅ 所有 AI 相关功能（今日新增）
- ✅ 数据库模型和 API 设计
- ✅ 前后端架构和代码质量
- ✅ 类型安全和错误处理

**审查重点**:
1. **双层架构验证** 🔴 高优先级
   - AI 功能是否真正可选？
   - 未配置 AI 时是否有错误？
   - 手工功能是否完全独立？

2. **今日新增 AI 功能** 🔴 高优先级
   - 代码质量和逻辑正确性
   - 与现有功能的集成
   - 潜在的 bug 和边界情况

3. **整体代码质量** 🟡 中优先级
   - 类型安全（减少 `any` 使用）
   - 错误处理完善性
   - 性能优化机会

4. **已测试功能验证** 🟢 低优先级
   - 快速检查是否有明显问题
   - 不需要深入审查

### 3.2 审查优先级

**🔴 高优先级**（必须仔细审查）:
1. 双层架构实现
2. 导入格式验证逻辑
3. 元数据确认流程
4. AI Prompt 构建
5. 新旧功能集成点

**🟡 中优先级**（重点关注）:
6. 类型安全和类型定义
7. 错误处理机制
8. 性能优化机会
9. API 设计一致性

**🟢 低优先级**（快速检查）:
10. 代码风格和命名
11. 注释和文档
12. 已测试功能的稳定性

---

## 四、需要重点审查的区域

### 🔴 高优先级审查点

#### 4.1 双层架构实现验证

**审查目标**: 确保 AI 功能完全可选

**检查点**:
- [ ] AI 配置检查是否正确？
  - 位置：`backend/src/services/ai/AIService.ts`
  - 验证：未配置时是否优雅降级？

- [ ] 前端 AI 组件是否有条件渲染？
  - 位置：`frontend/src/components/ai/*`
  - 验证：未配置 AI 时是否隐藏？

- [ ] API 路由是否有 AI 可用性检查？
  - 位置：`backend/src/routes/ai.ts`
  - 验证：未配置时是否返回友好错误？

**潜在问题**:
- AI 服务初始化失败时的处理
- 前端组件假设 AI 总是可用
- 缺少"AI 未配置"的用户提示

#### 4.2 导入格式验证逻辑

**文件**: `backend/src/routes/projects.ts`  
**函数**: `validateImportFormat()`

**审查重点**:
- [ ] 正则表达式是否正确识别一级/二级标题？
  ```typescript
  const h1Lines = lines.filter(l => l.trim().startsWith('# ') && !l.trim().startsWith('## '))
  ```
  - ⚠️ 是否考虑了 `###` 等情况？
  - ⚠️ 是否处理了空格和 tab？

- [ ] 边界情况处理
  - 空文件
  - 纯文本（无标题）
  - 特殊字符（emoji、中文标点）
  - 超大文件（>100MB）

- [ ] 错误提示是否清晰友好？
  ```typescript
  error: `❌ 章节数量过多（${chapters.length} 章）\n\n建议拆分为多部作品...`
  ```
  - ✅ 是否提供了具体的拆分建议？
  - ✅ 是否使用了友好的语言？

- [ ] 性能问题
  - 大文件处理是否会阻塞？
  - 是否需要流式处理？

#### 4.3 元数据确认流程

**文件**: 
- `backend/src/routes/projects.ts` (确认接口)
- `frontend/src/components/import/MetadataReviewModal.tsx`

**审查重点**:
- [ ] 临时字段命名是否合理？
  ```typescript
  metadata: {
    ...existingMetadata,
    _draft: extractedMetadata,  // 临时字段
    _extractedAt: new Date().toISOString()
  }
  ```
  - ⚠️ `_draft` 是否会与用户数据冲突？
  - ⚠️ 是否有清理机制？

- [ ] 确认/拒绝后的状态管理
  ```typescript
  if (confirmed) {
    const { _draft, _extractedAt, ...rest } = metadata
    await prisma.project.update({
      where: { id },
      data: { metadata: { ...rest, ...draft } }
    })
  }
  ```
  - ✅ 是否正确合并元数据？
  - ⚠️ 是否有竞态条件？

- [ ] 用户体验
  - 是否有加载状态？
  - 错误处理是否完善？
  - 是否可以取消操作？

**潜在问题**:
- 用户在提取过程中关闭页面
- 临时元数据永久残留
- 并发请求导致数据不一致

#### 4.4 AI Prompt 构建

**文件**: `backend/src/services/ai/PromptManager.ts`

**审查重点**:
- [ ] Prompt 是否清晰表达了约束？
  ```typescript
  ⚠️ 核心约束（必须严格遵守）：
  1. 严格遵守项目梗概中的核心冲突和主题
  2. 遵循情节结构的起承转合
  ```
  - ✅ 约束是否明确？
  - ⚠️ 是否有歧义？

- [ ] Token 超限风险
  ```typescript
  const context = await contextManager.buildProjectContext(projectId)
  ```
  - ⚠️ 是否计算了 token 数量？
  - ⚠️ 是否有截断逻辑？

- [ ] 代码重复
  - 不同 Prompt 是否有重复部分？
  - 是否可以提取公共部分？

**关键方法**:
- `getWritingSystemPrompt()` - 写作辅助
- `getMetadataGuidedPrompt()` - 元数据对话
- `getChapterOutlinePrompt()` - 章节大纲生成
- `getMetadataExtractPrompt()` - 元数据提取

#### 4.5 新旧功能集成点

**审查重点**:
- [ ] 元数据面板的 AI 集成
  - 位置：`ProjectMetadataPanel.tsx`, `ChapterMetadataPanel.tsx`
  - 验证：AI 按钮是否正确显示/隐藏？
  - 验证：手工编辑和 AI 辅助是否冲突？

- [ ] 导入流程的修改
  - 位置：`FileImportExport.tsx`
  - 验证：是否破坏了原有的导入功能？
  - 验证：向后兼容性如何？

- [ ] 项目详情页的大纲生成
  - 位置：`ProjectDetailPage.tsx`
  - 验证：与现有章节管理是否冲突？
  - 验证：批量创建章节是否正确？

### 🟡 中优先级审查点

#### 4.6 类型安全

**审查重点**:
- [ ] `metadata` 字段的类型定义
  ```typescript
  // 当前
  metadata?: Record<string, any>  // ⚠️ 太宽泛
  
  // 建议
  interface ProjectMetadata {
    synopsis?: string
    characters?: string
    worldBuilding?: string
    plotStructure?: string
    themes?: string
    writingStyle?: string
    _draft?: ProjectMetadata
    _extractedAt?: string
  }
  ```

- [ ] API 响应的类型定义
  - 是否所有 API 都有明确的返回类型？
  - 是否有过多的 `any` 断言？

- [ ] 组件 Props 的类型定义
  - 是否所有 Props 都有类型？
  - 是否有可选属性的默认值？

#### 4.7 错误处理

**审查重点**:
- [ ] 所有 API 调用是否有 try-catch？
  ```typescript
  try {
    const response = await api.post(...)
  } catch (e: any) {
    // 是否有友好的错误提示？
    // 是否有日志记录？
  }
  ```

- [ ] 错误信息是否对用户友好？
  - 避免技术术语
  - 提供解决建议

- [ ] 是否有日志记录（后端）？
  ```typescript
  req.log.error(e, 'Import failed')
  ```

- [ ] 前端是否正确处理 HTTP 错误码？
  ```typescript
  if (e.response?.status === 400) {
    // 显示验证错误
  } else if (e.response?.status === 500) {
    // 显示服务器错误
  }
  ```

#### 4.8 性能优化

**审查重点**:
- [ ] 是否有不必要的重复 API 调用？
  - React 组件的 useEffect 依赖是否正确？
  - 是否有缓存机制？

- [ ] 大文件导入的性能
  - 是否会阻塞 UI？
  - 是否需要 Web Worker？

- [ ] 是否有内存泄漏风险？
  - React 组件是否正确清理？
  - 是否有未取消的请求？

- [ ] React 组件是否有不必要的重渲染？
  - 是否使用了 React.memo？
  - 是否使用了 useMemo/useCallback？

### 🟢 低优先级审查点

#### 4.9 代码风格和一致性

**审查重点**:
- [ ] 命名规范是否一致？
  - 组件：PascalCase
  - 函数/变量：camelCase
  - 常量：UPPER_SNAKE_CASE

- [ ] 注释是否充分？
  - 复杂逻辑是否有注释？
  - 公共 API 是否有 JSDoc？

- [ ] 是否有死代码？
  - unused imports
  - unused variables
  - 废弃的组件

- [ ] 文件组织是否合理？
  - 组件是否在正确的目录？
  - 是否有循环依赖？


### 4.1 后端检查

#### `backend/src/routes/projects.ts`

```typescript
// 检查点 1: 格式验证函数
function validateImportFormat(content: string) {
  // ✅ 检查：正则表达式是否正确？
  const h1Lines = lines.filter(l => l.trim().startsWith('# ') && !l.trim().startsWith('## '))
  
  // ✅ 检查：边界情况处理
  if (h1Lines.length === 0) { /* ... */ }
  if (h1Lines.length > 1) { /* ... */ }
  
  // ✅ 检查：字数统计是否准确？
  const wordCount = countWords(chapters[i].content.trim())
  
  // ⚠️ 潜在问题：大文件性能
  // 建议：考虑流式处理或分块处理
}

// 检查点 2: 元数据确认接口
app.post('/:id/confirm-metadata', async (req, reply) => {
  // ✅ 检查：是否验证 projectId 存在？
  // ✅ 检查：是否处理 _draft 不存在的情况？
  // ⚠️ 潜在问题：并发请求处理
})
```

#### `backend/src/services/ai/PromptManager.ts`

```typescript
// 检查点 3: Prompt 构建
async getChapterOutlinePrompt(projectId: string, chapterCount: number, userRequirements?: string) {
  // ✅ 检查：是否正确引用项目元数据？
  // ✅ 检查：Prompt 长度是否合理？
  // ⚠️ 潜在问题：token 超限
  // 建议：添加 token 计数和截断逻辑
}
```

### 4.2 前端检查

#### `frontend/src/components/import/MetadataReviewModal.tsx`

```typescript
// 检查点 4: 元数据预览界面
export const MetadataReviewModal: React.FC<MetadataReviewModalProps> = ({...}) => {
  // ✅ 检查：是否正确处理 loading 状态？
  // ✅ 检查：错误处理是否完善？
  // ⚠️ 潜在问题：projectId 为 null 的类型错误
  // 建议：添加非空断言或类型守卫
}
```

#### `frontend/src/components/FileImportExport/FileImportExport.tsx`

```typescript
// 检查点 5: 导入流程
const handleConfirmImport = async () => {
  // ✅ 检查：是否正确保存原始内容？
  // ✅ 检查：是否检测待确认的元数据？
  // ⚠️ 潜在问题：parsedData 和 rawContent 的同步
  // 建议：确保两者始终一致
}
```

### 4.3 类型定义检查

#### `frontend/src/services/api.ts`

```typescript
// 检查点 6: API 类型定义
export interface Project {
  metadata?: Record<string, any>  // ⚠️ 太宽泛
  // 建议：定义更具体的类型
}

// 建议的改进：
interface ProjectMetadata {
  synopsis?: string
  characters?: string
  worldBuilding?: string
  plotStructure?: string
  themes?: string
  writingStyle?: string
  _draft?: ProjectMetadata  // 临时字段
  _extractedAt?: string
}
```

---

## 五、已知问题和技术债务

### 5.1 已知但未修复的问题

1. **元数据类型定义不完整**
   - 优先级：中
   - 影响：类型安全性降低
   - 建议：定义详细的 metadata 接口

2. **AI 降级策略未实现**
   - 优先级：低
   - 影响：AI 服务故障时用户体验差
   - 建议：添加手动输入模式

3. **导入大文件性能未优化**
   - 优先级：中
   - 影响：大型作品导入可能卡顿
   - 建议：流式处理或 Web Worker

### 5.2 设计决策记录

1. **为什么使用临时字段 `_draft`？**
   - 避免直接覆盖用户数据
   - 提供明确的确认流程
   - 易于回滚

2. **为什么限制章节数≤50？**
   - 控制 AI 处理负担
   - 提高写作和审阅效率
   - 鼓励合理的作品规模

3. **为什么限制单章≤8000字？**
   - 避免 token 超限
   - 更好的章节节奏控制
   - 降低 AI 处理成本

---

## 六、审查输出建议

### 6.1 期望的审查报告格式

```markdown
# Cursor 代码审查报告

## 1. 严重问题 (Critical)
- [ ] 问题描述
  - 位置：文件:行号
  - 影响：...
  - 建议：...

## 2. 重要问题 (Important)
- [ ] 问题描述
  - 位置：...
  - 影响：...
  - 建议：...

## 3. 优化建议 (Suggestions)
- [ ] 建议描述
  - 位置：...
  - 收益：...
  - 实施难度：...

## 4. 代码质量评分
- 类型安全：?/10
- 错误处理：?/10
- 性能优化：?/10
- 代码风格：?/10
- 整体质量：?/10
```

### 6.2 重点关注的问题类型

1. **安全性问题**
   - SQL 注入风险
   - XSS 攻击风险
   - 敏感数据泄露

2. **逻辑错误**
   - 边界条件未处理
   - 竞态条件
   - 状态管理错误

3. **性能问题**
   - N+1 查询
   - 内存泄漏
   - 不必要的重渲染

4. **可维护性**
   - 代码重复
   - 过度复杂
   - 缺少文档

---

## 七、审查工作流建议

### 步骤 1: 理解项目
1. 阅读本文档
2. 查看 `task.md` 了解开发进度
3. 查看 `system_review.md` 了解已知问题

### 步骤 2: 静态分析
1. 运行 TypeScript 编译检查
2. 检查 lint 警告和错误
3. 查看未使用的导入和变量

### 步骤 3: 代码审查
1. 按优先级审查关键文件
2. 关注"检查清单"中的具体点
3. 记录发现的问题

### 步骤 4: 输出报告
1. 按严重程度分类问题
2. 提供具体的修复建议
3. 评估整体代码质量

---

## 八、联系和协作

### 8.1 审查范围

**包含**:
- ✅ 所有核心功能（编辑器、项目管理、文集管理）
- ✅ 所有 AI 相关功能（今日新增）
- ✅ 数据库模型和 API 设计
- ✅ 前后端架构和代码质量
- ✅ 类型安全和错误处理

**不包含**:
- UI 样式细节（非关键）
- 第三方库的内部实现

**审查重点**:
1. **双层架构验证**（最重要）
2. **今日新增 AI 功能**
3. **整体代码质量**
4. **已测试功能快速验证**

### 8.2 审查时间建议

- 快速审查：1-1.5 小时（关注高优先级）
- 完整审查：2-3 小时（全面检查）
- 深度审查：3-4 小时（包括性能测试和边界情况）

---

## 九、参考资料

### 9.1 关键文档（最新）

- `task.md` - 开发任务清单 ✅
- `system_review.md` - 系统复盘报告 ✅
- `walkthrough.md` - 修复完成报告 ✅
- 本文档 `cursor_review_guide.md` ✅

### 9.2 滞后文档（请忽略）

- `README.md` - 未更新 ⚠️
- 部分 `docs/specs/` - 未更新 ⚠️

### 9.3 核心概念

**元数据字段**:
- `synopsis` - 作品梗概
- `characters` - 人物设定
- `worldBuilding` - 世界观
- `plotStructure` - 情节结构
- `themes` - 主题思想
- `writingStyle` - 写作风格

**AI 功能**:
- 元数据对话构建
- 章节大纲生成
- 写作辅助（续写/改进/头脑风暴）
- 章节审阅
- 全局审阅

---

## 十、总结

### 审查目标

1. ✅ 验证双层架构实现
2. ✅ 验证代码质量
3. ✅ 发现潜在问题
4. ✅ 提供优化建议
5. ✅ 确保生产就绪

### 期望成果

- 详细的问题清单（按优先级分类）
- 具体的修复建议
- 代码质量评分
- 优化方向指引

### 重要提醒

> ⚠️ **请记住**：
> 1. 本项目采用**双层架构**，AI 功能是可选的
> 2. 昨天及之前的功能**已完成测试**，运行正常
> 3. 今日开发的 AI 功能**尚未测试**，需要重点审查
> 4. README 等文档**未及时更新**，请以代码为准
> 5. 审查范围是**全面的**，不仅限于今日开发

---

**文档版本**: 2.0  
**最后更新**: 2025-12-23  
**准备人**: Antigravity AI Assistant  
**审查人**: Cursor AI (待审查)

---

**祝审查顺利！如有疑问，请参考本文档或查看相关代码注释。** 🚀

**特别感谢**: 感谢开发者对代码质量的重视，交叉审查是确保项目成功的重要环节！
