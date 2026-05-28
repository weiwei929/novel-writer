import React from 'react'
import { Eye, ArrowRight, Trash2 } from 'lucide-react'
import type { Project } from '../../services/api'

interface ImportedProjectCardProps {
  project: Project
  onPreview: () => void
  onMoveToDraft: () => void
  onDelete: () => void
}

export const ImportedProjectCard: React.FC<ImportedProjectCardProps> = ({
  project,
  onPreview,
  onMoveToDraft,
  onDelete
}) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
      {/* 标题和信息 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 text-lg">{project.title}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {project.chapterCount || 0} 章 · {project.wordCount || 0} 字
          </p>
          {project.description && (
            <p className="text-xs text-gray-400 mt-1">{project.description}</p>
          )}
        </div>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded flex-shrink-0">
          待审查
        </span>
      </div>
      
      {/* 操作按钮 - 与 ProjectCard 保持一致的图标样式 */}
      <div className="flex justify-between items-center pt-2 border-t border-gray-50 mt-2">
        <div className="flex gap-1">
          <button 
            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" 
            title="预览"
            onClick={onPreview}
          >
            <Eye size={16} />
          </button>
          
          <button 
            className="p-1.5 text-red-500 hover:bg-red-50 rounded" 
            title="删除"
            onClick={onDelete}
          >
            <Trash2 size={16} />
          </button>
        </div>
        
        <div className="flex gap-1">
          <button 
            onClick={onMoveToDraft}
            className="text-xs flex items-center gap-1 text-blue-600 hover:underline"
          >
            转入创作 <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ImportedProjectCard
