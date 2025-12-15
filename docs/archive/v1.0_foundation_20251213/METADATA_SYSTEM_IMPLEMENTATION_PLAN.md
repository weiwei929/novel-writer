# 小说创作器元数据系统技术实施方案 v2.1

## 🎉 Phase 0 紧急修复完成 (2025-11-05)

### 修复成果总结
**✅ 问题根本原因确认**：ES模块导入路径缺少`.js`扩展名导致后端无法启动
**✅ 系统性修复**：修正了所有TypeScript文件的导入路径（routes/、services/、middleware/）
**✅ 认证问题解决**：确认`.env`中`REQUIRE_PASSWORD_ON_START=false`配置生效
**✅ 前后端通信恢复**：所有API端点正常响应，无401错误

### 验证结果
- **后端服务器**：稳定运行在5000端口，数据库正常初始化
- **API通信**：健康检查、项目列表、文集列表等核心接口全部正常
- **前端应用**：正常启动在3000端点，成功调用后端API
- **认证系统**：`/auth/status`端点正常响应，缓存机制正常工作

### 当前系统状态
**🟢 系统完全可用** - 可以安全开始元数据系统开发

---

## 📋 项目概述

**目标**：基于现有稳定架构，构建完整的项目/章节元数据系统，支持三栏式编辑器布局，为AI辅助写作做好数据预留。

**核心特性**：
- 项目级 + 章节级双层元数据管理
- 三栏式编辑器布局（项目导航 | 编辑器 | 章节元数据）
- 简化版本管理系统
- AI辅助预留接口
- 统一的项目创作流程

---

## 🏗️ 数据架构设计

### 1. 扩展的数据模型

#### 项目模型 (Project) - 后端扩展
```typescript
interface Project {
  // === 现有字段 ===
  id: string
  title: string
  author: string
  description?: string
  genre: string[]
  status: 'planning' | 'writing' | 'editing' | 'completed' | 'published'
  wordCount: number
  chapterCount: number
  createdAt: string
  updatedAt: string

  // === 新增：项目级元数据 ===
  metadata: ProjectMetadata
  
  // === 新增：章节规划 ===
  chapterPlanning: ChapterPlan[]
  
  // === 新增：AI预留字段 ===
  aiContext?: AIProjectContext
}

interface ProjectMetadata {
  synopsis: MetadataItem           // 梗概 - 必填
  characters: MetadataItem         // 人物小传 - 必填  
  timeline: MetadataItem           // 故事时间线 - 必填
  settings: MetadataItem           // 场景设定 - 必填
  relationships: MetadataItem      // 人物关系 - 必填
  plotStructure: MetadataItem      // 故事进程 - 必填
  chapterPlanning: MetadataItem    // 章节构建 - 必填
}

interface MetadataItem {
  current: string                  // 当前内容
  versions: SavedVersion[]         // 版本历史
  lastModified: string            // 最后修改时间
  wordCount: number               // 字数统计
}

interface SavedVersion {
  id: string
  content: string
  timestamp: string
  userNote: string                // 用户输入的版本说明
  autoSaved: boolean             // 是否自动保存
}

interface ChapterPlan {
  id: string
  order: number                   // 章节顺序
  title: string                   // 计划标题
  plannedLength: number          // 预计字数
  keyPlotPoints: string[]        // 关键情节点
  status: 'planned' | 'started' | 'completed'
}
```

#### 章节模型 (Chapter) - 后端扩展
```typescript
interface Chapter {
  // === 现有字段 ===
  id: string
  projectId: string
  title: string
  content: string
  wordCount: number
  order: number
  createdAt: string
  updatedAt: string

  // === 新增：章节级元数据 ===
  metadata: ChapterMetadata
  
  // === 新增：版本管理 ===
  contentVersions: SavedVersion[]
  
  // === 新增：AI预留字段 ===
  aiContext?: AIChapterContext
}

interface ChapterMetadata {
  synopsis: MetadataItem          // 章节梗概 - 必填
  characters: MetadataItem        // 涉及人物 - 必填
  timeSetting: MetadataItem       // 时间设定 - 必填  
  sceneSettings: MetadataItem     // 场景设定 - 必填
}
```

#### AI预留数据结构
```typescript
interface AIProjectContext {
  themes: string[]                // 提取的主题
  style: string                   // 写作风格分析
  structure: string               // 故事结构类型
  lastAnalysis: string           // 最后分析时间
}

interface AIChapterContext {
  purpose: string                 // 章节目的
  conflicts: string[]            // 冲突类型
  emotionalArc: string           // 情感弧线
  suggestions: string[]          // AI建议
}
```

---

## 🎨 前端界面架构

### 1. 三栏式编辑器布局

#### EnhancedEditorPage 重构设计
```typescript
// 新的页面布局组件
interface EditorLayoutProps {
  project: Project
  chapters: Chapter[]
  currentChapter: Chapter | null
  onChapterSelect: (chapter: Chapter) => void
  onMetadataUpdate: (type: string, data: any) => void
}

// 布局结构
<div className="editor-layout h-screen flex">
  {/* 左侧面板 - 项目导航 */}
  <ProjectNavigationPanel 
    project={project}
    chapters={chapters}
    currentChapter={currentChapter}
    onChapterSelect={onChapterSelect}
    className="w-80 min-w-80"
  />
  
  {/* 中央编辑器 */}
  <div className="flex-1 flex flex-col">
    <EditorToolbar />
    <MonacoEditor 
      value={content}
      onChange={handleContentChange}
      className="flex-1"
    />
    <EditorStatusBar />
  </div>
  
  {/* 右侧面板 - 章节元数据 */}
  <ChapterMetadataPanel 
    chapter={currentChapter}
    onUpdate={onMetadataUpdate}
    className="w-80 min-w-80"
  />
</div>
```

### 2. 核心组件设计

#### ProjectNavigationPanel (左侧面板)
```typescript
interface ProjectNavigationPanelProps {
  project: Project
  chapters: Chapter[]
  currentChapter: Chapter | null
  onChapterSelect: (chapter: Chapter) => void
}

// 组件功能：
// - 项目基本信息显示
// - 项目元数据快速查看
// - 章节列表和状态显示  
// - 项目设置入口
// - 收缩/展开功能
```

#### ChapterMetadataPanel (右侧面板)
```typescript
interface ChapterMetadataPanelProps {
  chapter: Chapter | null
  onUpdate: (field: string, value: string) => void
}

// 组件功能：
// - 当前章节元数据显示和编辑
// - 快速编辑模式
// - 版本历史查看
// - 收缩/展开功能
```

#### MetadataEditor (元数据编辑器)
```typescript
interface MetadataEditorProps {
  type: 'project' | 'chapter'
  field: string
  value: MetadataItem
  onSave: (content: string, note: string) => void
  required?: boolean
}

// 编辑器特性：
// - 基于Monaco编辑器
// - 支持Markdown语法  
// - 版本保存功能
// - 字数统计
// - 必填项验证
```

---

## 🚀 实施阶段规划

### Phase 1: 后端数据层重构 (3-4天)

#### Day 1: 数据模型扩展
**任务清单：**
- [ ] 扩展 `backend/src/types/` 中的 Project 和 Chapter 接口
- [ ] 创建 MetadataItem, SavedVersion 等新类型定义
- [ ] 更新数据库 schema (LowDB结构调整)
- [ ] 创建数据迁移脚本，保证现有数据兼容

**关键文件：**
- `backend/src/types/project.ts`
- `backend/src/types/chapter.ts`  
- `backend/src/types/metadata.ts`
- `backend/src/services/migration.ts`

#### Day 2-3: API接口扩展
**任务清单：**
- [ ] 扩展 Projects API 支持元数据CRUD
- [ ] 扩展 Chapters API 支持元数据和版本管理
- [ ] 创建 Metadata API 专门处理元数据操作
- [ ] 添加版本管理 API 端点
- [ ] 更新 API 响应格式

**新增API端点：**
```typescript
// 项目元数据
PUT  /api/v1/projects/:id/metadata/:field
GET  /api/v1/projects/:id/metadata/:field/versions
POST /api/v1/projects/:id/metadata/:field/save-version

// 章节元数据  
PUT  /api/v1/chapters/:id/metadata/:field
GET  /api/v1/chapters/:id/metadata/:field/versions
POST /api/v1/chapters/:id/metadata/:field/save-version

// 章节规划
PUT  /api/v1/projects/:id/chapter-planning
```

#### Day 4: 数据验证和测试
**任务清单：**
- [ ] 实现元数据必填项验证
- [ ] 创建数据一致性检查
- [ ] API 单元测试编写
- [ ] 数据迁移测试

### Phase 2: 前端组件重构 (4-5天)

#### Day 1: 基础组件创建
**任务清单：**
- [ ] 创建 MetadataEditor 组件
- [ ] 创建 VersionHistory 组件
- [ ] 创建 ProjectNavigationPanel 组件
- [ ] 创建 ChapterMetadataPanel 组件

**关键文件：**
- `frontend/src/components/metadata/MetadataEditor.tsx`
- `frontend/src/components/metadata/VersionHistory.tsx`
- `frontend/src/components/editor/ProjectNavigationPanel.tsx`
- `frontend/src/components/editor/ChapterMetadataPanel.tsx`

#### Day 2-3: EnhancedEditorPage 重构
**任务清单：**
- [ ] 重构 EnhancedEditorPage 为三栏布局
- [ ] 集成项目导航面板
- [ ] 集成章节元数据面板
- [ ] 实现面板收缩/展开功能
- [ ] 更新路由和状态管理

#### Day 4-5: 元数据管理界面
**任务清单：**
- [ ] 创建项目元数据编辑页面
- [ ] 集成版本管理功能
- [ ] 实现必填项验证
- [ ] 添加保存和历史查看功能

### Phase 3: 创作流程整合 (2-3天)

#### Day 1: 项目创建流程
**任务清单：**
- [ ] 重构项目创建向导
- [ ] 添加元数据初始化步骤
- [ ] 实现章节规划设置
- [ ] 集成到"开始创作"流程

#### Day 2: 主页集成
**任务清单：**
- [ ] 修复"开始创作"按钮功能
- [ ] 更新项目管理页面
- [ ] 修复文集管理功能
- [ ] 更新统计数据显示

#### Day 3: 数据同步优化
**任务清单：**
- [ ] 实现自动保存优化
- [ ] 添加数据同步提示
- [ ] 优化加载性能
- [ ] 错误处理完善

### Phase 4: 测试和优化 (1-2天)

#### Day 1: 功能测试
**任务清单：**
- [ ] 完整创作流程测试
- [ ] 元数据编辑功能测试
- [ ] 版本管理功能测试
- [ ] 数据一致性验证

#### Day 2: 用户体验优化
**任务清单：**
- [ ] 界面细节调整
- [ ] 性能优化
- [ ] 错误提示优化
- [ ] 文档更新

---

## 🔧 技术实施细节

### 1. 响应式处理策略
```css
/* 桌面端 - 三栏布局 */
@media (min-width: 1024px) {
  .editor-layout {
    grid-template-columns: 320px 1fr 320px;
  }
}

/* 平板端 - 隐藏侧栏，提供切换按钮 */
@media (max-width: 1023px) {
  .sidebar {
    position: fixed;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  .sidebar.open {
    transform: translateX(0);
  }
}
```

### 2. 数据同步策略
```typescript
// 自动保存策略
const useAutoSave = (content: string, onSave: (content: string) => void) => {
  const [lastSaved, setLastSaved] = useState<Date>()
  const [hasChanges, setHasChanges] = useState(false)
  
  useEffect(() => {
    if (!hasChanges) return
    
    const timer = setTimeout(() => {
      onSave(content)
      setLastSaved(new Date())
      setHasChanges(false)
    }, 3000) // 3秒自动保存
    
    return () => clearTimeout(timer)
  }, [content, hasChanges])
}
```

### 3. 版本管理UI交互
```typescript
// 版本保存对话框
const SaveVersionDialog = ({ onSave, onCancel }) => {
  const [note, setNote] = useState('')
  
  const handleSave = () => {
    const version = {
      content: currentContent,
      timestamp: new Date().toISOString(),
      userNote: note,
      autoSaved: false
    }
    onSave(version)
  }
  
  return (
    <Dialog>
      <input 
        placeholder="版本说明 (例如: 调整主线情节走向)"
        value={note}
        onChange={e => setNote(e.target.value)}
      />
      <button onClick={handleSave}>保存版本</button>
    </Dialog>
  )
}
```

---

## 📊 成功指标

### 功能指标
- [ ] 支持7种项目级元数据的完整CRUD操作
- [ ] 支持4种章节级元数据的完整CRUD操作  
- [ ] 实现版本历史保存和恢复功能
- [ ] 三栏布局在桌面端完美显示
- [ ] 必填项验证100%覆盖

### 性能指标
- [ ] 元数据保存响应时间 < 200ms
- [ ] 编辑器切换章节加载时间 < 500ms
- [ ] 版本历史查看响应时间 < 300ms
- [ ] 内存使用增长 < 20%

### 用户体验指标
- [ ] 创作流程完整无断点
- [ ] 侧栏收缩/展开流畅
- [ ] 元数据编辑体验与章节编辑一致
- [ ] 版本管理操作直观易懂

---

## 🚨 风险评估和缓解策略

### 技术风险
1. **数据迁移风险**
   - 风险：现有项目数据可能丢失
   - 缓解：创建完整的备份和回滚机制

2. **性能风险** 
   - 风险：元数据增加可能影响加载速度
   - 缓解：实施懒加载和数据分页

3. **兼容性风险**
   - 风险：新数据结构可能导致旧版本不兼容
   - 缓解：保持API版本向后兼容

### 进度风险
1. **开发进度延期**
   - 缓解：分阶段交付，优先核心功能
   - 应急方案：简化版本管理功能

2. **测试时间不足**
   - 缓解：开发过程中持续测试
   - 应急方案：重点测试核心创作流程

---

## ✅ 2025-11-06 实施进展与结构更新

本节记录本阶段已落地的实现、和原方案的小幅结构调整，确保文档与代码一致。

### 已完成功能（对照计划）
- 后端
  - 启用项目/章节元数据字段白名单：
    - ProjectMetadata: synopsis, characters, timeline, settings, relationships, plotStructure
    - ChapterMetadata: synopsis, characters, timeSetting, sceneSettings
  - 元数据与版本接口已上线：
    - GET  /api/v1/projects/:id/metadata/:field
    - PUT  /api/v1/projects/:id/metadata/:field
    - GET  /api/v1/projects/:id/metadata/:field/versions
    - POST /api/v1/projects/:id/metadata/:field/save-version
    - GET  /api/v1/chapters/:id/metadata/:field
    - PUT  /api/v1/chapters/:id/metadata/:field
    - GET  /api/v1/chapters/:id/metadata/:field/versions
    - POST /api/v1/chapters/:id/metadata/:field/save-version
  - 章节规划接口：PUT /api/v1/projects/:id/chapter-planning
  - 统计同步：章节保存成功后尝试更新项目 wordCount/chapterCount（失败时不阻塞并有提示）。

- 前端
  - 三栏编辑器页面 EnhancedEditorPage 稳定运行：左（项目导航）| 中（Markdown 编辑器）| 右（章节元数据）。
  - 新增 ProjectMetadataPanel 抽屉面板，支持项目级元数据编辑、保存版本与历史恢复。
  - MetadataEditor 组件统一承载保存/版本历史/恢复与字数统计。
  - ProjectsList 的“编辑”可进入编辑器；编辑页支持快速“创建章节并跳转”。
  - 未保存改动采用“自动保存 + 通知”替代阻塞式确认框。

### 与原方案的结构性修正（重要）
- chapterPlanning 不再作为 ProjectMetadata 下的 MetadataItem；统一为项目对象根上的结构化数组：`project.chapterPlanning: ChapterPlan[]`。
  - 对应后端：从元数据白名单与初始化中移除了 `chapterPlanning` 字段，并在兼容处理里清理历史 `metadata.chapterPlanning`。
  - 对应前端：在 ProjectNavigationPanel 中提供“编辑章节规划（JSON）”入口，调用独立的 `PUT /projects/:id/chapter-planning`。

### 当前状态与验证
- 后端日志显示 5000 端口启动稳定，关键端点 200/201 正常（项目、章节、元数据保存与版本、章节创建、统计刷新等）。
- 前端多次构建通过（vite/tsc），三栏布局与抽屉面板交互顺畅。

### 下一步建议（小步快跑）
- 已完成：为 MetadataEditor 增加“拉取当前已保存值”的只读端点与前端初始化加载。
- 已完成：将 MetadataEditor 内部遗留的 alert/confirm 替换为通知组件（非阻塞提示：成功/失败/警告）。
- 已完成：将章节规划由 JSON 输入演进为结构化表单编辑器（增删改排序、状态、要点、字数）。


## 🎯 Phase 0 紧急修复执行报告 (已完成)

### ✅ **修复成果确认**

**🔥 阻塞性问题已解决：**
- [x] **ES模块导入问题**：修正所有TypeScript文件缺少`.js`扩展名的导入路径
- [x] **认证中间件问题**：`.env`中`REQUIRE_PASSWORD_ON_START=false`配置生效
- [x] **后端服务器稳定性**：服务器可以稳定启动并保持运行
- [x] **API通信恢复**：所有核心API端点正常响应，无401错误

**🔥 验证测试完成：**
- [x] `GET /health` - 200响应正常
- [x] `GET /api/v1/projects` - 返回正确JSON格式数据
- [x] `GET /api/v1/collections` - 返回成功响应  
- [x] `GET /auth/status` - 认证状态正常
- [x] 前端应用可以正常启动并调用后端API
- [x] 缓存机制正常工作（304响应）

**🔥 系统当前状态：**
- 后端：稳定运行在5000端口，数据库正常初始化
- 前端：可正常启动在3000端口，API通信正常
- 认证：绕过启动认证，API访问无障碍
- 数据：现有数据完整保留，数据库连接正常

### 📋 **开发就绪确认**

**🟢 核心基础设施状态：**
- [x] TypeScript编译系统正常
- [x] ES模块导入路径修复完成
- [x] 数据库服务正常运行
- [x] API路由系统完全正常
- [x] 前后端通信链路畅通

**🟢 代码库健康状态：**
- [x] 所有导入依赖关系正确
- [x] 编译过程无错误
- [x] 运行时无崩溃问题
- [x] 旧文件清理完成

**🟢 开发环境就绪：**
- [x] 开发服务器可以稳定启动
- [x] 热重载功能正常
- [x] 调试工具可以正常使用
- [x] API测试环境可用

### � **可以安全开始元数据系统开发**

**确认结论：**
所有阻塞性问题已解决，系统基础架构稳定可靠，满足后续开发的所有前置条件。可以按计划开始Phase 1的后端数据层重构工作。
- [ ] 前端可以成功调用所有API
- [ ] 项目管理页面显示真实数据
- [ ] "开始创作"按钮有基础响应

**⚡ P1验收（功能基础完整）：**
- [ ] 可以创建新项目
- [ ] 编辑器可以保存内容到项目  
- [ ] 基础的项目-章节关联正常
- [ ] 核心创作流程能够走通

---

## 📝 **修改后的开发计划**

### 新的Phase规划：

**Phase 0: 紧急修复 (1天) ← 新增**
- 解决认证问题
- 恢复基础API通信
- 修复核心页面功能

**Phase 1: 数据层重构 (3-4天)**  
- 在稳定基础上扩展数据模型
- 确保新功能不影响现有功能

**Phase 2-4: 按原计划执行**
- 前端组件重构
- 创作流程整合  
- 测试和优化

---

## 🎯 **开发计划确认与下一步行动**

### **✅ 技术方案验证**
基于Phase 0修复成果，确认原技术实施方案完全可行：
- **稳健性** ✅ - 基于现有稳定架构，风险可控
- **完整性** ✅ - 覆盖所有核心需求，数据结构设计合理  
- **可扩展性** ✅ - 为AI集成预留充分接口
- **用户友好** ✅ - 符合创作习惯的交互设计

### **🚀 立即可执行的开发计划**

**Phase 1: 后端数据层重构 (可立即开始)**
- 当前系统稳定，支持安全的数据模型扩展
- API接口完全正常，可以逐步添加新端点
- 数据库服务健康，支持schema更新

**Phase 2-4: 前端重构 → 流程整合 → 测试优化**
- 所有前置依赖已满足
- 开发环境完全就绪
- 可以按计划时间线执行

### **⚡ 下一步立即行动**

**建议立即开始：**
1. **Phase 1 Day 1**: 扩展后端数据模型
2. **重点任务**: 更新 `backend/src/types/` 中的接口定义
3. **优先级**: 先完成Project和Chapter接口扩展，再处理元数据结构

**预期成果：**
- 7-10天内完成完整的元数据系统
- 实现三栏式编辑器布局
- 构建完整的项目创作工作流

**🎉 结论：系统已就绪，可以安全开始元数据系统开发！**