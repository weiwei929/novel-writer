import React, { useState } from 'react'
import { Chapter } from '../../services/api'
import MetadataEditor from '../metadata/MetadataEditor'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ChapterMetadataPanelProps {
  chapter: Chapter | null
  onUpdate?: (field: string, value: string) => void
  className?: string
}

const ChapterMetadataPanel: React.FC<ChapterMetadataPanelProps> = ({
  chapter,
  onUpdate,
  className = ''
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeField, setActiveField] = useState<string>('synopsis')

  // 章节元数据字段定义 (根据PLAN第119-127行)
  const metadataFields = [
    { key: 'synopsis', label: '章节梗概', required: true },
    { key: 'characters', label: '涉及人物', required: true },
    { key: 'timeSetting', label: '时间设定', required: true },
    { key: 'sceneSettings', label: '场景设定', required: true },
  ]

  if (isCollapsed) {
    return (
      <div className={`w-12 border-l bg-gray-50 flex flex-col items-center py-4 ${className}`}>
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 hover:bg-gray-200 rounded"
          title="展开元数据面板"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>
    )
  }

  if (!chapter) {
    return (
      <div className={`w-80 border-l bg-gray-50 flex flex-col ${className}`}>
        <div className="flex items-center justify-between p-3 border-b bg-white">
          <h2 className="font-semibold text-gray-900">章节元数据</h2>
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 hover:bg-gray-100 rounded"
            title="收起面板"
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
    <div className={`w-80 border-l bg-gray-50 flex flex-col ${className}`}>
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between p-3 border-b bg-white">
        <h2 className="font-semibold text-gray-900">章节元数据</h2>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1.5 hover:bg-gray-100 rounded"
          title="收起面板"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* 当前章节信息 */}
      <div className="p-3 border-b bg-white">
        <div className="text-xs text-gray-500 mb-1">第 {chapter.order} 章</div>
        <h3 className="font-medium text-gray-900 truncate">{chapter.title}</h3>
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
          <span>{chapter.wordCount.toLocaleString()} 字</span>
          <span>更新于 {new Date(chapter.updatedAt).toLocaleDateString('zh-CN')}</span>
        </div>
      </div>

      {/* 元数据字段导航 */}
      <div className="border-b bg-white">
        <div className="flex flex-col">
          {metadataFields.map((field) => (
            <button
              key={field.key}
              onClick={() => setActiveField(field.key)}
              className={`flex items-center justify-between px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                activeField === field.key ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500' : 'text-gray-700'
              }`}
            >
              <span className="font-medium">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      {/* 元数据编辑器 */}
      <div className="flex-1 overflow-hidden">
        {metadataFields.find(f => f.key === activeField) && (
          <MetadataEditor
            type="chapter"
            entityId={chapter.id}
            field={activeField}
            required={metadataFields.find(f => f.key === activeField)?.required}
            onSave={(content) => onUpdate?.(activeField, content)}
            className="h-full"
          />
        )}
      </div>

      {/* 底部提示 */}
      <div className="p-3 border-t bg-white">
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
