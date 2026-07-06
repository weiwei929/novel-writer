import type { ExternalRefProcessingType } from '../../services/api'
import type { ScrapProcessingType } from './scrapUtils'

type ProcessingType = ExternalRefProcessingType | ScrapProcessingType

const CONFIG: Record<
  ProcessingType,
  { label: string; short: string; className: string }
> = {
  complete: {
    label: '完整引用',
    short: '完整引用',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  partial: {
    label: '部分引用',
    short: '部分引用',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  none: {
    label: '未处理',
    short: '未处理',
    className: 'bg-gray-100 text-gray-500 border-gray-200',
  },
}

export default function TypeLabel({
  type,
  compact = false,
}: {
  type: ProcessingType
  compact?: boolean
}) {
  const c = CONFIG[type] ?? CONFIG.none
  return (
    <span className={`text-xs px-2 py-0.5 rounded border font-medium ${c.className}`}>
      {compact ? c.short : c.label}
    </span>
  )
}
