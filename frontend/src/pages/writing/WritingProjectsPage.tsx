import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectsApi, type Project } from '../../services/api'
import { useUIStore } from '../../stores/uiStore'
import ProjectStatusBadge from '../../components/projects/ProjectStatusBadge'
import { IconFolder } from '../../components/ui/icons'

interface StudioSectionProps {
  title: string
  subtitle: string
  projects: Project[]
  emptyText: string
  onOpen: (id: string) => void
}

function StudioSection({ title, subtitle, projects, emptyText, onOpen }: StudioSectionProps) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
      {projects.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
          {emptyText}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => onOpen(p.id)}
              className="text-left bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm hover:border-blue-200 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-900 truncate">{p.title}</h3>
                <ProjectStatusBadge status={p.status} phase="studio" />
              </div>
              {p.description && (
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{p.description}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

export default function WritingProjectsPage() {
  const navigate = useNavigate()
  const { addNotification } = useUIStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setProjects(await projectsApi.getAll())
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '无法加载作品列表'
      setError(message)
      addNotification({ type: 'error', title: '加载失败', message })
    } finally {
      setLoading(false)
    }
  }, [addNotification])

  useEffect(() => {
    void load()
  }, [load])

  const planned = useMemo(() => projects.filter(p => p.status === 'planned'), [projects])
  const writing = useMemo(() => projects.filter(p => p.status === 'writing'), [projects])
  const written = useMemo(() => projects.filter(p => p.status === 'written'), [projects])

  const openWork = (id: string) => navigate(`/work/${id}?from=writing`)

  const total = planned.length + writing.length + written.length

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="bg-blue-100 p-2 rounded-lg">
          <IconFolder size={22} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">创作室</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} 部作品（待创作 / 创作中 / 已完成）</p>
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
      ) : (
        <div className="space-y-10">
          <StudioSection
            title="待创作"
            subtitle={`${planned.length} 部待创作作品`}
            projects={planned}
            emptyText="暂无待创作作品。企划课确认企划完成后将出现在此。"
            onOpen={openWork}
          />
          <StudioSection
            title="创作中"
            subtitle={`${writing.length} 部创作中作品`}
            projects={writing}
            emptyText="暂无创作中作品。开始创作后将出现在此。"
            onOpen={openWork}
          />
          <StudioSection
            title="已完成"
            subtitle={`${written.length} 部已完成作品`}
            projects={written}
            emptyText="暂无已完成作品。确认创作完成后将出现在此。"
            onOpen={openWork}
          />
        </div>
      )}
    </div>
  )
}
