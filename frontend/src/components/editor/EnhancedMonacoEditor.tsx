import React, { useState, useRef, useEffect } from 'react'
import Editor, { Monaco } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'

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

const EnhancedMonacoEditor: React.FC<EnhancedMonacoEditorProps> = ({
  value,
  onChange,
  onSave,
  height = '100%',
  language = 'markdown',
  theme = 'vs',
  autoSave = false,
  autoSaveDelay = 3000,
  showWordCount = true,
  readOnly = false
}) => {
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [readingTime, setReadingTime] = useState(0)
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>()

  const updateStatistics = (text: string) => {
    const chars = text.length
    const words = text.trim().split(/\s+/).filter(word => word.length > 0).length
    const reading = Math.ceil(words / 200)

    setCharCount(chars)
    setWordCount(words)
    setReadingTime(reading)
  }

  useEffect(() => {
    if (autoSave && value && onSave) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        onSave(value)
      }, autoSaveDelay)
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [value, autoSave, autoSaveDelay, onSave])

  const handleEditorDidMount = (editorInstance: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = editorInstance

    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (onSave) {
        onSave(editorInstance.getValue())
      }
    })

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
          acceptSuggestionOnEnter: 'off'
        }}
      />
      
      {showWordCount && (
        <div className="absolute bottom-2 right-2 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded text-sm text-gray-600 dark:text-gray-300">
          <span className="mr-4">字符数: {charCount}</span>
          <span className="mr-4">词数: {wordCount}</span>
          <span>预计阅读: {readingTime}分钟</span>
        </div>
      )}
    </div>
  )
}

export default EnhancedMonacoEditor