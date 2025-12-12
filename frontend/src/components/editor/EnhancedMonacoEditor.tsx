import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import Editor, { Monaco } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'

export interface EnhancedMonacoEditorRef {
  insertContent: (text: string) => void
}

interface EnhancedMonacoEditorProps {
  value: string
  onChange: (value: string) => void
  onSave?: (value: string) => void
  height?: string | number
  language?: string
  theme?: string
  autoSave?: boolean
  autoSaveDelay?: number
  showWordCount?: boolean
  readOnly?: boolean
}

const EnhancedMonacoEditor = forwardRef<EnhancedMonacoEditorRef, EnhancedMonacoEditorProps>(({
  value,
  onChange,
  onSave,
  height = '100%',
  language = 'markdown',
  theme = 'vs',
  autoSave = false,
  autoSaveDelay = 3000,
  showWordCount = true,
  readOnly = false,
}, ref) => {
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [readingTime, setReadingTime] = useState(0)
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const onSaveRef = useRef<typeof onSave>()
  onSaveRef.current = onSave

  useImperativeHandle(ref, () => ({
    insertContent: (text: string) => {
      const editor = editorRef.current
      if (!editor) return

      const selection = editor.getSelection()
      if (!selection) return

      const op = {
        range: selection,
        text: text,
        forceMoveMarkers: true
      }
      editor.executeEdits("ai-insert", [op])
      editor.focus()
      // Trigger change event manually since executeEdits doesn't always trigger model content change event handled by @monaco-editor/react in the same way? 
      // Actually @monaco-editor/react handles onChange via model event. keybinding isn't triggered but model change is.
    }
  }))

  const updateStatistics = (text: string) => {
    // ... existing logic ...
    const chars = text.length
    const words = text
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0).length
    const reading = Math.ceil(words / 200)

    setCharCount(chars)
    setWordCount(words)
    setReadingTime(reading)
  }

  // ... useEffects ...
  // 仅在 value 变化时调度自动保存，使用稳定回调引用避免重复定时
  useEffect(() => {
    if (autoSave && value && onSaveRef.current) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }

      autoSaveTimeoutRef.current = setTimeout(() => {
        if (onSaveRef.current) {
          onSaveRef.current(value)
        }
      }, autoSaveDelay)
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [value, autoSave, autoSaveDelay])

  const handleEditorDidMount = (editorInstance: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    // 定义自定义主题
    monaco.editor.defineTheme('novel-light', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#FFFFFF',
        'editor.foreground': '#000000',
        'editor.lineHighlightBackground': '#F0F0F0',
      },
    })

    monaco.editor.defineTheme('novel-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1E1E1E',
        'editor.foreground': '#D4D4D4',
        'editor.lineHighlightBackground': '#2D2D2D',
      },
    })

    monaco.editor.defineTheme('novel-sepia', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#FBF0D9',
        'editor.foreground': '#5C3D2E',
        'editor.lineHighlightBackground': '#F0E4C9',
      },
    })

    editorRef.current = editorInstance

    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (onSave) {
        onSave(editorInstance.getValue())
      }
    })
    
    // Initial stats
    updateStatistics(value)
  }

  const handleEditorChange = (newValue: string | undefined) => {
    if (newValue !== undefined) {
      onChange(newValue)
      updateStatistics(newValue)
    }
  }

  return (
    <div className="relative h-full">
      <Editor
        height={height}
        language={language}
        theme={theme}
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        loading={<div className="flex items-center justify-center h-full">加载编辑器中...</div>}
        options={{
          readOnly,
          wordWrap: 'on',
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          lineHeight: 24,
          fontFamily: '"PingFang SC", "Microsoft YaHei", "Segoe UI", Tahoma, Arial, sans-serif',
          automaticLayout: true,
          lineNumbers: 'on',
          glyphMargin: false,
          folding: true,
          renderLineHighlight: 'all',
          cursorBlinking: 'smooth',
          renderWhitespace: 'selection',
          smoothScrolling: true,
          mouseWheelZoom: true,
          contextmenu: true,
          rulers: [80, 100],
          selectOnLineNumbers: true,
          matchBrackets: 'never',
          quickSuggestions: false,
          occurrencesHighlight: 'off',
          selectionHighlight: false,
          codeLens: false,
          links: false,
          colorDecorators: false,
          acceptSuggestionOnEnter: 'off',
        }}
      />

      {showWordCount && (
        <div className="absolute bottom-2 right-2 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded text-sm text-gray-600 dark:text-gray-300 pointer-events-none opacity-80 z-10 block">
          <span className="mr-4">字符数: {charCount}</span>
          <span className="mr-4">词数: {wordCount}</span>
          <span>预计阅读: {readingTime}分钟</span>
        </div>
      )}
    </div>
  )
})

EnhancedMonacoEditor.displayName = 'EnhancedMonacoEditor'

export default EnhancedMonacoEditor
