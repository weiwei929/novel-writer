import React, { useState, useEffect, useCallback } from 'react'
import { projectsApi, chaptersApi, Project } from '../../services/api'
import { ProjectCard } from './ProjectCard'
import { KanbanBoard } from './KanbanBoard'
import { CreateProjectModal } from './CreateProjectModal'
import { DeleteConfirmModal } from './DeleteConfirmModal'
import { readMetadataFieldValue } from '../../utils/metadataField'
import { IconFile, IconGrid, IconList, IconPlus } from '../ui/icons'

const ProjectsList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTag, setSelectedTag] = useState<string>('')
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [previewProject, setPreviewProject] = useState<Project | null>(null)
  const [previewChapters, setPreviewChapters] = useState<any[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  
  // Delete confirmation modal state
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; projectId: string; projectTitle: string }>({
    show: false,
    projectId: '',
    projectTitle: ''
  })

  useEffect(() => {
    ;(async () => {
      if (!previewProject) return
      try {
        setPreviewLoading(true)
        const chs = await chaptersApi.getByProjectId(previewProject.id)
        setPreviewChapters(chs.sort((a, b) => a.order - b.order))
      } catch {
        setPreviewChapters([])
      } finally {
        setPreviewLoading(false)
      }
    })()
  }, [previewProject])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const projectsData = await projectsApi.getAll()
      setProjects(projectsData)
      
      // Extract unique tags
      const tags = new Set<string>()
      projectsData.forEach(p => {
        if (p.tags) p.tags.forEach(t => tags.add(t))
        if (p.genre) p.genre.forEach(g => tags.add(g)) // Treat genre as tags
      })
      setAvailableTags(Array.from(tags).sort())
    } catch (err) {
      setError('加载数据失败')
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])
  
  // Filter projects by tag
  const filteredProjects = selectedTag 
    ? projects.filter(p => (p.tags?.includes(selectedTag) || p.genre?.includes(selectedTag)))
    : projects

  // ... (handlers)

  const handleDelete = (id: string) => {
    const project = projects.find(p => p.id === id)
    setDeleteConfirm({
      show: true,
      projectId: id,
      projectTitle: project?.title || '该项目'
    })
  }

  const confirmDelete = async () => {
    try {
      await projectsApi.delete(deleteConfirm.projectId)
      setProjects(projects.filter(p => p.id !== deleteConfirm.projectId))
      setDeleteConfirm({ show: false, projectId: '', projectTitle: '' })
    } catch (err) {
      setError('删除项目失败')
      console.error('Error deleting project:', err)
    }
  }

  const cancelDelete = () => {
    setDeleteConfirm({ show: false, projectId: '', projectTitle: '' })
  }

  const handleExport = async (project: Project) => {
    try {
      const blob = await projectsApi.exportProject(project.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${project.title}.md`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError('导出失败')
      console.error('Export error:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">加载中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold">作品管理</h1>
          <p className="text-gray-600 mt-1">管理你的小说作品</p>
        </div>
        <div className="flex gap-3">
           {/* View Toggles */}
           <div className="bg-gray-100 p-1 rounded-lg flex">
              <button 
                onClick={() => setViewMode('kanban')}
                className={`p-2 rounded ${viewMode === 'kanban' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                title="看板视图"
              >
                 <IconList size={20} className="rotate-90" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                title="网格视图"
              >
                 <IconGrid size={20} />
              </button>
           </div>

           <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-600 text-sm font-medium"
          >
            <IconPlus size={20} />
            创建作品
          </button>
        </div>
      </div>

      {/* Tag Filter Bar */}
      {availableTags.length > 0 && (
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 flex-shrink-0 custom-scrollbar px-1">
          <button 
            onClick={() => setSelectedTag('')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap border ${!selectedTag ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
          >
            全部
          </button>
          {availableTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap border ${selectedTag === tag ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          {projects.length === 0 ? (
             // No projects at all
             <>
                <IconFile size={64} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 text-lg mb-4">还没有作品</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600"
                >
                  创建第一个作品
                </button>
             </>
          ) : (
             // Projects exist but filtered out by tag
             <>
                <div className="text-gray-400 mb-4 text-6xl">🏷️</div>
                <p className="text-gray-500 text-lg mb-4">没有找到标签为 #{selectedTag} 的作品</p>
                <button
                  onClick={() => setSelectedTag('')}
                  className="text-blue-500 hover:underline"
                >
                  查看所有作品
                </button>
             </>
          )}
        </div>
      ) : (
        <div className="flex-1 min-h-0">
           {viewMode === 'kanban' ? (
             <KanbanBoard 
               projects={filteredProjects}
               onProjectUpdate={loadData}
               onDelete={handleDelete}
               onExport={handleExport}
               onPreview={(p) => setPreviewProject(p)}
             />
           ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto h-full pb-4 pr-2 custom-scrollbar p-1">
              {filteredProjects.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onDelete={handleDelete}
                  onUpdate={loadData}
                  onExport={handleExport}
                  onPreview={p => setPreviewProject(p)}
                  compact={false}
                />
              ))}
            </div>
           )}
        </div>
      )}

      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            loadData()
          }}
        />
      )}

      {/* 预览弹窗 */}
      {previewProject && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
           {/* Modal Overlay to Close */}
          <div className="absolute inset-0" onClick={() => setPreviewProject(null)}></div>
          
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col z-10">
            <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">预览: {previewProject.title}</h3>
              </div>
              <button
                className="p-1 hover:bg-gray-100 rounded text-gray-500"
                onClick={() => setPreviewProject(null)}
              >
                关闭
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-2">梗概</h4>
                <div className="p-4 bg-gray-50 rounded-lg text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {readMetadataFieldValue((previewProject as any)?.metadata?.synopsis) || '暂无梗概'}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">章节内容</h4>
                  {previewLoading ? (
                    <div className="text-center py-8 text-gray-500">加载中...</div>
                  ) : previewChapters.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-100 rounded-lg">暂无章节</div>
                  ) : (
                    <div className="space-y-6">
                      {previewChapters.map(c => (
                        <div key={c.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                          <h5 className="font-bold text-gray-900 mb-2">Let. {c.order} {c.title}</h5>
                           {c.summary && (
                            <div className="text-sm text-gray-500 italic mb-2 bg-gray-50 p-2 rounded">
                               {c.summary}
                            </div>
                           )}
                          <div className="text-gray-800 whitespace-pre-wrap leading-relaxed font-serif">
                            {c.content || <span className="text-gray-300 italic">（空章节）</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>
             <div className="p-3 bg-gray-50 border-t rounded-b-xl text-xs text-gray-500 flex justify-between">
                <span>Total Words: {previewProject.wordCount.toLocaleString()}</span>
                <span>ID: {previewProject.id}</span>
             </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteConfirm.show}
        projectTitle={deleteConfirm.projectTitle}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  )
}

export default ProjectsList
