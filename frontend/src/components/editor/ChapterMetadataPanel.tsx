import React, { useEffect, useState } from 'react'
import { Chapter, chaptersApi } from '../../services/api'
import MetadataEditor from '../metadata/MetadataEditor'
import { ChevronLeft } from 'lucide-react'

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
  initialMode
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeField, setActiveField] = useState<string>('synopsis')
  const [mode, setMode] = useState<'view' | 'edit' | 'view_all'>(initialMode || 'view')
  const [preview, setPreview] = useState<{ current: string; lastModified?: string; wordCount?: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [previewsAll, setPreviewsAll] = useState<Record<string, { current: string; lastModified?: string; wordCount?: number } | null>>({})

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
      chaptersApi.getMetadata(chapter.id, activeField)
        .then((res) => setPreview({ current: res.current || '', lastModified: res.lastModified, wordCount: res.wordCount }))
        .catch(() => {
          // 后端暂未提供章节元数据接口时的回退：使用章节 summary 作为梗概预览
          if (activeField === 'synopsis' && (chapter as any)?.summary) {
            setPreview({ current: (chapter as any).summary, lastModified: chapter.updatedAt, wordCount: undefined })
          } else {
            setPreview(null)
          }
        })
        .finally(() => setLoading(false))
    }
  }, [chapter?.id, activeField, mode])

  useEffect(() => {
    if (chapter && mode === 'view_all') {
      setLoading(true)
      Promise.all(
        metadataFields.map(async (f) => {
          try {
            const res = await chaptersApi.getMetadata(chapter.id, f.key)
            return { key: f.key, value: { current: res.current || '', lastModified: res.lastModified, wordCount: res.wordCount } }
          } catch {
            return { key: f.key, value: null }
          }
        })
      ).then((arr) => {
        const map: Record<string, { current: string; lastModified?: string; wordCount?: number } | null> = {}
        arr.forEach(({ key, value }) => { map[key] = value })
        setPreviewsAll(map)
      }).finally(() => setLoading(false))
    }
  }, [chapter?.id, mode])

  if (isCollapsed) {
    return (
      <div className={`w-12 border-l bg-gray-50 flex flex-col items-center py-4 ${className}`}>
        <button
          onClick={() => onClose ? onClose() : setIsCollapsed(false)}
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
          onClick={() => onClose ? onClose() : setIsCollapsed(true)}
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
          <div className="text-xs text-gray-500 truncate">第 {chapter.order} 章：{chapter.title}</div>
        </div>
        <div className="flex items-center gap-2">
          <button className={`px-2 py-1 text-xs border rounded ${mode === 'view' ? 'bg-gray-50' : ''}`} onClick={() => setMode('view')}>预览</button>
          <button className={`px-2 py-1 text-xs border rounded ${mode === 'view_all' ? 'bg-gray-50' : ''}`} onClick={() => setMode('view_all')}>预览全部</button>
          <button className={`px-2 py-1 text-xs border rounded ${mode === 'edit' ? 'bg-gray-50' : ''}`} onClick={() => setMode('edit')}>编辑</button>
          <button
            onClick={() => onClose ? onClose() : setIsCollapsed(true)}
            className="p-1.5 hover:bg-gray-100 rounded"
            title="关闭面板"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>


      <div className="border-b bg-white">
        <div className="flex flex-wrap gap-1 p-2">
          {metadataFields.map((field) => (
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
      </div>

      {/* 预览/编辑 */}
      <div className="flex-1 overflow-auto p-3">
        {mode === 'view' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">{metadataFields.find(f => f.key === activeField)?.label}</h3>
              <button className="px-2 py-1 text-sm border rounded hover:bg-gray-50" onClick={() => setMode('edit')}>编辑此字段</button>
            </div>
            {loading ? (
              <div className="text-gray-500 text-sm">加载中...</div>
            ) : (
              <div className="text-sm text-gray-800 whitespace-pre-wrap min-h-[120px] p-3 bg-white border rounded">
                {preview?.current || '暂无内容'}
              </div>
            )}
            <div className="text-xs text-gray-500">
              {preview?.wordCount !== undefined && <span className="mr-3">字数：{preview.wordCount}</span>}
              {preview?.lastModified && <span>更新于：{new Date(preview.lastModified).toLocaleString('zh-CN')}</span>}
            </div>
          </div>
        ) : mode === 'view_all' ? (
          <div className="space-y-4">
            {loading ? (
              <div className="text-gray-500 text-sm">加载中...</div>
            ) : (
              metadataFields.map((f) => (
                <div key={f.key} className="p-3 bg-white border rounded">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">{f.label}{f.required && <span className="text-red-500 ml-1">*</span>}</h4>
                    <button className="px-2 py-1 text-xs border rounded hover:bg-gray-50" onClick={() => { setActiveField(f.key); setMode('edit') }}>编辑</button>
                  </div>
                  <div className="mt-2 text-sm text-gray-800 whitespace-pre-wrap min-h-[80px]">
                    {previewsAll[f.key]?.current || '暂无内容'}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {previewsAll[f.key]?.wordCount !== undefined && <span className="mr-3">字数：{previewsAll[f.key]?.wordCount}</span>}
                    {previewsAll[f.key]?.lastModified && <span>更新于：{new Date(previewsAll[f.key]!.lastModified!).toLocaleString('zh-CN')}</span>}
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
              onSave={(content) => onUpdate?.(activeField, content)}
              className="h-full"
            />
          )
        )}
      </div>

      {/* 底部提示 */}
      <div className="p-4 border-t border-gray-300 bg-white shadow-sm">
        <div className="text-xs text-gray-500 space-y-1">
          <p>💡 <strong>快速保存</strong>: 点击"保存"按钮即时保存当前内容</p>
          <p>📦 <strong>版本管理</strong>: 点击"保存版本"添加版本说明并保存历史记录</p>
          <p>🔄 <strong>版本恢复</strong>: 点击"版本历史"查看并恢复之前的版本</p>
        </div>
      </div>
    </div>
  )
}

export default ChapterMetadataPanel
