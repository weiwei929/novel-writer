import React, { useMemo, useState } from 'react'
import { readMetadataFieldValue } from '../../utils/metadataField'
import {
  getWorkSetting,
  hasAnyWorkSettingContent,
  WORK_SETTING_BLOCKS,
} from '../../services/workSetting'
import { IconSettings } from '../ui/icons'

interface ContentMetadataCardProps {
  metadata: Record<string, unknown> | null | undefined
  className?: string
  /** 提供时在右上角显示编辑按钮 */
  onEdit?: () => void
}

type MetadataField = {
  key: string
  label: string
}

const LEGACY_FIELDS: MetadataField[] = [
  { key: 'synopsis', label: '作品梗概' },
  { key: 'characters', label: '人物设定' },
  { key: 'timeline', label: '时间线' },
  { key: 'settings', label: '背景设定' },
  { key: 'relationships', label: '关系网' },
  { key: 'plotStructure', label: '情节结构' },
]

/**
 * 内容元数据只读卡片
 * 优先展示 616-B workSetting 四块；否则 fallback legacy 六字段（只读兼容）。
 */
const ContentMetadataCard: React.FC<ContentMetadataCardProps> = ({
  metadata,
  className = '',
  onEdit,
}) => {
  const workSetting = useMemo(() => getWorkSetting(metadata), [metadata])
  const useWorkSettingView = hasAnyWorkSettingContent(workSetting)

  const fields: MetadataField[] = useWorkSettingView
    ? WORK_SETTING_BLOCKS.map(b => ({ key: b.key, label: b.label }))
    : LEGACY_FIELDS

  const [activeTab, setActiveTab] = useState<string>(fields[0]?.key ?? '')

  const activeContent = useWorkSettingView
    ? workSetting[activeTab as keyof typeof workSetting] ?? ''
    : readMetadataFieldValue(metadata?.[activeTab])

  if (fields.length === 0) {
    return null
  }

  return (
    <div className={`bg-white rounded-lg border shadow-sm flex flex-col overflow-hidden ${className}`}>
      <div className="px-4 py-3 border-b shrink-0 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">作品设定</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {useWorkSettingView ? '616-B 描述式设定' : onEdit ? '' : '只读参考'}
            {!useWorkSettingView && !onEdit && ' · legacy 字段'}
          </p>
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="编辑作品设定"
          >
            <IconSettings size={13} />
            编辑
          </button>
        )}
      </div>

      <div className="px-3 py-2 border-b shrink-0">
        <div className="flex flex-wrap gap-1">
          {fields.map(f => (
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

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {activeContent ? (
          <pre className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">
            {activeContent}
          </pre>
        ) : (
          <div className="text-sm text-gray-400 italic py-8 text-center">
            暂无{fields.find(f => f.key === activeTab)?.label}内容
          </div>
        )}
      </div>

      <div className="px-4 py-2 border-t bg-gray-50 shrink-0">
        <p className="text-xs text-gray-400">
          {onEdit ? '点击右上角编辑按钮进行编辑' : '在作品详情页编辑作品设定'}
        </p>
      </div>
    </div>
  )
}

export default ContentMetadataCard
