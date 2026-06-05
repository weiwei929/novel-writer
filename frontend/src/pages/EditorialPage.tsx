import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectsApi, type Project } from '../services/api'
import { useUIStore } from '../stores/uiStore'
import ProjectStatusBadge from '../components/projects/ProjectStatusBadge'
import { IconReview } from '../components/ui/icons'

const EDITORIAL_QUEUE_STATUSES = ['written', 'reviewing'] as const

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
      const data = await projectsApi.getEditorialProjects()
      setProjects(
        data.filter(p =>
          EDITORIAL_QUEUE_STATUSES.includes(
            p.status as (typeof EDITORIAL_QUEUE_STATUSES)[number]
          )
        )
      )
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

  const subtitle = useMemo(() => `${projects.length} 部待审作品`, [projects.length])

  const handleOpen = (projectId: string) => {
    navigate(`/editorial/${projectId}`)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="bg-amber-100 p-2 rounded-lg">
          <IconReview className="w-6 h-6 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">编审部</h1>
          <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
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
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <IconReview className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">暂无待审作品。创作室标记「全本完成」后将出现在此。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleOpen(p.id)}
              className="text-left bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm hover:border-amber-200 transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-gray-900 truncate">{p.title}</h3>
                <ProjectStatusBadge status={p.status} />
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                <span>{p.author?.trim() || '—'}</span>
                <span>{p.chapterCount ?? 0} 章</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
