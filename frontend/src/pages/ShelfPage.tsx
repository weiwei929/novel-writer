import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  projectsApi,
  PROJECT_STATUS_LABEL,
  type Project,
} from '../services/api'
import { useNotifications } from '../hooks/useNotifications'
import ProjectStatusBadge from '../components/projects/ProjectStatusBadge'
import { IconDelete, IconRefresh, IconShelf } from '../components/ui/icons'

interface ShelvedMeta {
  previousStatus?: string
  shelvedAt?: string
  source?: string
}

const SOURCE_LABELS: Record<string, string> = {
  creative: '创意组',
  planning: '企划课',
  writing: '创作室',
  review: '编审部',
  library: '文集库',
  project_card: '作品卡片',
  stage_transition: '阶段管理',
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days < 1) return '今天'
  if (days < 30) return `${days} 天前`
  return new Date(iso).toLocaleDateString('zh-CN')
}

function getShelvedMeta(project: Project): ShelvedMeta {
  const meta = project.metadata as Record<string, unknown> | undefined
  return (meta?._shelved as ShelvedMeta) || {}
}

function ShelvedProjectCard({
  project,
  onRestore,
  onPermanentDelete,
}: {
  project: Project
  onRestore: (id: string) => void
  onPermanentDelete: (id: string, title: string) => void
}) {
  const shelved = getShelvedMeta(project)
  const prevLabel = shelved.previousStatus
    ? PROJECT_STATUS_LABEL[shelved.previousStatus] || shelved.previousStatus
    : '未知'
  const sourceLabel = shelved.source
    ? SOURCE_LABELS[shelved.source] || shelved.source
    : '—'
  const shelvedAt = shelved.shelvedAt
    ? formatRelativeTime(shelved.shelvedAt)
    : formatRelativeTime(project.updatedAt)

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to={`/work/${project.id}`}
              className="text-lg font-semibold text-gray-900 hover:text-blue-600 truncate"
            >
              {project.title}
            </Link>
            <ProjectStatusBadge status={project.status} />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            原状态：{prevLabel} · 移入时间：{shelvedAt}
          </p>
          <p className="text-xs text-gray-400 mt-1">来源：{sourceLabel}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onRestore(project.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50"
          >
            <IconRefresh size={14} />
            还原
          </button>
          <button
            type="button"
            onClick={() => onPermanentDelete(project.id, project.title)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
          >
            <IconDelete size={14} />
            彻底删除
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ShelfPage() {
  const { success: notifySuccess, error: notifyError } = useNotifications()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const graveyard = await projectsApi.getGraveyard()
      setProjects(graveyard)
    } catch {
      notifyError('加载失败', '无法获取暂存作品列表')
    } finally {
      setLoading(false)
    }
  }, [notifyError])

  useEffect(() => {
    void load()
  }, [load])

  const handleRestore = async (id: string) => {
    setActing(true)
    try {
      await projectsApi.unshelve(id)
      notifySuccess('已还原', '作品已从暂存移出')
      await load()
    } catch {
      notifyError('还原失败')
    } finally {
      setActing(false)
    }
  }

  const handlePermanentDelete = (id: string, title: string) => {
    if (!window.confirm(`确定要彻底删除《${title}》吗？此操作不可撤销。`)) return
    void confirmPermanentDelete(id)
  }

  const confirmPermanentDelete = async (id: string) => {
    setActing(true)
    try {
      await projectsApi.delete(id)
      notifySuccess('已彻底删除')
      await load()
    } catch {
      notifyError('删除失败')
    } finally {
      setActing(false)
    }
  }

  const handleClearAll = () => {
    if (projects.length === 0) return
    if (
      !window.confirm(
        `确定要彻底删除全部 ${projects.length} 个暂存作品吗？此操作不可撤销。`
      )
    ) {
      return
    }
    void (async () => {
      setActing(true)
      try {
        await Promise.all(projects.map(p => projectsApi.delete(p.id)))
        notifySuccess('已清空', '全部暂存作品已删除')
        await load()
      } catch {
        notifyError('清空失败', '部分作品可能未删除成功，请刷新后重试')
        await load()
      } finally {
        setActing(false)
      }
    })()
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center text-gray-500">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
        加载中…
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">作品暂存</h1>
        {projects.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            disabled={acting}
            className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
          >
            清空全部
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
          <IconShelf size={48} className="text-gray-300 mx-auto mb-4" />
          <div className="text-gray-400 text-lg">暂无暂存作品</div>
          <div className="text-gray-500 text-sm mt-2">
            从任意作品的操作中选择「移入暂存」即可在此处查看
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map(p => (
            <ShelvedProjectCard
              key={p.id}
              project={p}
              onRestore={handleRestore}
              onPermanentDelete={handlePermanentDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
