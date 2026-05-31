import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'
import { projectsApi, chaptersApi, type Project, type Chapter } from '../../services/api'
import { useWorldStore } from '../../stores/worldStore'
import { useUIStore } from '../../stores/uiStore'
import WorldBuildingPage from '../creative/WorldBuildingPage'
import ProjectStatusBadge from '../../components/projects/ProjectStatusBadge'

export default function WritingProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { addNotification } = useUIStore()
  const setCurrentScope = useWorldStore(s => s.setCurrentScope)

  const [project, setProject] = useState<Project | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const [p, ch] = await Promise.all([
        projectsApi.getById(projectId),
        chaptersApi.getByProject(projectId),
      ])
      setProject(p)
      setChapters(ch)
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
        <button onClick={() => navigate('/writing/projects')} className="mt-3 text-blue-600 text-sm">
          返回列表
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => navigate('/writing/projects')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          返回创作室
        </button>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-gray-900">{project.title}</h1>
          <ProjectStatusBadge status={project.status} />
        </div>
      </div>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">作品设定（只读）</h2>
        <p className="text-sm text-gray-500 mb-4">创作室中作品设定仅供查阅，修改请前往企划课「作品内容元数据」。</p>
        <WorldBuildingPage readOnly />
      </section>

      <section className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <FileText size={18} />
          章节
        </h2>
        {chapters.length === 0 ? (
          <p className="text-sm text-gray-500">暂无章节。章节编辑功能开发中。</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {chapters.map(c => (
              <li key={c.id} className="py-2 text-sm text-gray-700">
                {c.title || `第 ${c.order ?? '?'} 章`}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
