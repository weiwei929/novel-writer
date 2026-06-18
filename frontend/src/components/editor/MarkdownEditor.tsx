import { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react'
import EnhancedMonacoEditor, { EnhancedMonacoEditorRef } from './EnhancedMonacoEditor'
import { IconEye, IconEyeOff, IconFile, IconMaximize, IconMinimize, IconPalette } from '../ui/icons'
import { useSettingsStore } from '../../stores/settingsStore'


export interface MarkdownEditorRef {
  insertContent: (text: string) => void
}

/** 编辑器内触发的保存（自动保存 / Ctrl+S），由页面提供吞掉 rejection 的回调 */
export type EditorSaveContext = 'autosave' | 'shortcut'

interface MarkdownEditorProps {
  initialContent?: string
  onEditorSave?: (content: string, context: EditorSaveContext) => void | Promise<void>
  onContentChange?: (content: string) => void
  autoSave?: boolean
  autoSaveDelay?: number
}

const MarkdownEditor = forwardRef<MarkdownEditorRef, MarkdownEditorProps>(({
  initialContent = '',
  onEditorSave,
  onContentChange,
  autoSave: autoSaveProp,
  autoSaveDelay: autoSaveDelayProp,
}, ref) => {
  const editorPrefs = useSettingsStore(s => s.editor)
  const autoSave = autoSaveProp ?? editorPrefs.autoSave
  const autoSaveDelay = autoSaveDelayProp ?? editorPrefs.autoSaveDelay

  const [content, setContent] = useState(initialContent)
  const [displayMode, setDisplayMode] = useState<'edit' | 'preview'>('edit')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [editorTheme, setEditorTheme] = useState<string>(editorPrefs.theme)

  useEffect(() => {
    setEditorTheme(editorPrefs.theme)
  }, [editorPrefs.theme])

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>()
  const onEditorSaveRef = useRef<typeof onEditorSave>()
  const monacoEditorRef = useRef<EnhancedMonacoEditorRef>(null)

  onEditorSaveRef.current = onEditorSave

  const dispatchEditorSave = useCallback((saveContent: string, context: EditorSaveContext) => {
    const save = onEditorSaveRef.current
    if (!save) return
    void Promise.resolve(save(saveContent, context)).catch(err => {
      console.error('onEditorSave leaked rejection:', err)
    })
  }, [])

  useImperativeHandle(ref, () => ({
    insertContent: (text: string) => {
      if (monacoEditorRef.current) {
        monacoEditorRef.current.insertContent(text)
      }
    }
  }))

  useEffect(() => {
    if (initialContent !== content) {
      setContent(initialContent)
    }
  }, [initialContent])

  const handleSave = useCallback(
    (saveContent?: string) => {
      dispatchEditorSave(saveContent ?? content, 'shortcut')
    },
    [dispatchEditorSave, content],
  )

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
            setDisplayMode(m => (m === 'edit' ? 'preview' : 'edit'))
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave])

  useEffect(() => {
    if (!autoSave || content === initialContent) return

    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current)
    }

    autoSaveTimer.current = setTimeout(() => {
      dispatchEditorSave(content, 'autosave')
    }, autoSaveDelay)

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current)
      }
    }
  }, [content, autoSave, autoSaveDelay, initialContent, dispatchEditorSave])

  const handleEditorChange = (newContent: string) => {
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

  const renderPreview = (text: string) => {
    let html = text
      .replace(
        /^### (.*$)/gm,
        '<h3 class="text-xl font-semibold text-gray-800 mt-8 mb-4 border-b border-gray-200 pb-2">$1</h3>'
      )
      .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold text-gray-900 mt-10 mb-6">$1</h2>')
      .replace(
        /^# (.*$)/gm,
        '<h1 class="text-3xl font-bold text-gray-900 mt-12 mb-8 border-b-2 border-gray-300 pb-4">$1</h1>'
      )
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-gray-700">$1</em>')
      .replace(/^\* (.*$)/gm, '<li class="mb-2">$1</li>')
      .replace(/^- (.*$)/gm, '<li class="mb-2">$1</li>')
      .replace(/\n\n/g, '</p><p class="mb-6 text-gray-800 leading-relaxed">')
      .replace(/\n/g, '<br>')

    html = html.replace(
      /(<li[^>]*>.*?<\/li>)/gs,
      '<ul class="list-disc ml-6 mb-6 space-y-1">$1</ul>'
    )

    return {
      __html: `<div class="text-gray-800 leading-relaxed"><p class="mb-6 text-gray-800 leading-relaxed">${html}</p></div>`,
    }
  }

  const insertMarkdown = (before: string, after: string = '') => {
    console.log('插入Markdown:', before, after)
  }

  const containerClasses = isFullscreen
    ? 'fixed inset-0 z-50 bg-white'
    : 'w-full h-full min-h-0 flex flex-col'

  /** 写作页保存由 MarkdownEditor 独占（快捷键 + autosave）；子层 Monaco 不接 onSave/autoSave */
  const editorHeight = isFullscreen ? 'calc(100vh - var(--we-toolbar-height, 36px))' : '100%'

  return (
    <div className={`flex flex-col ${containerClasses}`}>
      <div className="writing-editor-toolbar px-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="we-toolbar-mode flex items-center gap-1 shrink-0">
            <IconFile size={14} aria-hidden />
            {displayMode === 'edit' ? '编辑' : '预览'}
          </span>

          {displayMode === 'edit' && (
            <>
              <div className="h-3 w-px bg-gray-200" />
              <button
                type="button"
                onClick={() => insertMarkdown('**', '**')}
                className="we-toolbar-btn"
                title="粗体 (Ctrl+B)"
              >
                <strong>B</strong>
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown('*', '*')}
                className="we-toolbar-btn italic"
                title="斜体 (Ctrl+I)"
              >
                I
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown('# ', '')}
                className="we-toolbar-btn"
                title="标题"
              >
                H1
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown('## ', '')}
                className="we-toolbar-btn"
                title="二级标题"
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown('* ', '')}
                className="we-toolbar-btn"
                title="列表"
              >
                列表
              </button>
              <button
                type="button"
                onClick={toggleTheme}
                className="we-toolbar-btn flex items-center gap-0.5"
                title="切换主题"
              >
                <IconPalette size={14} />
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setDisplayMode(displayMode === 'edit' ? 'preview' : 'edit')}
            className={`we-toolbar-btn flex items-center gap-0.5 ${
              displayMode === 'preview' ? 'we-toolbar-btn--active' : ''
            }`}
            title="切换预览"
          >
            {displayMode === 'preview' ? <IconEyeOff size={14} /> : <IconEye size={14} />}
            <span>{displayMode === 'preview' ? '编辑' : '预览'}</span>
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="we-toolbar-btn flex items-center"
            title="全屏"
          >
            {isFullscreen ? <IconMinimize size={14} /> : <IconMaximize size={14} />}
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-auto">
        {displayMode === 'edit' ? (
          <div className="w-full h-full min-h-0">
            <EnhancedMonacoEditor
              ref={monacoEditorRef}
              value={content}
              onChange={handleEditorChange}
              theme={editorTheme}
              fontSize={editorPrefs.fontSize}
              showWordCount={true}
              height={editorHeight}
            />
          </div>
        ) : (
          <div className="w-full overflow-auto bg-gray-50">
            <div className="max-w-4xl mx-auto p-8 bg-white shadow-sm min-h-full">
              <div className="prose prose-lg prose-gray max-w-none">
                <div
                  dangerouslySetInnerHTML={renderPreview(content)}
                  className="markdown-preview leading-relaxed"
                />
                {!content && (
                  <div className="text-center py-20">
                    <IconFile size={48} className="text-gray-300 mx-auto mb-4" />
                    <div className="text-gray-400 text-lg">暂无内容</div>
                    <div className="text-gray-500 text-sm mt-2">点击&quot;返回编辑&quot;开始写作...</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

MarkdownEditor.displayName = 'MarkdownEditor'

export default MarkdownEditor
