import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Project, chaptersApi, PROJECT_STATUS_LABEL, ProjectStatus } from '../../services/api'
import { workDetailPath, type WorkDetailFrom } from '../../services/shelvedNavigation'
import { IconCalendar, IconDelete, IconDownload, IconEdit, IconEye, IconFile, IconMoveRight, IconReview, IconStats, IconUser } from '../ui/icons'

interface ProjectCardProps {
  project: Project
  collectionName?: string
  workDetailFrom?: WorkDetailFrom
  onDelete: (id: string) => void
  onUpdate?: () => void
  onExport?: (project: Project) => void
  onPreview: (project: Project) => void
  onReview?: (project: Project) => void
  onStatusChange?: (project: Project, newStatus: string) => void
  compact?: boolean
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  collectionName,
  workDetailFrom,
  onDelete,
  onExport,
  onPreview,
  onReview,
  onStatusChange,
  compact = false
}) => {
  const navigate = useNavigate()
  const tags = project.tags || []

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'draft':
      case 'planning':
        return 'bg-gray-100 text-gray-700'
      case 'writing':
      case 'reviewing':
        return 'bg-blue-100 text-blue-700'
      case 'completed':
      case 'archived':
        return 'bg-green-100 text-green-700'
      case 'shelved':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusText = (status: ProjectStatus) => PROJECT_STATUS_LABEL[status] ?? status

  return (
    <div className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow ${compact ? 'p-4' : 'p-6'} border border-gray-100`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className={`font-semibold text-gray-900 ${compact ? 'text-base' : 'text-xl'} line-clamp-2`}>
          {workDetailFrom ? (
            <button
              onClick={() => navigate(workDetailPath(project.id, workDetailFrom))}
              className="hover:text-blue-600 hover:underline transition-colors text-left"
              title="查看作品详情"
            >
              {project.title}
            </button>
          ) : (
            <span className="text-left">{project.title}</span>
          )}
        </h3>
        
        {/* Status Badge */}
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)} whitespace-nowrap ml-2`}>
          {getStatusText(project.status)}
        </span>
      </div>

      {!compact && project.description && (
        <p className="text-gray-600 mb-4 line-clamp-2 text-sm">{project.description}</p>
      )}

      {/* Meta Info */}
      <div className="mb-3 space-y-1">
        <div className="flex items-center text-xs text-gray-500 gap-2">
          <IconUser size={14} /> {project.author}
        </div>
        {collectionName && (
           <div className="flex items-center text-xs text-gray-500 gap-2">
             <IconFile size={14} /> {collectionName}
           </div>
        )}
        {!compact && (
          <div className="flex items-center text-xs text-gray-500 gap-2">
             <IconCalendar size={14} /> {new Date(project.createdAt).toLocaleDateString()}
          </div>
        )}
        <div className="flex items-center text-xs text-gray-500 gap-2">
          <IconStats size={14} /> {project.wordCount.toLocaleString()} 字
        </div>
      </div>

      {/* Inline Outline Preview (Compact) */}
      {!compact && (
        <div className="mb-4">
           {/* Outline Logic could go here, omitting for brevity in extracted card to keep it clean */}
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {tags.slice(0, 3).map((t, i) => (
            <span key={i} className="bg-gray-50 text-gray-600 px-1.5 py-0.5 rounded text-xs border border-gray-200">
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center pt-2 border-t border-gray-50 mt-2">
         <div className="flex gap-1">
            <button 
              className="p-1.5 text-blue-500 hover:bg-blue-50 rounded" 
              title="进入作品详情"
              onClick={async () => {
                try {
                  const chapters = await chaptersApi.getByProjectId(project.id)
                  if (chapters && chapters.length > 0) {
                     navigate(`/writing/${project.id}/${chapters[0].id}`)
                  } else if (workDetailFrom) {
                     navigate(workDetailPath(project.id, workDetailFrom))
                  }
                } catch {
                  if (workDetailFrom) {
                    navigate(workDetailPath(project.id, workDetailFrom))
                  }
                }
              }}
            >
              <IconEdit size={16} />
            </button>
            <button 
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" 
              title="预览"
              onClick={() => onPreview(project)}
            >
              <IconEye size={16} />
            </button>
            {project.status === 'completed' && onExport && (
              <button 
                className="p-1.5 text-green-600 hover:bg-green-50 rounded" 
                title="导出"
                onClick={() => onExport(project)}
              >
                <IconDownload size={16} />
              </button>
            )}
             {project.status === 'completed' && onReview && (
              <button 
                className="p-1.5 text-purple-600 hover:bg-purple-50 rounded" 
                title="AI 全书审阅"
                onClick={() => onReview(project)}
              >
                <IconReview size={16} />
              </button>
            )}
             <button 
              className="p-1.5 text-red-500 hover:bg-red-50 rounded" 
              title="删除"
              onClick={() => onDelete(project.id)}
            >
              <IconDelete size={16} />
            </button>
            {/* 0608 P2-2b: shelve 用户路径已屏蔽 */}
         </div>

         {/* Move Actions (Kanban Support) */}
         {onStatusChange && (
           <div className="flex gap-1">
             {(project.status === 'draft' || project.status === 'writing' || project.status === 'planning') && (
                <button 
                   onClick={() => onStatusChange(project, 'completed')}
                   className="text-xs flex items-center gap-1 text-green-600 hover:underline"
                >
                  完成 <IconMoveRight size={12} />
                </button>
             )}
             {project.status === 'completed' && (
                <button 
                   onClick={() => onStatusChange(project, 'writing')}
                   className="text-xs flex items-center gap-1 text-orange-600 hover:underline"
                >
                   返回修改
                </button>
             )}
           </div>
         )}
      </div>
    </div>
  )
}
