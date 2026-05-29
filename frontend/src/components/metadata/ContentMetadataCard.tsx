import React, { useState } from 'react'
import { readMetadataFieldValue } from '../../utils/metadataField'

interface ContentMetadataCardProps {
  metadata: Record<string, any> | null | undefined
  className?: string
}

type MetadataField = {
  key: string
  label: string
}

const FIELDS: MetadataField[] = [
  { key: 'synopsis', label: '项目梗概' },
  { key: 'characters', label: '人物设定' },
  { key: 'timeline', label: '时间线' },
  { key: 'settings', label: '世界观/设定' },
  { key: 'relationships', label: '关系网' },
  { key: 'plotStructure', label: '情节结构' },
]

/**
 * 内容元数据只读卡片
 * 在作品详情页右侧栏展示，作者自建、AI 不参与构建。
 */
const ContentMetadataCard: React.FC<ContentMetadataCardProps> = ({
  metadata,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<string>(FIELDS[0].key)
  const activeContent = readMetadataFieldValue(metadata?.[activeTab])

  return (
    <div className={`bg-white rounded-lg border shadow-sm flex flex-col overflow-hidden ${className}`}>
      {/* 标题 */}
      <div className="px-4 py-3 border-b shrink-0">
        <h3 className="text-sm font-semibold text-gray-900">内容元数据</h3>
        <p className="text-xs text-gray-400 mt-0.5">作者自建 · 只读</p>
      </div>

      {/* 标签切换 */}
      <div className="px-3 py-2 border-b shrink-0">
        <div className="flex flex-wrap gap-1">
          {FIELDS.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveTab(f.key)}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                activeTab === f.key
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-500 hover:bg-gray-50 border border-transparent'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 内容展示 */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {activeContent ? (
          <pre className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">
            {activeContent}
          </pre>
        ) : (
          <div className="text-sm text-gray-400 italic py-8 text-center">
            暂无{FIELDS.find((f) => f.key === activeTab)?.label}内容
          </div>
        )}
      </div>

      {/* 底部提示 */}
      <div className="px-4 py-2 border-t bg-gray-50 shrink-0">
        <p className="text-xs text-gray-400">
          内容元数据由作者设定，在编辑器中编辑
        </p>
      </div>
    </div>
  )
}

export default ContentMetadataCard
