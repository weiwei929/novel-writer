import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
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
          <ArrowLeft size={16} />
          选择其他作品
        </button>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-gray-900">{project.title}</h1>
          <ProjectStatusBadge status={project.status} />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3">作品设定</h2>
        <p className="text-sm text-gray-500 mb-4">
          人物设定、故事线、创作心流已迁入本项目，可在此继续编辑。
        </p>
        <WorldBuildingPage readOnly={false} />
      </div>
    </div>
  )
}
