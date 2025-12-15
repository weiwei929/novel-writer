import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { Save, Eye, EyeOff, Maximize2, Minimize2, FileText, Palette } from 'lucide-react'
import EnhancedMonacoEditor, { EnhancedMonacoEditorRef } from './EnhancedMonacoEditor'


export interface MarkdownEditorRef {
  insertContent: (text: string) => void
}

interface MarkdownEditorProps {
  initialContent?: string
  onSave?: (content: string) => void
  onContentChange?: (content: string) => void
  autoSave?: boolean
  autoSaveDelay?: number
}

const MarkdownEditor = forwardRef<MarkdownEditorRef, MarkdownEditorProps>(({
  initialContent = '',
  onSave,
  onContentChange,
  autoSave = true,
  autoSaveDelay = 2000,
}, ref) => {
  const [content, setContent] = useState(initialContent)
  const [displayMode, setDisplayMode] = useState<'edit' | 'preview'>('edit')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [editorTheme, setEditorTheme] = useState<string>('novel-light')

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>()
  const onSaveRef = useRef<typeof onSave>()
  const monacoEditorRef = useRef<EnhancedMonacoEditorRef>(null)

  onSaveRef.current = onSave

  useImperativeHandle(ref, () => ({
    insertContent: (text: string) => {
      if (monacoEditorRef.current) {
        monacoEditorRef.current.insertContent(text)
      }
    }
  }))

  // 更新内容
  useEffect(() => {
    if (initialContent !== content) {
      setContent(initialContent)
    }
  }, [initialContent])

  // 快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault()
            handleSave()
            break
          case 'p':
            e.preventDefault()
            setDisplayMode(displayMode === 'edit' ? 'preview' : 'edit')
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [displayMode])

  // 自动保存：仅在内容变化时调度，避免因 onSave 重新创建导致重复定时器
  useEffect(() => {
    if (!autoSave || content === initialContent) return

    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current)
    }

    autoSaveTimer.current = setTimeout(() => {
      // 使用稳定的回调引用，避免依赖变更导致重复触发
      if (onSaveRef.current) {
        onSaveRef.current(content)
      }
    }, autoSaveDelay)

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current)
      }
    }
  }, [content, autoSave, autoSaveDelay, initialContent])

  const handleEditorChange = (newContent: string) => {
    setContent(newContent)
    onContentChange?.(newContent)
  }

  const handleSave = async (saveContent?: string) => {
    if (!onSave) return

    const contentToSave = saveContent || content

    setIsSaving(true)
    try {
      await onSave(contentToSave)
      setLastSaved(new Date())
    } catch (error) {
      console.error('保存失败:', error)
    } finally {
      setIsSaving(false)
    }
  }



  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const toggleTheme = () => {
    const themes = ['novel-light', 'novel-dark', 'novel-sepia']
    const currentIndex = themes.indexOf(editorTheme)
    const nextIndex = (currentIndex + 1) % themes.length
    setEditorTheme(themes[nextIndex])
  }

  // 渲染Markdown预览
  const renderPreview = (text: string) => {
    let propsHtml = ''
    let body = text
    const fmMatch = body.match(/^---\n([\s\S]*?)\n---\n/)
    if (fmMatch) {
      const raw = fmMatch[1]
      const lines = raw.split('\n').filter(Boolean)
      const kv: Record<string, string> = {}
      for (const line of lines) {
        const i = line.indexOf(':')
        if (i > -1) {
          const k = line.slice(0, i).trim()
          const v = line.slice(i + 1).trim()
          kv[k] = v
        }
      }
      const pTitle = kv['projectTitle'] || ''
      const cTitle = kv['chapterTitle'] || ''
      propsHtml = `
        <div class="mb-6 rounded border bg-gray-50 p-4 text-sm">
          <div class="font-medium text-gray-900 mb-2">文档属性</div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div class="text-xs text-gray-500 mb-1">项目</div>
              <div class="space-y-1 text-gray-700">
                <div>标题：${pTitle}</div>
                <div>作者：${kv['projectAuthor'] || ''}</div>
                <div>创建时间：${kv['projectCreatedAt'] || ''}</div>
                <div>修改时间：${kv['projectUpdatedAt'] || ''}</div>
                <div>梗概：${kv['projectSynopsis'] || ''}</div>
              </div>
            </div>
            <div>
              <div class="text-xs text-gray-500 mb-1">章节</div>
              <div class="space-y-1 text-gray-700">
                <div>序号：${kv['chapterOrder'] || ''}</div>
                <div>标题：${cTitle}</div>
                <div>作者：${kv['chapterAuthor'] || ''}</div>
                <div>创建时间：${kv['chapterCreatedAt'] || ''}</div>
                <div>修改时间：${kv['chapterUpdatedAt'] || ''}</div>
                <div>梗概：${kv['chapterSynopsis'] || ''}</div>
              </div>
            </div>
          </div>
        </div>
      `
      body = body.replace(fmMatch[0], '')
    }
    // 增强的Markdown渲染，更好的写作预览体验
    let html = body
      // 标题 - 添加更好的间距
      .replace(
        /^### (.*$)/gm,
        '<h3 class="text-xl font-semibold text-gray-800 mt-8 mb-4 border-b border-gray-200 pb-2">$1</h3>'
      )
      .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold text-gray-900 mt-10 mb-6">$1</h2>')
      .replace(
        /^# (.*$)/gm,
        '<h1 class="text-3xl font-bold text-gray-900 mt-12 mb-8 border-b-2 border-gray-300 pb-4">$1</h1>'
      )
      // 粗体和斜体
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-gray-700">$1</em>')
      // 列表项
      .replace(/^\* (.*$)/gm, '<li class="mb-2">$1</li>')
      .replace(/^- (.*$)/gm, '<li class="mb-2">$1</li>')
      // 段落分隔
      .replace(/\n\n/g, '</p><p class="mb-6 text-gray-800 leading-relaxed">')
      // 换行
      .replace(/\n/g, '<br>')

    // 包装列表项
    html = html.replace(
      /(<li[^>]*>.*?<\/li>)/gs,
      '<ul class="list-disc ml-6 mb-6 space-y-1">$1</ul>'
    )

    return {
      __html:
        propsHtml +
        `<div class="text-gray-800 leading-relaxed"><p class="mb-6 text-gray-800 leading-relaxed">${html}</p></div>`,
    }
  }

  const insertMarkdown = (before: string, after: string = '') => {
    // 这个功能将由Monaco编辑器内部处理
    console.log('插入Markdown:', before, after)
    // Future improvement: use monacoEditorRef to insert around selection
  }

  const containerClasses = isFullscreen
    ? 'fixed inset-0 z-50 bg-white'
    : 'w-full h-full min-h-[600px]'

  const editorHeight = isFullscreen ? 'calc(100vh - 60px)' : 'calc(100vh - 220px)'

  return (
    <div className={containerClasses}>
      {/* 工具栏 */}
      <div className="border-b bg-gray-50 p-3">
        <div className="flex items-center justify-between">
          {/* 左侧：模式指示器和编辑工具 */}
          <div className="flex items-center space-x-3">
            {/* 模式指示器 */}
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-white border rounded-lg">
              <FileText size={16} className="text-blue-500" />
              <span className="text-sm font-medium text-gray-700">
                {displayMode === 'edit' ? '编辑模式' : '预览模式'}
              </span>
            </div>

            {/* 分隔线 */}
            <div className="h-4 w-px bg-gray-300"></div>

            {/* Markdown 格式化按钮 - 仅编辑模式显示 */}
            {displayMode === 'edit' && (
              <>
                <button
                  onClick={() => insertMarkdown('**', '**')}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
                  title="粗体 (Ctrl+B)"
                >
                  <strong>B</strong>
                </button>
                <button
                  onClick={() => insertMarkdown('*', '*')}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-100 italic"
                  title="斜体 (Ctrl+I)"
                >
                  I
                </button>
                <button
                  onClick={() => insertMarkdown('# ', '')}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
                  title="标题"
                >
                  H1
                </button>
                <button
                  onClick={() => insertMarkdown('## ', '')}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
                  title="二级标题"
                >
                  H2
                </button>
                <button
                  onClick={() => insertMarkdown('* ', '')}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
                  title="列表"
                >
                  列表
                </button>

                <div className="h-4 w-px bg-gray-300"></div>

                <button
                  onClick={toggleTheme}
                  className="flex items-center space-x-1 px-3 py-1 text-sm border rounded hover:bg-gray-100"
                  title="切换主题"
                >
                  <Palette size={16} />
                  <span>主题</span>
                </button>
              </>
            )}
          </div>

          {/* 右侧：状态信息和操作按钮 */}
          <div className="flex items-center space-x-4">
            {/* 保存状态 */}
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              {lastSaved && (
                <span>{isSaving ? '保存中...' : `已保存 ${lastSaved.toLocaleTimeString()}`}</span>
              )}
            </div>

            {/* 操作按钮组 */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleSave()}
                disabled={isSaving}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                <Save size={16} />
                <span>{isSaving ? '保存中' : '保存'}</span>
              </button>

              <button
                onClick={() => setDisplayMode(displayMode === 'edit' ? 'preview' : 'edit')}
                className={`flex items-center space-x-1 px-3 py-1.5 text-sm border rounded transition-colors ${
                  displayMode === 'preview'
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'hover:bg-gray-100'
                }`}
                title="切换预览"
              >
                {displayMode === 'preview' ? <EyeOff size={16} /> : <Eye size={16} />}
                <span>{displayMode === 'preview' ? '返回编辑' : '预览'}</span>
              </button>

              <button
                onClick={toggleFullscreen}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm border rounded hover:bg-gray-100"
                title="全屏"
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 编辑器区域 */}
      <div className="flex flex-1 overflow-hidden">
        {displayMode === 'edit' ? (
          /* 编辑模式 - 全宽编辑器 */
          <div className="w-full">
            <EnhancedMonacoEditor
              ref={monacoEditorRef}
              value={content}
              onChange={handleEditorChange}
              onSave={handleSave}
              theme={editorTheme}
              autoSave={autoSave}
              autoSaveDelay={autoSaveDelay}
              showWordCount={true}
              height={editorHeight}
            />
          </div>
        ) : (
          /* 预览模式 - 全宽预览 */
          <div className="w-full overflow-auto bg-gray-50">
            <div className="max-w-4xl mx-auto p-8 bg-white shadow-sm min-h-full">
              <div className="prose prose-lg prose-gray max-w-none">
                <div
                  dangerouslySetInnerHTML={renderPreview(content)}
                  className="markdown-preview leading-relaxed"
                />
                {!content && (
                  <div className="text-center py-20">
                    <FileText size={48} className="text-gray-300 mx-auto mb-4" />
                    <div className="text-gray-400 text-lg">暂无内容</div>
                    <div className="text-gray-500 text-sm mt-2">点击"返回编辑"开始写作...</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI 助手 - 已迁移至 EnhancedEditorPage 的 SidePanel，此处移除旧版悬浮球 */}
    </div>
  )
})

MarkdownEditor.displayName = 'MarkdownEditor'

export default MarkdownEditor
