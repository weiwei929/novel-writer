# P0/P1 关键隐患修复计划

## 一、修复范围

### P0 (必须修复)
1. ✅ 导入元数据确认机制
2. ✅ 导入格式验证（强硬限定）

### P1 (强烈建议)
3. ✅ 项目规模限制（章节数、字数）
4. ✅ AI 降级策略

---

## 二、格式和规模限制规范

### 2.1 导入格式限制 (强硬)

**规则**:
```
# 作品标题 (一级标题，有且仅有一个)

## 第一章 章节标题 (二级标题，章节名)
章节正文内容...

## 第二章 章节标题
章节正文内容...
```

**验证规则**:
- ✅ 必须有且仅有一个一级标题 (`# `)
- ✅ 至少有一个二级标题 (`## `)
- ✅ 不允许三级及以下标题作为章节分隔
- ✅ 章节数量：1-50 章
- ✅ 单章字数：100-8000 字
- ❌ 不符合规范 → 拒绝导入，返回详细错误信息

### 2.2 项目规模限制

**限制规则**:
```typescript
const LIMITS = {
  MAX_CHAPTERS: 50,           // 最多 50 章
  MIN_CHAPTER_WORDS: 100,     // 单章最少 100 字
  MAX_CHAPTER_WORDS: 8000,    // 单章最多 8000 字
  MAX_METADATA_LENGTH: 10000, // 元数据字段最长 10k 字符
}
```

**超限处理**:
- 章节数 > 50 → 提示拆分为多部作品（上、中、下或续集）
- 单章 > 8000 字 → 提示拆分章节
- 单章 < 100 字 → 警告（允许但提示）

---

## 三、实施方案

### 修复 1: 导入格式验证

#### 后端修改

**文件**: `backend/src/routes/projects.ts`

```typescript
// 1. 添加格式验证函数
function validateImportFormat(content: string): {
  valid: boolean
  error?: string
  title?: string
  chapters?: Array<{ title: string; content: string }>
} {
  const lines = content.split('\n')
  
  // 检查一级标题
  const h1Lines = lines.filter(l => l.trim().startsWith('# '))
  if (h1Lines.length === 0) {
    return { valid: false, error: '缺少作品标题（一级标题 # ）' }
  }
  if (h1Lines.length > 1) {
    return { valid: false, error: '只能有一个作品标题（一级标题 # ）' }
  }
  
  const title = h1Lines[0].replace(/^#\s+/, '').trim()
  
  // 提取章节
  const chapters: Array<{ title: string; content: string }> = []
  let currentChapter: { title: string; content: string } | null = null
  
  for (const line of lines) {
    if (line.trim().startsWith('## ')) {
      // 保存上一章
      if (currentChapter) {
        chapters.push(currentChapter)
      }
      // 开始新章
      currentChapter = {
        title: line.replace(/^##\s+/, '').trim(),
        content: ''
      }
    } else if (currentChapter && !line.trim().startsWith('# ')) {
      currentChapter.content += line + '\n'
    }
  }
  
  // 保存最后一章
  if (currentChapter) {
    chapters.push(currentChapter)
  }
  
  // 验证章节数量
  if (chapters.length === 0) {
    return { valid: false, error: '没有找到章节（二级标题 ## ）' }
  }
  if (chapters.length > 50) {
    return { 
      valid: false, 
      error: `章节数量过多（${chapters.length} 章），建议拆分为多部作品（上、中、下或续集），每部不超过 50 章` 
    }
  }
  
  // 验证单章字数
  for (let i = 0; i < chapters.length; i++) {
    const wordCount = countWords(chapters[i].content)
    if (wordCount < 100) {
      return { 
        valid: false, 
        error: `第 ${i + 1} 章字数过少（${wordCount} 字），建议至少 100 字` 
      }
    }
    if (wordCount > 8000) {
      return { 
        valid: false, 
        error: `第 ${i + 1} 章字数过多（${wordCount} 字），建议拆分为多章，每章不超过 8000 字` 
      }
    }
  }
  
  return { valid: true, title, chapters }
}

// 2. 修改导入接口，添加格式验证
app.post('/import', async (req, reply) => {
  const { content } = req.body // 改为接收原始 Markdown 内容
  
  // 格式验证
  const validation = validateImportFormat(content)
  if (!validation.valid) {
    return reply.code(400).send({ 
      success: false, 
      error: validation.error 
    })
  }
  
  // ... 继续导入流程
})
```

### 修复 2: 导入元数据确认机制

#### 后端修改

**文件**: `backend/src/routes/projects.ts`

```typescript
// 1. 修改提取函数，保存到临时字段
async function extractMetadataInBackground(...) {
  // ... 提取逻辑
  
  // 保存到临时字段
  await prisma.project.update({
    where: { id: projectId },
    data: {
      metadata: {
        ...existingMetadata,
        _draft: extractedMetadata,  // 临时字段
        _extractedAt: new Date().toISOString()
      }
    }
  })
}

// 2. 添加确认接口
app.post('/projects/:id/confirm-metadata', async (req, reply) => {
  const { id } = req.params
  const { confirmed } = req.body
  
  const project = await prisma.project.findUnique({ where: { id } })
  const draft = project.metadata?._draft
  
  if (!draft) {
    return reply.code(404).send({ error: '没有待确认的元数据' })
  }
  
  if (confirmed) {
    // 确认：将 draft 提升为正式元数据
    const { _draft, _extractedAt, ...rest } = project.metadata
    await prisma.project.update({
      where: { id },
      data: {
        metadata: { ...rest, ...draft },
        author: draft.author || project.author,
        description: draft.synopsis || project.description
      }
    })
  } else {
    // 拒绝：删除 draft
    const { _draft, _extractedAt, ...rest } = project.metadata
    await prisma.project.update({
      where: { id },
      data: { metadata: rest }
    })
  }
  
  return { success: true }
})
```

#### 前端修改

**新组件**: `frontend/src/components/import/MetadataReviewModal.tsx`

```typescript
// 显示提取的元数据，让用户确认或拒绝
interface MetadataReviewModalProps {
  isOpen: boolean
  projectId: string
  extractedMetadata: any
  onConfirm: () => void
  onReject: () => void
}
```

### 修复 3: 章节大纲生成限制

**文件**: `frontend/src/components/ai/ChapterOutlineGenerator.tsx`

```typescript
// 修改章节数量输入限制
<input
  type="number"
  value={chapterCount}
  onChange={(e) => {
    const value = parseInt(e.target.value) || 1
    if (value > 50) {
      setError('章节数量不能超过 50 章，建议拆分为多部作品')
      setChapterCount(50)
    } else {
      setChapterCount(Math.max(1, value))
    }
  }}
  min="1"
  max="50"
  className="..."
/>
<p className="mt-2 text-xs text-gray-500">
  建议：短篇 10-20 章，中篇 20-35 章，长篇 35-50 章
  <br />
  ⚠️ 超过 50 章请拆分为多部作品（上、中、下或续集）
</p>
```

### 修复 4: AI 降级策略

**文件**: `frontend/src/components/ai/AIMetadataAssistant.tsx`

```typescript
// 添加手动输入模式
const [manualMode, setManualMode] = useState(false)

// 在错误时提示切换到手动模式
{error && (
  <div className="...">
    <AlertCircle size={16} />
    {error}
    <button
      onClick={() => setManualMode(true)}
      className="ml-2 text-blue-600 underline"
    >
      切换到手动输入
    </button>
  </div>
)}

// 手动输入界面
{manualMode && (
  <textarea
    value={manualContent}
    onChange={(e) => setManualContent(e.target.value)}
    placeholder="请手动输入内容..."
    className="w-full h-64 p-4 border rounded"
  />
)}
```

---

## 四、实施顺序

1. ✅ 添加导入格式验证（强硬限定）
2. ✅ 添加项目规模限制
3. ✅ 实施导入元数据确认机制
4. ✅ 添加 AI 降级策略

---

## 五、用户提示优化

### 导入失败提示

```
❌ 导入失败：章节数量过多（65 章）

建议方案：
1. 拆分为多部作品：
   - 《作品名·上》(1-25 章)
   - 《作品名·中》(26-50 章)
   - 《作品名·下》(51-65 章)

2. 或者拆分为正传和续集：
   - 《作品名》(1-50 章)
   - 《作品名·续》(51-65 章)
```

### 章节字数超限提示

```
❌ 导入失败：第 3 章字数过多（12,500 字）

建议：将第 3 章拆分为多章，每章不超过 8000 字
这样可以：
- 降低 AI 处理负担
- 提高写作和审阅效率
- 更好的章节节奏控制
```

---

**实施计划创建时间**: 2025-12-23
