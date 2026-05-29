/**
 * @deprecated 章节级内容元数据已废弃（2026-05-29）
 * 内容元数据统一在作品级管理，章节仅保留 summary（梗概叙事文本）。
 * 该组件当前为死代码（无触发入口），保留仅供参考，后续可安全删除。
 */
import React, { useEffect, useState } from 'react'
import { Chapter, chaptersApi } from '../../services/api'
import MetadataEditor from '../metadata/MetadataEditor'
import { ChevronLeft, Bot } from 'lucide-react'
import { AIMetadataAssistant } from '../ai/AIMetadataAssistant'

interface ChapterMetadataPanelProps {
  chapter: Chapter | null
  onUpdate?: (field: string, value: string) => void
  onClose?: () => void
  className?: string
  initialMode?: 'view' | 'edit' | 'view_all'
}

const ChapterMetadataPanel: React.FC<ChapterMetadataPanelProps> = ({
  chapter,
  onUpdate,
  onClose,
  className = '',
  initialMode,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeField, setActiveField] = useState<string>('synopsis')
  const [mode, setMode] = useState<'view' | 'edit' | 'view_all'>(initialMode || 'view')
  const [preview, setPreview] = useState<{
    current: string
    lastModified?: string
    wordCount?: number
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [previewsAll, setPreviewsAll] = useState<
    Record<string, { current: string; lastModified?: string; wordCount?: number } | null>
  >({})
  
  // AI 元数据助手状态
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const [aiAssistantField, setAiAssistantField] = useState<string>('')
  const [aiExistingContent, setAiExistingContent] = useState<string>('')  // AI 助手的现有内容

  // 章节元数据字段定义 (根据PLAN第119-127行)
  const metadataFields = [
    { key: 'synopsis', label: '章节梗概', required: true },
    { key: 'characters', label: '涉及人物', required: true },
    { key: 'timeSetting', label: '时间设定', required: true },
    { key: 'sceneSettings', label: '场景设定', required: true },
  ]

  useEffect(() => {
    if (chapter && mode === 'view' && activeField) {
      setLoading(true)
      chaptersApi
        .getById(chapter.id)
        .then(res => {
          const metadata = res.metadata || {}
          // 特殊处理 synopsis，优先使用 summary 字段
          const content = activeField === 'synopsis' 
            ? (res.summary || metadata[activeField] || '')
            : (metadata[activeField] || '')
          setPreview({
            current: content,
            lastModified: res.updatedAt,
            wordCount: undefined,
          })
        })
        .catch(() => setPreview(null))
        .finally(() => setLoading(false))
    }
  }, [chapter?.id, activeField, mode])

  useEffect(() => {
    if (chapter && mode === 'view_all') {
      setLoading(true)
      chaptersApi
        .getById(chapter.id)
        .then(res => {
          const metadata = res.metadata || {}
          const map: Record<
            string,
            { current: string; lastModified?: string; wordCount?: number } | null
          > = {}
          metadataFields.forEach(f => {
            const content = f.key === 'synopsis'
              ? (res.summary || metadata[f.key] || '')
              : (metadata[f.key] || '')
            map[f.key] = {
              current: content,
              lastModified: res.updatedAt,
              wordCount: undefined,
            }
          })
          setPreviewsAll(map)
        })
        .catch(() => setPreviewsAll({}))
        .finally(() => setLoading(false))
    }
  }, [chapter?.id, mode])

  if (isCollapsed) {
    return (
      <div className={`w-12 border-l bg-gray-50 flex flex-col items-center py-4 ${className}`}>
        <button
          onClick={() => (onClose ? onClose() : setIsCollapsed(false))}
          className="p-2 hover:bg-gray-200 rounded"
          title="关闭元数据面板"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>
    )
  }

  if (!chapter) {
    return (
      <div className={`w-80 bg-gray-100 flex flex-col ${className}`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-300 bg-white shadow-sm">
          <h2 className="font-semibold text-gray-900">章节元数据</h2>
          <button
            onClick={() => (onClose ? onClose() : setIsCollapsed(true))}
            className="p-1.5 hover:bg-gray-100 rounded"
            title="关闭面板"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          请选择一个章节
        </div>
      </div>
    )
  }

  return (
    <div className={`w-80 bg-gray-100 flex flex-col ${className}`}>
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-300 bg-white shadow-sm">
        <div className="min-w-0">
          <h2 className="font-semibold text-gray-900">章节元数据</h2>
          <div className="text-xs text-gray-500 truncate">
            第 {chapter.order} 章：{chapter.title}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className={`px-2 py-1 text-xs border rounded ${mode === 'view' ? 'bg-gray-50' : ''}`}
            onClick={() => setMode('view')}
          >
            预览
          </button>
          <button
            className={`px-2 py-1 text-xs border rounded ${mode === 'view_all' ? 'bg-gray-50' : ''}`}
            onClick={() => setMode('view_all')}
          >
            预览全部
          </button>
          <button
            className={`px-2 py-1 text-xs border rounded ${mode === 'edit' ? 'bg-gray-50' : ''}`}
            onClick={() => setMode('edit')}
          >
            编辑
          </button>
          <button
            onClick={() => (onClose ? onClose() : setIsCollapsed(true))}
            className="p-1.5 hover:bg-gray-100 rounded"
            title="关闭面板"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="border-b bg-white">
        <div className="flex flex-wrap gap-1 p-2">
          {metadataFields.map(field => (
            <button
              key={field.key}
              onClick={() => setActiveField(field.key)}
              className={`px-2.5 py-1 text-sm rounded border transition-colors ${
                activeField === field.key
                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'
              }`}
            >
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </button>
          ))}
        </div>
        
        {/* AI 辅助按钮 - 在编辑模式显示 */}
        {mode === 'edit' && (
          <div className="px-2 pb-2">
            <button
              onClick={async () => {
                setAiAssistantField(activeField)
                // 获取现有内容
                if (chapter) {
                  try {
                    const res = await chaptersApi.getById(chapter.id)
                    const metadata = res.metadata || {}
                    // 特殊处理 synopsis，优先使用 summary 字段
                    const content = activeField === 'synopsis'
                      ? (res.summary || metadata[activeField] || '')
                      : (metadata[activeField] || '')
                    console.log('🔍 [ChapterMetadataPanel] Loading existing content:', {
                      activeField,
                      summary: res.summary,
                      metadataField: metadata[activeField],
                      finalContent: content,
                      contentLength: content.length
                    })
                    setAiExistingContent(content)
                  } catch (error) {
                    console.error('Failed to load existing content:', error)
                    setAiExistingContent('')
                  }
                }
                setShowAIAssistant(true)
              }}
              className="w-full px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all flex items-center justify-center gap-2 text-sm font-medium"
            >
              <Bot size={16} />
              AI 辅助构建/修改"{metadataFields.find(f => f.key === activeField)?.label}"
            </button>
          </div>
        )}
      </div>

      {/* 预览/编辑 */}
      <div className="flex-1 overflow-auto p-3">
        {mode === 'view' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">
                {metadataFields.find(f => f.key === activeField)?.label}
              </h3>
              <button
                className="px-2 py-1 text-sm border rounded hover:bg-gray-50"
                onClick={() => setMode('edit')}
              >
                编辑此字段
              </button>
            </div>
            {loading ? (
              <div className="text-gray-500 text-sm">加载中...</div>
            ) : (
              <div className="text-sm text-gray-800 whitespace-pre-wrap min-h-[120px] p-3 bg-white border rounded">
                {preview?.current || '暂无内容'}
              </div>
            )}
            <div className="text-xs text-gray-500">
              {preview?.wordCount !== undefined && (
                <span className="mr-3">字数：{preview.wordCount}</span>
              )}
              {preview?.lastModified && (
                <span>更新于：{new Date(preview.lastModified).toLocaleString('zh-CN')}</span>
              )}
            </div>
          </div>
        ) : mode === 'view_all' ? (
          <div className="space-y-4">
            {loading ? (
              <div className="text-gray-500 text-sm">加载中...</div>
            ) : (
              metadataFields.map(f => (
                <div key={f.key} className="p-3 bg-white border rounded">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">
                      {f.label}
                      {f.required && <span className="text-red-500 ml-1">*</span>}
                    </h4>
                    <button
                      className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
                      onClick={() => {
                        setActiveField(f.key)
                        setMode('edit')
                      }}
                    >
                      编辑
                    </button>
                  </div>
                  <div className="mt-2 text-sm text-gray-800 whitespace-pre-wrap min-h-[80px]">
                    {previewsAll[f.key]?.current || '暂无内容'}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {previewsAll[f.key]?.wordCount !== undefined && (
                      <span className="mr-3">字数：{previewsAll[f.key]?.wordCount}</span>
                    )}
                    {previewsAll[f.key]?.lastModified && (
                      <span>
                        更新于：
                        {new Date(previewsAll[f.key]!.lastModified!).toLocaleString('zh-CN')}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          metadataFields.find(f => f.key === activeField) && (
            <MetadataEditor
              type="chapter"
              entityId={chapter.id}
              field={activeField}
              required={metadataFields.find(f => f.key === activeField)?.required}
              onSave={content => onUpdate?.(activeField, content)}
              className="h-full"
            />
          )
        )}
      </div>

      {/* 底部提示 */}
      <div className="p-4 border-t border-gray-300 bg-white shadow-sm">
        <div className="text-xs text-gray-500">
          <p>💡 点击"保存"按钮即时保存当前内容</p>
          <p>🤖 点击"AI 辅助"按钮，让 AI 帮助你构建元数据</p>
        </div>
      </div>
      
      {/* AI 元数据助手 */}
      {chapter && (
        <AIMetadataAssistant
          isOpen={showAIAssistant}
          onClose={() => setShowAIAssistant(false)}
          type="chapter"
          entityId={chapter.id}
          field={aiAssistantField}
          fieldLabel={metadataFields.find(f => f.key === aiAssistantField)?.label || ''}
          existingContent={aiExistingContent}  // 传递现有内容
          onSave={async (content) => {
            // 保存元数据
            await chaptersApi.updateMetadata(chapter.id, aiAssistantField, content)
            // 刷新预览
            if (mode === 'view' && activeField === aiAssistantField) {
              const res = await chaptersApi.getById(chapter.id)
              const metadata = res.metadata || {}
              const updatedContent = aiAssistantField === 'synopsis'
                ? (res.summary || metadata[aiAssistantField] || '')
                : (metadata[aiAssistantField] || '')
              setPreview({
                current: updatedContent,
                lastModified: res.updatedAt,
                wordCount: undefined,
              })
            }
          }}
        />
      )}
    </div>
  )
}

export default ChapterMetadataPanel
