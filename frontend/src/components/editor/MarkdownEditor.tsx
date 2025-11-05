import React, { useState, useEffect, useRef } from 'react'
import { Save, Eye, EyeOff, Maximize2, Minimize2, FileText, Palette } from 'lucide-react'
import EnhancedMonacoEditor from './EnhancedMonacoEditor'
import AIAssistant from './AIAssistant'

interface MarkdownEditorProps {
  initialContent?: string
  onSave?: (content: string) => void
  onContentChange?: (content: string) => void
  autoSave?: boolean
  autoSaveDelay?: number
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  initialContent = '',
  onSave,
  onContentChange,
  autoSave = true,
  autoSaveDelay = 2000
}) => {
  const [content, setContent] = useState(initialContent)
  const [showPreview, setShowPreview] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [editorTheme, setEditorTheme] = useState<string>('novel-light')
  
  const autoSaveTimer = useRef<NodeJS.Timeout>()

  // 更新内容
  useEffect(() => {
    if (initialContent !== content) {
      setContent(initialContent)
    }
  }, [initialContent])

  // 自动保存
  useEffect(() => {
    if (!autoSave || !onSave || content === initialContent) return

    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current)
    }

    autoSaveTimer.current = setTimeout(() => {
      handleSave()
    }, autoSaveDelay)

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current)
      }
    }
  }, [content, autoSave, autoSaveDelay, onSave, initialContent])

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

  const handleSuggestionAccept = (suggestion: string) => {
    const newContent = content + '\n\n' + suggestion
    setContent(newContent)
    onContentChange?.(newContent)
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
    // 简单的Markdown渲染，后续可以替换为更强大的库
    let html = text
      // 标题
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      // 粗体和斜体
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // 段落
      .replace(/\n\n/g, '</p><p>')
      // 换行
      .replace(/\n/g, '<br>')

    return { __html: `<p>${html}</p>` }
  }

  const insertMarkdown = (before: string, after: string = '') => {
    // 这个功能将由Monaco编辑器内部处理
    console.log('插入Markdown:', before, after)
  }

  const containerClasses = isFullscreen 
    ? 'fixed inset-0 z-50 bg-white' 
    : 'w-full h-full min-h-[600px]'

  return (
    <div className={containerClasses}>
      {/* 工具栏 */}
      <div className="border-b bg-gray-50 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Markdown 格式化按钮 */}
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
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <FileText size={16} />
              {lastSaved && (
                <span>
                  {isSaving ? '保存中...' : `已保存 ${lastSaved.toLocaleTimeString()}`}
                </span>
              )}
            </div>

            <button
              onClick={() => handleSave()}
              disabled={isSaving}
              className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              <Save size={16} />
              <span>{isSaving ? '保存中' : '保存'}</span>
            </button>

            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center space-x-1 px-3 py-1 text-sm border rounded hover:bg-gray-100"
              title="切换预览"
            >
              {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
              <span>{showPreview ? '隐藏预览' : '显示预览'}</span>
            </button>

            <button
              onClick={toggleFullscreen}
              className="flex items-center space-x-1 px-3 py-1 text-sm border rounded hover:bg-gray-100"
              title="全屏"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* 编辑器区域 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 编辑器 */}
        <div className={showPreview ? 'w-1/2 border-r' : 'w-full'}>
          <EnhancedMonacoEditor
            value={content}
            onChange={handleEditorChange}
            onSave={handleSave}
            theme={editorTheme}
            autoSave={autoSave}
            autoSaveDelay={autoSaveDelay}
            showWordCount={!showPreview}
          />
        </div>

        {/* 预览区域 */}
        {showPreview && (
          <div className="w-1/2 overflow-auto bg-white">
            <div className="p-6 prose prose-lg max-w-none">
              <div
                dangerouslySetInnerHTML={renderPreview(content)}
                className="markdown-preview"
              />
              {!content && (
                <div className="text-gray-500 italic">
                  在左侧编辑器中输入 Markdown 内容，这里会显示预览...
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* AI 助手 - 始终渲染，内部会检查设置 */}
      <AIAssistant
        currentContent={content}
        onSuggestionAccept={handleSuggestionAccept}
      />
    </div>
  )
}

export default MarkdownEditor