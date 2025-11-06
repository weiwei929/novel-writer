import React, { useState } from 'react'
import { Project } from '../../services/api'
import MetadataEditor from '../metadata/MetadataEditor'
import { X } from 'lucide-react'

interface ProjectMetadataPanelProps {
  project: Project
  onClose: () => void
  className?: string
}

const ProjectMetadataPanel: React.FC<ProjectMetadataPanelProps> = ({ project, onClose, className = '' }) => {
  const [activeField, setActiveField] = useState<string>('synopsis')

  // 项目元数据字段定义（与后端白名单一致；章节规划使用单独入口）
  const metadataFields = [
    { key: 'synopsis', label: '项目梗概', required: true },
    { key: 'characters', label: '人物设定', required: false },
    { key: 'timeline', label: '时间线', required: false },
    { key: 'settings', label: '世界观/设定', required: false },
    { key: 'relationships', label: '关系网', required: false },
    { key: 'plotStructure', label: '情节结构', required: false },
  ]

  return (
    <div className={`fixed inset-0 z-50 flex ${className}`}>
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black bg-opacity-30" onClick={onClose} />

      {/* 右侧抽屉 */}
      <div className="relative ml-auto h-full w-[28rem] bg-gray-50 border-l shadow-xl flex flex-col">
        {/* 顶部工具栏 */}
        <div className="flex items-center justify-between p-3 border-b bg-white">
          <div className="min-w-0">
            <h2 className="font-semibold text-gray-900 truncate">项目元数据</h2>
            <div className="text-xs text-gray-500 truncate">{project.title}</div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded"
            title="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 元数据字段导航 */}
        <div className="border-b bg-white">
          <div className="flex flex-wrap gap-1 p-2">
            {metadataFields.map((field) => (
              <button
                key={field.key}
                onClick={() => setActiveField(field.key)}
                className={`px-2.5 py-1 text-sm rounded border transition-colors ${
                  activeField === field.key
                    ? 'bg-blue-50 text-blue-700 border-blue-300'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'
                }`}
              >
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </button>
            ))}
          </div>
        </div>

        {/* 元数据编辑器 */}
        <div className="flex-1 overflow-hidden">
          {metadataFields.find((f) => f.key === activeField) && (
            <MetadataEditor
              type="project"
              entityId={project.id}
              field={activeField}
              required={metadataFields.find((f) => f.key === activeField)?.required}
              className="h-full"
            />
          )}
        </div>

        {/* 底部提示 */}
        <div className="p-3 border-t bg-white">
          <div className="text-xs text-gray-500 space-y-1">
            <p>💡 快速保存：点击“保存”按钮即时保存当前内容</p>
            <p>📦 版本管理：点击“保存版本”添加说明并保存历史记录</p>
            <p>🔄 版本恢复：点击“版本历史”查看并恢复之前的版本</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectMetadataPanel
