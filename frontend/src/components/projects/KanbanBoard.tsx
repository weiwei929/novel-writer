import React, { useState } from 'react'
import { Project, projectsApi } from '../../services/api'
import { ProjectCard } from './ProjectCard'
import { ImportedProjectCard } from '../import/ImportedProjectCard'
import { Inbox, PenTool, CheckCircle } from 'lucide-react'
import { GlobalReviewModal } from './GlobalReviewModal'
import { useNotifications } from '../../hooks/useNotifications'


interface KanbanBoardProps {
  projects: Project[]
  onProjectUpdate: () => void
  onDelete: (id: string) => void
  onExport: (project: Project) => void
  onPreview: (project: Project) => void
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  projects,
  onProjectUpdate,
  onDelete,
  onExport,
  onPreview,
}) => {
  const [reviewModalProject, setReviewModalProject] = useState<Project | null>(null);

  // Group projects by internal columns
  const columns = {
    imported: projects.filter(p => p.status === 'imported'),
    original: projects.filter(p => ['draft', 'writing'].includes(p.status)),
    completed: projects.filter(p => ['completed', 'published', 'archived'].includes(p.status)),
  }

  const handleStatusChange = async (project: Project, newStatus: string) => {
    try {
      await projectsApi.update(project.id, { status: newStatus as any })
      onProjectUpdate()
    } catch (error) {
      console.error('Failed to update status', error)
      alert("更新状态失败")
    }
  }

  const handleReview = (project: Project) => {
      setReviewModalProject(project);
  }

  const { success, error } = useNotifications()

  const handleMoveToDraft = async (projectId: string) => {
    try {
      await projectsApi.moveToDraft(projectId)
      success('已转入原创构思', '项目已移动到创作区域')
      onProjectUpdate()
    } catch (err: any) {
      error('转移失败', err.message || '无法转移项目')
      console.error('Failed to move to draft:', err)
    }
  }


  return (
    <div className="flex h-full gap-6 overflow-x-auto pb-4">
      {/* Column 1: Imported */}
      <div className="flex-1 min-w-[320px] bg-gray-50/50 rounded-xl p-4 border border-gray-100 flex flex-col">
        <div className="flex items-center gap-2 mb-4 text-gray-700 font-semibold pb-2 border-b border-gray-200">
           <Inbox size={20} className="text-yellow-600" />
           外部导入 ({columns.imported.length})
        </div>
        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
          {columns.imported.map(p => (
            <ImportedProjectCard
              key={p.id}
              project={p}
              onPreview={() => onPreview(p)}
              onMoveToDraft={() => handleMoveToDraft(p.id)}
              onDelete={() => onDelete(p.id)}
            />
          ))}
          {columns.imported.length === 0 && (
             <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                暂无导入项目
             </div>
          )}
        </div>
      </div>

      {/* Column 2: Original Idea / Writing */}
      <div className="flex-1 min-w-[320px] bg-blue-50/30 rounded-xl p-4 border border-blue-100 flex flex-col">
        <div className="flex items-center gap-2 mb-4 text-gray-700 font-semibold pb-2 border-b border-blue-200">
           <PenTool size={20} className="text-blue-600" />
           原创构思 / 创作中 ({columns.original.length})
        </div>
        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
          {columns.original.map(p => (
            <ProjectCard 
              key={p.id} 
              project={p} 
              compact={true}
              onDelete={onDelete}
              onPreview={onPreview}
              onExport={onExport}
              onStatusChange={handleStatusChange}
            />
          ))}
           {columns.original.length === 0 && (
             <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                点击上方 + 创建新项目
             </div>
          )}
        </div>
      </div>

      {/* Column 3: Completed */}
      <div className="flex-1 min-w-[320px] bg-green-50/30 rounded-xl p-4 border border-green-100 flex flex-col">
        <div className="flex items-center gap-2 mb-4 text-gray-700 font-semibold pb-2 border-b border-green-200">
           <CheckCircle size={20} className="text-green-600" />
           完结归档 ({columns.completed.length})
        </div>
        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
          {columns.completed.map(p => (
             <ProjectCard 
              key={p.id} 
              project={p} 
              compact={true}
              onDelete={onDelete}
              onPreview={onPreview}
              onExport={onExport}
              // No status change forward from completed for now, maybe "Reopen"?
              onStatusChange={(p) => handleStatusChange(p, 'draft')} // Allow reopen
              onReview={handleReview}
            />
          ))}
          {columns.completed.length === 0 && (
             <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                加油，期待您的第一部完结作品！
             </div>
          )}
        </div>
      </div>

      {reviewModalProject && (
        <GlobalReviewModal 
            isOpen={!!reviewModalProject}
            onClose={() => setReviewModalProject(null)}
            projectId={reviewModalProject.id}
            projectTitle={reviewModalProject.title}
        />
      )}
    </div>
  )
}
