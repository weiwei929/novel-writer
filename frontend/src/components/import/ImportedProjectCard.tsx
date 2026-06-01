import React from 'react'
import type { Project } from '../../services/api'
import { IconDelete, IconEye } from '../ui/icons'

interface ImportedProjectCardProps {
  project: Project
  onPreview: () => void
  onDelete: () => void
}

export const ImportedProjectCard: React.FC<ImportedProjectCardProps> = ({
  project,
  onPreview,
  onDelete,
}) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
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
        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded flex-shrink-0">
          草稿
        </span>
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-gray-50 mt-2">
        <div className="flex gap-1">
          <button
            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
            title="预览"
            onClick={onPreview}
          >
            <IconEye size={16} />
          </button>
          <button
            className="p-1.5 text-red-500 hover:bg-red-50 rounded"
            title="删除"
            onClick={onDelete}
          >
            <IconDelete size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ImportedProjectCard
