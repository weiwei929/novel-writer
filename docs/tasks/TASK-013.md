# TASK-013（编辑器卡）：创作室编辑器 + 4 模式右栏 + 顺手修

> 前情：TASK-012 已完成 `/work/:id` 统一详情页。用户可以从章节列表的「进入创作室」或「写作」按钮进入编辑器。
> 目标：重写写作编辑器，使其成为纯 Monaco 写作环境，去掉 1.0 的前置负担（frontmatter/元数据提取/AI 审阅），新增参考侧栏，修掉遗留问题。

---

## 前置状态

- `v2-dev` 分支，包含 TASK-012 的全部提交
- 路由已就位：`/writing/:projectId/:chapterId` → 尚无组件（TASK-011 留空）
- 旧 `/editor/*` → 已重定向到 `/writing/*`（TASK-011）
- `EnhancedEditorPage.tsx` 存在但包含 1.0 遗留包袱：frontmatter 构建/解析、元数据提取轮询、AIReviewPanel、退出时改章节状态
- `MarkdownEditor.tsx` 包含 frontmatter 预览渲染，高度写死 `calc(100vh - 220px)`
- `ChapterContentModal` / `ChapterPlanningEditor` 等组件可用

## 约束

1. **只建新页，不拆旧页** — 新建 `WritingEditorPage.tsx`，不动 `EnhancedEditorPage.tsx`（后续清理）
2. **纯写作环境** — 编辑器内容纯 Markdown，不含 frontmatter。元数据显示在右侧栏或弹出面板，不嵌入正文
3. **右栏 4 模式互斥** — `pure | reference | ai | review`，同一时间只有一个激活
4. **Monaco 只负责正文** — 章节框架编辑（标题/梗概/排序）归 `/work/:id` 详情页，编辑器只写内容
5. **保绿** — `tsc --noEmit` + 前端构建通过

---

## 任务

### 0. 顺手修（P0，先做）

#### 0.1 编辑器返回路径 → `/work/:id`

`WritingEditorPage.tsx` 的「返回」按钮跳转到 `/work/${projectId}`，不再跳到 `/projects`。

> 顺手修 #2，TASK-012 完成后 `/work/:id` 已可用。

#### 0.2 MarkdownEditor 高度修复

`frontend/src/components/editor/MarkdownEditor.tsx`，第 225 行：

```typescript
// 修改前
const editorHeight = isFullscreen ? 'calc(100vh - 60px)' : 'calc(100vh - 220px)'

// 修改后
const editorHeight = isFullscreen ? 'calc(100vh - 60px)' : 'calc(100vh - 112px)'
```

> 顺手修 #3。220px 是 1.0 工具条 + 提示横幅的总高。2.0 工具条更精简，修正为 112px（工具条 ~56px + 间距 ~56px）。具体值可在构建后微调，原则是**编辑器不超出视口**，不出现双向滚动。

### 1. 右栏模式切换架构

#### 1.1 WritingEditorPage 顶部栏

`frontend/src/pages/WritingEditorPage.tsx` **新建**：

```
┌──────────────────────────────────────────────────────────┐
│ ← 返回  [项目标题] · 第 N 章 · [章节标题]  [字数]  [保存]│
│         [Pure] [参考] [AI] [审阅]  ← 4 模式切换按钮     │
├────────────────┬──────────────────────┬──────────────────┤
│  章节导航       │    Monaco 编辑器      │  右栏（按模式变化）│
│  (左侧栏)       │    (主区域)           │  pure: 隐藏     │
│                 │                      │  reference: 参考 │
│                 │                      │  ai: AI 助手     │
│                 │                      │  review: 占位    │
└────────────────┴──────────────────────┴──────────────────┘
```

**顶栏设计（从 EnhancedEditorPage 简化）：**

```typescript
// 状态变量
type EditorMode = 'pure' | 'reference' | 'ai' | 'review'
const [editorMode, setEditorMode] = useState<EditorMode>('pure')
```

**4 模式按钮组（顶栏右侧）：**

```typescript
<div className="flex items-center gap-1 rounded-lg bg-gray-100 p-0.5">
  <ModeButton mode="pure"     active={editorMode === 'pure'}     label="写作" />
  <ModeButton mode="reference" active={editorMode === 'reference'} label="参考" />
  <ModeButton mode="ai"       active={editorMode === 'ai'}       label="AI" />
  <ModeButton mode="review"   active={editorMode === 'review'}   label="审阅" />
</div>
```

各模式按钮应用 `selected` 态样式（如 bg-white shadow），互斥切换。

#### 1.2 左侧栏 — 章节导航（复用）

直接复用 `ProjectNavigationPanel`（与 `EnhancedEditorPage` 一致）：

```typescript
<ProjectNavigationPanel
  project={project}
  chapters={chapters}
  currentChapter={chapter}
  onChapterSelect={handleChapterSelect}
  onProjectSettings={() => setShowProjectMetadata(true)}
  onChaptersRefresh={refreshChapters}
/>
```

### 2. 右栏：4 模式内容

#### 2.1 Pure 模式（默认）

右栏不渲染，编辑器占满剩余宽度。点击 Pure 按钮关闭其他模式。

#### 2.2 Reference 模式 — 参考侧栏

新建 `frontend/src/components/writer/ReferenceSidebar.tsx`：

```
┌─────────────────────┐
│ 参考作品设定    [280px] │
├─────────────────────┤
│ [人物] [故事线] [心流] │  ← 三 Tab
├─────────────────────┤
│                     │
│  人物 Tab → 角色列表  │
│  故事线 Tab → 时间线  │
│  心流 Tab → 心流条目  │
│                     │
│  全部只读展示          │
└─────────────────────┘
```

**数据来源**：调用 `workApi.getDetail(projectId)` 获取 characters / timelineEntries / creativeFlows。

**默认宽度 280px**，可通过拖拽调整（暂不做，留到后续）。窗口 < 1024px 时自动折叠。

**记住偏好**：用 `localStorage` 存储 `reference_sidebar_open` 和 `reference_sidebar_width`。

**权限**：全部只读（作品设定编辑归 `/work/:id` 详情页）。

---

**Three Tab implementations:**

**Tab 1 — 人物/角色列表：**
```typescript
interface Character {
  id: string
  name: string
  roleType?: string  // "主角一号"/"主角二号"/"重要配角"/"普通配角"/"龙套"
  gender?: string
  personality?: string
  identity?: string
}
```
展示：头像占位（首字圆形） + 姓名 + 角色定位 + 简短描述。点击展开详情。

**Tab 2 — 故事线/时间线：**
```typescript
interface TimelineEntry {
  id: string
  time: string
  location: string
  characters: string
  premise?: string
  outcome?: string
  sortOrder: number
}
```
展示：时间 + 地点 + 人物 + 起因/结果。按 sortOrder 排列。

**Tab 3 — 创作心流：**
```typescript
interface CreativeFlow {
  id: string
  title: string
  content: string
  tags?: string[]
}
```
展示：标题 + Markdown 内容预览。

---

#### 2.3 AI 模式

复用现有 `AIAssistantPanel` 组件（`frontend/src/components/writer/AIAssistantPanel.tsx`）：

```typescript
{editorMode === 'ai' && (
  <AIAssistantPanel
    onClose={() => setEditorMode('pure')}
    onApplyContent={handleApplyAIContent}
    projectId={project?.id}
    chapterId={chapter?.id}
  />
)}
```

> 与 `EnhancedEditorPage` 现有逻辑一致，直接复用。

#### 2.4 Review 模式

**占位**。显示文案：

```
审阅功能
编审部模块尚未实现。
审阅功能将在后续版本中归属于"编审部"阶段。
```

> 以后审阅功能归编审部，不在编辑器内做。

### 3. MarkdownEditor 清理

#### 3.1 移除 frontmatter 预览

`frontend/src/components/editor/MarkdownEditor.tsx`：

- 移除整个 `renderPreview` 函数（第 131~213 行）
- 预览模式改为简单的 Markdown→HTML 渲染（调用通用 markdown 库或轻量正则，去掉 frontmatter 解析部分）
- 移除工具栏中的「属性」按钮（第 296~302 行，`toggleFrontmatter`）
- `EnhancedMonacoEditorRef` 接口中的 `toggleFrontmatter` 声明保留（`EnhancedEditorPage` 还用），`MarkdownEditor` 不再调它

#### 3.2 高度修正

见 0.2。

### 4. WritingEditorPage 组装

`frontend/src/pages/WritingEditorPage.tsx` **完整实现**：

#### 4.1 数据加载

```typescript
const { projectId, chapterId } = useParams<{ projectId: string; chapterId: string }>()

const loadData = async (pId: string, cId: string) => {
  const [projectData, chaptersData, chapterData] = await Promise.all([
    projectsApi.getById(pId),
    chaptersApi.getByProjectId(pId),
    chaptersApi.getById(cId),
  ])
  setProject(projectData)
  setChapters(chaptersData)
  setChapter(chapterData)
  // 纯 Markdown，不构造 frontmatter，不拼接 header
  setContent(chapterData.content || '')
}
```

**关键区别 vs EnhancedEditorPage：**
- ❌ 不构造 frontmatter header（删掉第 82~93 行）
- ❌ 不检查 `hasHeader`
- ❌ 不拼接 `# 作品标题` 和 `## 第 N 章：标题`
- ❌ 不调用 `projectsApi.extractMetadata`
- ❌ 不轮询 `pollForMetadata`
- ✅ 直接 `chapterData.content || ''`

#### 4.2 保存

```typescript
const handleSave = async (saveContent?: string) => {
  if (!chapter) return
  const contentToSave = saveContent || content
  const newWordCount = calculateWordCount(contentToSave)
  try {
    setSaving(true)
    await chaptersApi.update(chapter.id, {
      content: contentToSave,
      wordCount: newWordCount,
    })
    // 更新项目总字数
    updateProjectWordCount(newWordCount)
    setHasUnsavedChanges(false)
    setLastSaved(new Date())
  } catch (err) {
    setError('保存章节失败')
  } finally {
    setSaving(false)
  }
}
```

**关键区别 vs EnhancedEditorPage：**
- ❌ 不解析 frontmatter（删掉第 135~167 行）
- ❌ 不从 frontmatter 提取 synopsis/metadata
- ❌ 不重建 frontmatter header
- ✅ 直接存纯 Markdown

#### 4.3 章节切换

```typescript
const handleChapterSelect = async (selectedChapter: Chapter) => {
  if (hasUnsavedChanges && chapter) {
    await handleSave()
  }
  navigate(`/writing/${projectId}/${selectedChapter.id}`)
}
```

#### 4.4 返回

```typescript
const handleGoBack = async () => {
  if (hasUnsavedChanges && chapter) {
    await handleSave()
  }
  navigate(`/work/${projectId}`)  // 顺手修 #2
}
```

#### 4.5 整体布局

参考 `EnhancedEditorPage` 的布局结构（左栏 + 编辑器 + 右栏），但右栏按模式切换：

```typescript
// 右栏宽度
const rightPanelWidth = editorMode === 'pure' ? 0 : editorMode === 'reference' ? 280 : 360

// 布局
<div className="h-screen flex flex-col">
  {/* 顶栏 */}
  <TopBar ... />
  
  <div className="flex-1 flex overflow-hidden">
    {/* 左栏：章节导航 */}
    <ProjectNavigationPanel ... />
    
    {/* 分隔线 */}
    <div className="w-px bg-gray-200" />
    
    {/* 主编辑区 */}
    <div className="flex-1 flex flex-col overflow-hidden">
      <MarkdownEditor ... />
    </div>
    
    {/* 右栏：按模式 */}
    {editorMode !== 'pure' && (
      <>
        <div className="w-px bg-gray-200" />
        {editorMode === 'reference' && <ReferenceSidebar ... />}
        {editorMode === 'ai' && <AIAssistantPanel ... />}
        {editorMode === 'review' && <ReviewPlaceholder />}
      </>
    )}
  </div>
</div>
```

### 5. 参考侧栏自动折叠

在 `WritingEditorPage` 中监听窗口宽度：

```typescript
useEffect(() => {
  const checkWidth = () => {
    if (window.innerWidth < 1024 && editorMode === 'reference') {
      setEditorMode('pure')
    }
  }
  window.addEventListener('resize', checkWidth)
  return () => window.removeEventListener('resize', checkWidth)
}, [editorMode])
```

同时用 `localStorage` 记住用户偏好：

```typescript
// 切换参考侧栏时
const toggleReference = () => {
  const newMode = editorMode === 'reference' ? 'pure' : 'reference'
  setEditorMode(newMode)
  localStorage.setItem('editor_reference_open', String(newMode === 'reference'))
}

// 初始化时
useEffect(() => {
  const saved = localStorage.getItem('editor_reference_open')
  if (saved === 'true') setEditorMode('reference')
}, [])
```

### 6. 路由确认

TASK-011 已配置：
```typescript
{ path: '/writing/:projectId/:chapterId', element: <WritingEditorPage /> },
```

本卡只需要确保 `WritingEditorPage` 已创建即可。不需要改路由。

---

## 修改清单

### 新建（2 个文件）

| 文件 | 说明 |
|------|------|
| `frontend/src/pages/WritingEditorPage.tsx` | **新建** — 2.0 纯写编辑器页 |
| `frontend/src/components/writer/ReferenceSidebar.tsx` | **新建** — 参考侧栏（人物/故事线/心流三 Tab） |

### 修改（2 个文件）

| 文件 | 改动 |
|------|------|
| `frontend/src/components/editor/MarkdownEditor.tsx` | 移除 frontmatter 预览渲染 + 移除"属性"按钮 + 高度修正 `220px → 112px` |
| `frontend/src/services/api.ts` | 补充 `Character` / `TimelineEntry` / `CreativeFlow` 接口（如 TASK-012 未补充完整） |

### 复用（不改）

| 组件 | 用途 |
|------|------|
| `ProjectNavigationPanel` | 左侧章节导航 |
| `AIAssistantPanel` | AI 右栏 |
| `MarkdownEditor` | Monaco 主编辑区（修改后） |
| `ChapterContentModal` | 章节内容查看弹窗（不从编辑器调，保留） |

---

## 验收标准

1. 从 `/work/:id` 点击「进入创作室」跳转到 `/writing/:projectId/:chapterId`
2. 编辑器加载纯 Markdown 内容（没有 `--- frontmatter ---` 头，没有 `# 作品标题` 前缀）
3. 保存后内容保持纯 Markdown（不生成 frontmatter）
4. 返回按钮跳转到 `/work/:projectId`（顺手修 #2）
5. 4 模式按钮在顶栏右侧，互斥切换
6. Pure 模式：右栏隐藏，编辑器全宽
7. Reference 模式：右栏 280px 显示人物/故事线/心流三 Tab，全部只读
8. AI 模式：右栏显示 AI 助手面板（复用现有组件）
9. Review 模式：右栏显示"暂未实现"占位
10. 窗口 < 1024px 时参考侧栏自动折叠
11. 参考侧栏开/关偏好被 `localStorage` 记住
12. 左侧章节导航栏正常，切换章节自动保存当前内容
13. MarkdownEditor 高度不超出视口（顺手修 #3）
14. MarkdownEditor 预览模式不再显示 frontmatter 属性表
15. `tsc --noEmit` + 前端构建通过

---

## 顺手修对照

| # | 项目 | 状态 | 本卡处理 |
|---|------|------|---------|
| 1 | ChapterManager navigate 跳转 bug | TASK-011 已修 ✅ | — |
| 2 | 编辑器返回路径 → `/work/:id` | **本卡修** | `WritingEditorPage` 返回跳 `/work/${projectId}` |
| 3 | MarkdownEditor 高度 `calc(100vh - header)` | **本卡修** | `220px → 112px` |
| 4 | `/editor` → `/writing` 重定向 | TASK-011 已修 ✅ | — |

---

## 提交

```
git add -A && git commit -m "feat: 创作室编辑器 — 纯 Monaco + 4 模式右栏 + ReferenceSidebar + 顺手修 2/4"
```
