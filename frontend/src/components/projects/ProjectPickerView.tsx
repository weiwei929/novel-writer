import { IconFolder } from '../ui/icons'
import type { Project } from '../../services/api'
import type { PhaseContext } from '../../services/statusLabels'
import ProjectStatusBadge from './ProjectStatusBadge'

export type PlanningAction = 'confirm-planning' | 'back-to-planning' | 'soft-delete' | 'release-to-studio'

const ACTION_LABELS: Record<PlanningAction, string> = {
  'confirm-planning': '确认企划完成',
  'back-to-planning': '退回企划中',
  'soft-delete': '放入文件暂存',
  'release-to-studio': '提交创作室',
}

function getActionsForStatus(status: string): PlanningAction[] {
  switch (status) {
    case 'planning':
      return ['confirm-planning', 'soft-delete']
    case 'planned':
      return ['release-to-studio', 'back-to-planning', 'soft-delete']
    default:
      return []
  }
}

interface ProjectPickerViewProps {
  title: string
  subtitle?: string
  projects: Project[]
  loading: boolean
  error?: string | null
  emptyText: string
  onOpen: (id: string) => void
  onAction?: (id: string, action: PlanningAction) => void
  phase?: PhaseContext
  compact?: boolean
}

export default function ProjectPickerView({
  title,
  subtitle,
  projects,
  loading,
  error,
  emptyText,
  onOpen,
  onAction,
  phase,
  compact,
}: ProjectPickerViewProps) {
  if (compact) {
    return (
      <section className="space-y-3 min-w-0">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500">{subtitle}</p>
        {projects.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">{emptyText}</p>
        ) : (
          <div className="space-y-3">
            {projects.map(p => {
              const actions = onAction ? getActionsForStatus(p.status) : []
              return (
                <div key={p.id} className="bg-white border rounded-xl p-4 hover:border-blue-200 transition-all min-w-0">
                  <button type="button" onClick={() => onOpen(p.id)} className="text-left w-full min-w-0">
                    <div className="flex items-start justify-between gap-2 min-w-0">
                      <h3 className="font-semibold text-sm truncate min-w-0 flex-1">{p.title}</h3>
                      <ProjectStatusBadge status={p.status} phase={phase} />
                    </div>
                  </button>
                  {actions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100">
                      {actions.map(action => (
                        <button key={action} type="button" onClick={e => { e.stopPropagation(); onAction?.(p.id, action) }}
                          className={`text-xs px-2 py-1 rounded transition-colors ${
                            action === 'confirm-planning' ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : action === 'soft-delete' ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                            : action === 'release-to-studio' ? 'border border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                            : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >{ACTION_LABELS[action]}</button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="bg-blue-100 p-2 rounded-lg">
          <IconFolder size={22} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{subtitle ?? `${projects.length} 部作品`}</p>
        </div>
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
          <p className="text-sm text-red-500">{error}</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <IconFolder size={48} className="mb-3 opacity-30" />
          <p className="text-sm">{emptyText}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => {
            const actions = onAction ? getActionsForStatus(p.status) : []
            return (
              <div
                key={p.id}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm hover:border-blue-200 transition-all"
              >
                <button
                  type="button"
                  onClick={() => onOpen(p.id)}
                  className="text-left w-full"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">{p.title}</h3>
                    <ProjectStatusBadge status={p.status} phase={phase} />
                  </div>
                  {p.description && (
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">{p.description}</p>
                  )}
                  <div className="text-xs text-gray-400 mt-2">
                    {p.wordCount.toLocaleString()} 字
                    {p.chapterCount != null && ` · ${p.chapterCount} 章`}
                  </div>
                </button>
                {actions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100">
                    {actions.map(action => (
                      <button
                        key={action}
                        type="button"
                        onClick={e => { e.stopPropagation(); onAction?.(p.id, action) }}
                        className={`text-xs px-2 py-1 rounded transition-colors ${
                          action === 'confirm-planning'
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : action === 'soft-delete'
                              ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                              : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {ACTION_LABELS[action]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export { getActionsForStatus }
