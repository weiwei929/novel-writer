import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectsApi, type Project } from '../services/api'
import { useUIStore } from '../stores/uiStore'
import ProjectStatusBadge from '../components/projects/ProjectStatusBadge'
import { IconReview } from '../components/ui/icons'

interface EditorialSectionProps {
  title: string
  subtitle: string
  projects: Project[]
  emptyText: string
  onOpen: (id: string) => void
}

function EditorialSection({ title, subtitle, projects, emptyText, onOpen }: EditorialSectionProps) {
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
              className="text-left bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm hover:border-amber-200 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-900 truncate">{p.title}</h3>
                <ProjectStatusBadge status={p.status} phase="editorial" />
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mt-2">
                <span>{p.author?.trim() || '—'}</span>
                <span>{p.chapterCount ?? 0} 章</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

export default function EditorialPage() {
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

  const pending = useMemo(() => projects.filter(p => p.status === 'written'), [projects])
  const active = useMemo(() => projects.filter(p => p.status === 'reviewing'), [projects])
  const completed = useMemo(() => projects.filter(p => p.status === 'reviewed'), [projects])

  const openWork = (id: string) => navigate(`/work/${id}?from=editorial`)
  const openReview = (id: string) => navigate(`/editorial/${id}`)

  const total = pending.length + active.length + completed.length

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="bg-amber-100 p-2 rounded-lg">
          <IconReview className="w-6 h-6 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">编审部</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} 部作品（待审阅 / 审阅中 / 已审阅）
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-amber-600 rounded-full animate-spin" />
            <span className="text-sm">加载中...</span>
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-red-400">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      ) : (
        <div className="space-y-10">
          <EditorialSection
            title="待审阅"
            subtitle={`${pending.length} 部待审阅作品`}
            projects={pending}
            emptyText="暂无待审阅作品。创作室标记「全本完成」后将出现在此。"
            onOpen={openWork}
          />
          <EditorialSection
            title="审阅中"
            subtitle={`${active.length} 部审阅中作品`}
            projects={active}
            emptyText="暂无审阅中作品。开始审阅后将出现在此。"
            onOpen={openWork}
          />
          <EditorialSection
            title="已审阅"
            subtitle={`${completed.length} 部已审阅作品`}
            projects={completed}
            emptyText="暂无已审阅作品。确认审阅完成后将出现在此。"
            onOpen={openReview}
          />
        </div>
      )}
    </div>
  )
}
