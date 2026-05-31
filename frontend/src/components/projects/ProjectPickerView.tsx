import { FolderOpen } from 'lucide-react'
import type { Project } from '../../services/api'
import ProjectStatusBadge from './ProjectStatusBadge'

interface ProjectPickerViewProps {
  title: string
  subtitle?: string
  projects: Project[]
  loading: boolean
  error?: string | null
  emptyText: string
  onOpen: (id: string) => void
}

export default function ProjectPickerView({
  title,
  subtitle,
  projects,
  loading,
  error,
  emptyText,
  onOpen,
}: ProjectPickerViewProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="bg-blue-100 p-2 rounded-lg">
          <FolderOpen size={22} className="text-blue-600" />
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
          <FolderOpen size={48} className="mb-3 opacity-30" />
          <p className="text-sm">{emptyText}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => (
            <button
              key={p.id}
              onClick={() => onOpen(p.id)}
              className="text-left bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm hover:border-blue-200 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-900 truncate">{p.title}</h3>
                <ProjectStatusBadge status={p.status} />
              </div>
              {p.description && (
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{p.description}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
