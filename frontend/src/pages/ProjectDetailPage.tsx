import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { projectsApi, chaptersApi, Project, Chapter } from '../services/api'
import ChapterPlanningEditor from '../components/editor/ChapterPlanningEditor'
import { useNotifications } from '../contexts/UIContext'
import { ArrowLeft, FileText, Play } from 'lucide-react'

const ProjectDetailPage: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { success: notifySuccess } = useNotifications()

  const [project, setProject] = useState<Project | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPlanning, setShowPlanning] = useState(false)

  const load = async () => {
    if (!id) return
    try {
      setLoading(true)
      setError(null)
      const [p, list] = await Promise.all([
        projectsApi.getById(id),
        chaptersApi.getByProjectId(id)
      ])
      setProject(p)
      setChapters(list.sort((a, b) => a.order - b.order))
    } catch (e) {
      console.error('加载项目或章节失败:', e)
      setError('加载项目或章节失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-700">{error}</div>
        <button onClick={() => navigate('/projects')} className="px-4 py-2 bg-gray-600 text-white rounded">返回项目列表</button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* 顶部栏 */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/projects')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5" /> 返回项目列表
        </button>
        <button
          className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => setShowPlanning(true)}
        >
          管理章节规划
        </button>
      </div>

      {/* 项目信息 */}
      {project && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">{project.title}</h1>
            <div className="text-sm text-gray-600">共 {chapters.length} 章 · {project.wordCount.toLocaleString()} 字</div>
          </div>
          {project.metadata?.synopsis?.current && (
            <div className="mt-2 text-sm text-gray-700">
              <span className="px-2 py-0.5 mr-2 rounded bg-blue-100 text-blue-700 border border-blue-200 text-xs">作品梗概</span>
              <span>{project.metadata.synopsis.current}</span>
            </div>
          )}
        </div>
      )}

      {/* 章节列表 */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">章节列表</h2>
          {/* 明确取消“新建章节”入口，统一到“管理章节规划” */}
        </div>

        {chapters.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            <FileText className="w-10 h-10 mx-auto mb-3 text-gray-400" />
            <div>该项目暂时没有章节，请使用右上角“管理章节规划”进行新增与规划</div>
          </div>
        ) : (
          <div className="divide-y">
            {chapters.map((c) => (
              <div key={c.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">第 {c.order} 章</span>
                  <span className="font-medium truncate max-w-[40rem]">{c.title || `第${c.order}章`}</span>
                </div>
                <button
                  onClick={() => navigate(`/editor/${c.id}`)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 border rounded hover:bg-gray-50 text-gray-700"
                  title="进入编辑器"
                >
                  <Play className="w-4 h-4" /> 编辑
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showPlanning && project && (
        <ChapterPlanningEditor
          projectId={project.id}
          initialPlans={(project as any).chapterPlanning || []}
          onClose={() => setShowPlanning(false)}
          onSaved={() => {
            setShowPlanning(false)
            notifySuccess('章节规划已更新')
            load()
          }}
        />
      )}
    </div>
  )
}

export default ProjectDetailPage