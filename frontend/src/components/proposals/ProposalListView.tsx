import { IconFile, IconPlus } from '../ui/icons'
import type { Proposal } from '../../services/api'
import ProposalStatusBadge from './ProposalStatusBadge'

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
  } catch {
    return ''
  }
}

interface ProposalListViewProps {
  title: string
  subtitle?: string
  proposals: Proposal[]
  loading: boolean
  error?: string | null
  emptyText: string
  onOpen: (id: string) => void
  onCreate?: () => void
  createLabel?: string
}

export default function ProposalListView({
  title,
  subtitle,
  proposals,
  loading,
  error,
  emptyText,
  onOpen,
  onCreate,
  createLabel = '新建企划建议书',
}: ProposalListViewProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <IconFile size={22} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{subtitle ?? `${proposals.length} 份`}</p>
          </div>
        </div>
        {onCreate && (
          <button
            onClick={onCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors text-sm shadow-sm"
          >
            <IconPlus size={18} />
            {createLabel}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            <span className="text-sm">加载中...</span>
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-red-400">
          <IconFile size={48} className="mb-3 opacity-30" />
          <p className="text-sm text-red-500">{error}</p>
        </div>
      ) : proposals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <IconFile size={48} className="mb-3 opacity-30" />
          <p className="text-sm">{emptyText}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {proposals.map(p => (
            <button
              key={p.id}
              onClick={() => onOpen(p.id)}
              className="text-left bg-white border border-gray-200 rounded-xl p-4 flex flex-col hover:shadow-sm hover:border-blue-200 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-900 truncate">{p.title}</h3>
                <ProposalStatusBadge status={p.status} />
              </div>
              <p className="text-sm text-gray-500 mt-2 flex-1 line-clamp-3">
                {p.synopsis || '（暂无梗概）'}
              </p>
              <span className="text-xs text-gray-400 mt-3">{formatDate(p.updatedAt)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
