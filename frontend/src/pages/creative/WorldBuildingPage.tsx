import { useEffect, useState } from 'react'
import { Globe2 } from 'lucide-react'
import { projectsApi, type Project } from '../../services/api'
import { useWorldStore } from '../../stores/worldStore'
import { useUIStore } from '../../stores/uiStore'
import CharactersPanel from '../../components/world/CharactersPanel'
import TimelinePanel from '../../components/world/TimelinePanel'
import CreativeFlowPanel from '../../components/world/CreativeFlowPanel'

type Tab = 'characters' | 'timeline' | 'flows'

const TABS: { id: Tab; label: string }[] = [
  { id: 'characters', label: '人物设定' },
  { id: 'timeline', label: '故事线' },
  { id: 'flows', label: '创作心流' },
]

export default function WorldBuildingPage() {
  const currentProjectId = useWorldStore(s => s.currentProjectId)
  const setCurrentProjectId = useWorldStore(s => s.setCurrentProjectId)

  const { addNotification } = useUIStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('characters')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setProjectsLoading(true)
      try {
        const data = await projectsApi.getAll()
        if (cancelled) return
        setProjects(data)
        // 校正 currentProjectId：为空或指向已删除作品时，默认选第一个
        const stillValid = data.some(p => p.id === currentProjectId)
        if (!stillValid) {
          setCurrentProjectId(data.length > 0 ? data[0].id : null)
        } else if (currentProjectId) {
          // 已有有效选择，确保数据已加载
          void useWorldStore.getState().loadAll()
        }
      } catch {
        if (!cancelled) addNotification({ type: 'error', title: '加载失败', message: '无法加载作品列表' })
      } finally {
        if (!cancelled) setProjectsLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
    // 仅在挂载时加载作品列表
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 顶部栏 */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Globe2 size={22} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">世界观</h1>
              <p className="text-sm text-gray-500 mt-0.5">人物设定 · 故事线 · 创作心流</p>
            </div>
          </div>

          <select
            value={currentProjectId ?? ''}
            onChange={e => setCurrentProjectId(e.target.value || null)}
            disabled={projectsLoading || projects.length === 0}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60"
          >
            {projects.length === 0 && <option value="">暂无作品</option>}
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        {/* 内部 Tab（不改变 URL） */}
        <div className="flex items-center gap-1 border-b border-gray-200">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === t.id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 内容区 */}
      {projectsLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            <span className="text-sm">加载中...</span>
          </div>
        </div>
      ) : !currentProjectId ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Globe2 size={48} className="mb-3 opacity-30" />
          <p className="text-sm">请先在「企划课」创建作品，再回到这里管理世界观。</p>
        </div>
      ) : activeTab === 'characters' ? (
        <CharactersPanel projectId={currentProjectId} />
      ) : activeTab === 'timeline' ? (
        <TimelinePanel projectId={currentProjectId} />
      ) : (
        <CreativeFlowPanel projectId={currentProjectId} />
      )}
    </div>
  )
}
