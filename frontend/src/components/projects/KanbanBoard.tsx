import React, { useState } from 'react'
import { Project, projectsApi } from '../../services/api'
import { ProjectCard } from './ProjectCard'
import { GlobalReviewModal } from './GlobalReviewModal'
import { useNotifications } from '../../hooks/useNotifications'
import { IconCheckCircle, IconPenTool } from '../ui/icons'

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
  const [reviewModalProject, setReviewModalProject] = useState<Project | null>(null)
  const { error } = useNotifications()

  const columns = {
    original: projects.filter(p => ['draft', 'planning', 'writing'].includes(p.status)),
    completed: projects.filter(p => ['completed', 'archived', 'reviewing'].includes(p.status)),
  }

  const handleStatusChange = async (project: Project, newStatus: string) => {
    try {
      await projectsApi.update(project.id, { status: newStatus as Project['status'] })
      onProjectUpdate()
    } catch (err) {
      console.error('Failed to update status', err)
      error('更新状态失败', '无法更新作品状态')
    }
  }

  const handleReview = (project: Project) => {
    setReviewModalProject(project)
  }

  return (
    <div className="flex h-full gap-6 overflow-x-auto pb-4">
      <div className="flex-1 min-w-[320px] bg-blue-50/30 rounded-xl p-4 border border-blue-100 flex flex-col">
        <div className="flex items-center gap-2 mb-4 text-gray-700 font-semibold pb-2 border-b border-blue-200">
          <IconPenTool size={20} className="text-blue-600" />
          草稿 / 创作中 ({columns.original.length})
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
              onUpdate={onProjectUpdate}
              onStatusChange={handleStatusChange}
            />
          ))}
          {columns.original.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
              点击上方 + 创建新作品
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-w-[320px] bg-green-50/30 rounded-xl p-4 border border-green-100 flex flex-col">
        <div className="flex items-center gap-2 mb-4 text-gray-700 font-semibold pb-2 border-b border-green-200">
          <IconCheckCircle size={20} className="text-green-600" />
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
              onUpdate={onProjectUpdate}
              onStatusChange={(proj) => handleStatusChange(proj, 'draft')}
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
