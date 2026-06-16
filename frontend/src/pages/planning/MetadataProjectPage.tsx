import { IconArrowLeft } from '../../components/ui/icons'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { projectsApi, type Project } from '../../services/api'
import { useWorldStore } from '../../stores/worldStore'
import { useUIStore } from '../../stores/uiStore'
import WorldBuildingPage from '../creative/WorldBuildingPage'
import ProjectStatusBadge from '../../components/projects/ProjectStatusBadge'

export default function MetadataProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { addNotification } = useUIStore()
  const setCurrentScope = useWorldStore(s => s.setCurrentScope)

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    try {
      setProject(await projectsApi.getById(projectId))
    } catch {
      addNotification({ type: 'error', title: '加载失败', message: '无法加载作品信息' })
    } finally {
      setLoading(false)
    }
  }, [projectId, addNotification])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (projectId) setCurrentScope({ type: 'project', id: projectId })
    return () => setCurrentScope(null)
  }, [projectId, setCurrentScope])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-sm">未找到该作品。</p>
        <button onClick={() => navigate('/planning/metadata')} className="mt-3 text-blue-600 text-sm">
          返回列表
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => navigate('/planning/metadata')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
        >
          <IconArrowLeft size={16} />
          选择其他作品
        </button>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-gray-900">{project.title}</h1>
          <ProjectStatusBadge status={project.status} phase="planning" />
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-900">
        <p className="font-medium">遗留资料入口</p>
        <p className="mt-1 text-amber-800">
          请优先在
          <button
            type="button"
            onClick={() => navigate(`/work/${projectId}?from=planning`)}
            className="mx-1 text-blue-700 underline hover:text-blue-900"
          >
            作品详情 · 作品设定
          </button>
          编辑。本页仅保留旧版人物/故事线/心流（只读兼容期）。
        </p>
      </div>

      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3">遗留资料（只读）</h2>
        <p className="text-sm text-gray-500 mb-4">
          以下为冻结中的旧创作资料线，不再扩展。新内容请写入作品详情页的作品设定。
        </p>
        <WorldBuildingPage readOnly />
      </div>
    </div>
  )
}
