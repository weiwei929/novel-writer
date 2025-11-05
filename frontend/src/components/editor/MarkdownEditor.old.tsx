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

  // 计算字数
  useEffect(() => {
    const words = content.replace(/[^\u4e00-\u9fa5\w]/g, ' ').split(/\s+/).filter(word => word.length > 0)
    setWordCount(words.length)
  }, [content])

  // 自动保存
  useEffect(() => {
    if (!autoSave || !onSave) return

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
  }, [content, autoSave, autoSaveDelay])

  const handleEditorChange = (value: string | undefined) => {
    const newContent = value || ''
    setContent(newContent)
    onContentChange?.(newContent)
  }

  const handleSave = async () => {
    if (!onSave) return

    setIsSaving(true)
    try {
      await onSave(content)
      setLastSaved(new Date())
    } catch (error) {
      console.error('保存失败:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditorMount = (editor: any) => {
    editorRef.current = editor
    
    // 添加快捷键
    editor.addCommand(editor.KeyMod.CtrlCmd | editor.KeyCode.KeyS, () => {
      handleSave()
    })
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const insertMarkdown = (before: string, after: string = '') => {
    if (!editorRef.current) return

    const editor = editorRef.current
    const selection = editor.getSelection()
    const selectedText = editor.getModel()?.getValueInRange(selection) || ''
    
    const newText = before + selectedText + after
    editor.executeEdits('', [{
      range: selection,
      text: newText
    }])

    // 设置新的选择区域
    const newSelection = {
      startLineNumber: selection.startLineNumber,
      startColumn: selection.startColumn + before.length,
      endLineNumber: selection.endLineNumber,
      endColumn: selection.endColumn + before.length
    }
    editor.setSelection(newSelection)
    editor.focus()
  }

  const renderPreview = (markdown: string) => {
    // 简单的 Markdown 转换（实际项目中建议使用 marked 或 markdown-it）
    let html = markdown
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^\* (.*$)/gim, '<li>$1</li>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>')

    // 包装 li 标签
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')

    return { __html: html }
  }

  const handleSuggestionAccept = (suggestion: string) => {
    if (!editorRef.current) return

    const editor = editorRef.current
    const position = editor.getPosition()
    
    // 在当前光标位置插入建议内容
    editor.executeEdits('', [{
      range: {
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber: position.lineNumber,
        endColumn: position.column
      },
      text: '\n\n' + suggestion
    }])

    // 移动光标到插入内容的末尾
    const lines = suggestion.split('\n')
    const newPosition = {
      lineNumber: position.lineNumber + lines.length + 1,
      column: lines[lines.length - 1].length + 1
    }
    editor.setPosition(newPosition)
    editor.focus()
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
              •
            </button>
            <button
              onClick={() => insertMarkdown('`', '`')}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-100 font-mono"
              title="代码"
            >
              &lt;/&gt;
            </button>
          </div>

          <div className="flex items-center space-x-3">
            {/* 状态信息 */}
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center space-x-1">
                <FileText size={16} />
                <span>{wordCount} 字</span>
              </span>
              {lastSaved && (
                <span>
                  上次保存: {lastSaved.toLocaleTimeString()}
                </span>
              )}
              {isSaving && (
                <span className="text-blue-600">保存中...</span>
              )}
            </div>

            {/* 控制按钮 */}
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center space-x-1 px-3 py-1 text-sm border rounded hover:bg-gray-100"
              title="切换预览"
            >
              {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
              <span>{showPreview ? '隐藏预览' : '显示预览'}</span>
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              <Save size={16} />
              <span>保存</span>
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
          <Editor
            height="100%"
            defaultLanguage="markdown"
            value={content}
            onChange={handleEditorChange}
            onMount={handleEditorMount}
            theme="vs-light"
            options={{
              fontSize: 14,
              lineHeight: 1.6,
              wordWrap: 'on',
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              renderWhitespace: 'selection',
              folding: true,
              lineNumbers: 'on',
              glyphMargin: false,
              lineDecorationsWidth: 0,
              lineNumbersMinChars: 3,
            }}
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