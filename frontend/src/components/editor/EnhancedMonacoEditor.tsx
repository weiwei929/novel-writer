import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import Editor, { Monaco } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'

export interface EnhancedMonacoEditorRef {
  insertContent: (text: string) => void
  toggleFrontmatter: () => void
}

interface EnhancedMonacoEditorProps {
  value: string
  onChange: (value: string) => void
  onSave?: (value: string) => void
  height?: string | number
  language?: string
  theme?: string
  fontSize?: number
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
  fontSize = 14,
  autoSave = false,
  autoSaveDelay = 3000,
  readOnly = false,
}, ref) => {
  const [showFrontmatter, setShowFrontmatter] = useState(() => {
    // 从 localStorage 读取用户偏好，默认隐藏
    const saved = localStorage.getItem('showFrontmatter')
    return saved === 'true'
  })
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
    },
    toggleFrontmatter: () => {
      toggleFrontmatterVisibility()
    }
  }))

  const toggleFrontmatterVisibility = () => {
    const editor = editorRef.current
    if (!editor) return

    const model = editor.getModel()
    if (!model) return

    const text = model.getValue()
    const fmMatch = text.match(/^---\n([\s\S]*?)\n---\n/)

    if (fmMatch) {
      const endLine = fmMatch[0].split('\n').length - 1

      // 使用 setHiddenAreas API（需要类型断言）
      const editorWithHiddenAreas = editor as any

      if (!showFrontmatter) {
        // 当前隐藏，要显示
        editorWithHiddenAreas.setHiddenAreas([])
      } else {
        // 当前显示，要隐藏
        editorWithHiddenAreas.setHiddenAreas([{
          startLineNumber: 1,
          endLineNumber: endLine
        }])
      }

      const newState = !showFrontmatter
      setShowFrontmatter(newState)
      localStorage.setItem('showFrontmatter', String(newState))
    }
  }

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

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({ fontSize, lineHeight: Math.round(fontSize * 1.5) })
    }
  }, [fontSize])

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

    editorInstance.updateOptions({ fontSize, lineHeight: Math.round(fontSize * 1.5) })

    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (onSave) {
        onSave(editorInstance.getValue())
      }
    })
  }

  const handleEditorChange = (newValue: string | undefined) => {
    if (newValue !== undefined) {
      onChange(newValue)
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
          fontSize,
          lineHeight: Math.round(fontSize * 1.5),
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
          rulers: [],  // 移除竖线标尺
          selectOnLineNumbers: true,
          matchBrackets: 'never',
          quickSuggestions: false,
          occurrencesHighlight: 'off',
          selectionHighlight: false,
          codeLens: false,
          links: false,
          colorDecorators: false,
          acceptSuggestionOnEnter: 'off',
          padding: { top: 12, bottom: 40 },
          'semanticHighlighting.enabled': false,  // 禁用语义高亮
          unicodeHighlight: {
            ambiguousCharacters: false,  // 禁用模糊字符高亮
            invisibleCharacters: false,  // 禁用不可见字符高亮
            nonBasicASCII: false,  // 禁用非基本ASCII字符高亮
          },
        }}
      />
    </div>
  )
})

EnhancedMonacoEditor.displayName = 'EnhancedMonacoEditor'

export default EnhancedMonacoEditor
