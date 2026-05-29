import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { projectsApi, chaptersApi, Project, Chapter } from '../services/api'
import { PlannerBoard } from '../components/planner/PlannerBoard'
import { ProjectOutline } from '../types/planner'
import { useNotifications } from '../hooks/useNotifications'
import { ArrowLeft, FileText, Play, Layout, Settings, List, Bot } from 'lucide-react'
import ProjectManagementPanel from '../components/project/ProjectManagementPanel'
import { ChapterOutlineGenerator } from '../components/ai/ChapterOutlineGenerator'

const ProjectDetailPage: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { success: notifySuccess, error: notifyError } = useNotifications()

  const [project, setProject] = useState<Project | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'chapters' | 'planner' | 'settings'>('chapters')
  
  // AI 章节大纲生成器状态
  const [showOutlineGenerator, setShowOutlineGenerator] = useState(false)

  const load = async () => {
    if (!id) return
    try {
      setLoading(true)
      setError(null)
      const [p, list] = await Promise.all([projectsApi.getById(id), chaptersApi.getByProjectId(id)])
      setProject(p)
      setChapters(list.sort((a, b) => a.order - b.order))
    } catch (e) {
      console.error('加载项目或章节失败:', e)
      setError('加载项目或章节失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  // Planner Save Handler
  const handleOutlineSave = async (outline: ProjectOutline) => {
    if (!project) return
    try {
      const updatedMetadata = {
        ...project.metadata,
        outline // Save outline to metadata
      }
      const updatedProject = await projectsApi.update(project.id, {
        metadata: updatedMetadata
      })
      setProject(updatedProject)
      notifySuccess('大纲已保存')
    } catch (err) {
      notifyError('保存大纲失败')
      console.error(err)
    }
  }

  const handleProjectUpdate = (updated: Project) => {
      setProject(updated)
      notifySuccess('项目信息已更新')
  }

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-700">
          {error || '作品不存在'}
        </div>
        <button
          onClick={() => navigate('/projects')}
          className="px-4 py-2 bg-gray-600 text-white rounded"
        >
          返回作品列表
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* 顶部栏 */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
            <button
            onClick={() => navigate('/projects')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
            <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-800">{project.title}</h1>
        </div>
        
        {/* Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
                onClick={() => setActiveTab('chapters')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'chapters' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
                <div className="flex items-center gap-2">
                    <List size={16} />
                    章节列表
                </div>
            </button>
            <button
                onClick={() => setActiveTab('planner')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'planner' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
                <div className="flex items-center gap-2">
                    <Layout size={16} />
                    深度策划
                </div>
            </button>
            <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'settings' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
                <div className="flex items-center gap-2">
                    <Settings size={16} />
                    作品设置
                </div>
            </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === 'chapters' && (
             <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold">章节列表</h2>
                <div className="flex items-center gap-2">
                  {/* AI 辅助 */}
                  <button
                    onClick={() => setShowOutlineGenerator(true)}
                    className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-1.5 text-sm"
                  >
                    <Bot size={16} />
                    AI 生成大纲
                  </button>
                </div>
                </div>

                {chapters.length === 0 ? (
                <div className="p-10 text-center text-gray-500">
                    <FileText className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                    <div className="mb-4">暂无章节</div>
                    <div className="text-sm text-gray-400 mb-6 leading-relaxed max-w-sm mx-auto">
                      进入编辑器，使用"管理章节规划"创建和规划章节
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => navigate(`/editor/${project.id}`)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
                      >
                        <Play size={18} />
                        进入编辑器
                      </button>
                      <button
                        onClick={() => setShowOutlineGenerator(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all font-medium"
                      >
                        <Bot size={18} />
                        AI 生成大纲
                      </button>
                    </div>
                </div>
                ) : (
                <div className="divide-y">
                    {chapters.map(c => (
                    <div key={c.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">第 {c.order} 章</span>
                        <span className="font-medium truncate max-w-[40rem] text-gray-800">
                            {c.title || `第${c.order}章`}
                        </span>
                        </div>
                        <button
                        onClick={() => navigate(`/editor/${project.id}/${c.id}`)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-blue-200 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors font-medium text-sm"
                        title="进入编辑器"
                        >
                        <Play className="w-4 h-4" /> 写作
                        </button>
                    </div>
                    ))}
                </div>
                )}
             </div>
          )}

          {activeTab === 'planner' && (
              <div className="h-full">
                  <PlannerBoard 
                    projectId={project.id}
                    initialOutline={(project.metadata as any)?.outline} 
                    onSave={handleOutlineSave}
                  />
              </div>
          )}

          {activeTab === 'settings' && (
              <ProjectManagementPanel 
                project={project} 
                chapters={chapters} 
                onProjectUpdate={handleProjectUpdate} 
              />
          )}
      </div>
      
      {/* AI 章节大纲生成器 */}
      {project && (
        <ChapterOutlineGenerator
          isOpen={showOutlineGenerator}
          onClose={() => setShowOutlineGenerator(false)}
          projectId={project.id}
          onSuccess={() => {
            load() // 重新加载章节列表
            notifySuccess('章节大纲已成功导入！')
          }}
        />
      )}
    </div>
  )
}

export default ProjectDetailPage
