import React, { useEffect, useState } from 'react'
import { Project, projectsApi } from '../../services/api'
import MetadataEditor from '../metadata/MetadataEditor'
import { X } from 'lucide-react'

interface ProjectMetadataPanelProps {
  project: Project
  onClose: () => void
  className?: string
  initialField?: string
  initialMode?: 'view' | 'edit' | 'view_all'
}

const ProjectMetadataPanel: React.FC<ProjectMetadataPanelProps> = ({ project, onClose, className = '', initialField, initialMode }) => {
  const [activeField, setActiveField] = useState<string>(initialField || 'synopsis')
  const [mode, setMode] = useState<'view' | 'edit' | 'view_all'>(initialMode || 'view')
  const [preview, setPreview] = useState<{ current: string; lastModified?: string; wordCount?: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [previewsAll, setPreviewsAll] = useState<Record<string, { current: string; lastModified?: string; wordCount?: number } | null>>({})

  // 项目元数据字段定义（与后端白名单一致；章节规划使用单独入口）
  const metadataFields = [
    { key: 'synopsis', label: '项目梗概', required: true },
    { key: 'characters', label: '人物设定', required: false },
    { key: 'timeline', label: '时间线', required: false },
    { key: 'settings', label: '世界观/设定', required: false },
    { key: 'relationships', label: '关系网', required: false },
    { key: 'plotStructure', label: '情节结构', required: false },
  ]

  useEffect(() => {
    if (mode === 'view' && activeField) {
      setLoading(true)
      projectsApi.getMetadata(project.id, activeField)
        .then((res) => setPreview({ current: res.current || '', lastModified: res.lastModified, wordCount: res.wordCount }))
        .catch(() => setPreview(null))
        .finally(() => setLoading(false))
    }
  }, [project.id, activeField, mode])

  useEffect(() => {
    if (mode === 'view_all') {
      setLoading(true)
      Promise.all(
        metadataFields.map(async (f) => {
          try {
            const res = await projectsApi.getMetadata(project.id, f.key)
            return { key: f.key, value: { current: res.current || '', lastModified: res.lastModified, wordCount: res.wordCount } }
          } catch {
            return { key: f.key, value: null }
          }
        })
      ).then((arr) => {
        const map: Record<string, { current: string; lastModified?: string; wordCount?: number } | null> = {}
        arr.forEach(({ key, value }) => { map[key] = value })
        setPreviewsAll(map)
      }).finally(() => setLoading(false))
    }
  }, [project.id, mode])

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
          <div className="flex items-center gap-2">
            <button className={`px-2 py-1 text-xs border rounded ${mode === 'view' ? 'bg-gray-50' : ''}`} onClick={() => setMode('view')}>预览</button>
            <button className={`px-2 py-1 text-xs border rounded ${mode === 'view_all' ? 'bg-gray-50' : ''}`} onClick={() => setMode('view_all')}>预览全部</button>
            <button className={`px-2 py-1 text-xs border rounded ${mode === 'edit' ? 'bg-gray-50' : ''}`} onClick={() => setMode('edit')}>编辑</button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded"
              title="关闭"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
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

        {/* 预览/编辑 */}
        <div className="flex-1 overflow-auto p-4">
          {mode === 'view' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">{metadataFields.find(f => f.key === activeField)?.label}</h3>
                <button className="px-2 py-1 text-sm border rounded hover:bg-gray-50" onClick={() => setMode('edit')}>编辑此字段</button>
              </div>
              {loading ? (
                <div className="text-gray-500 text-sm">加载中...</div>
              ) : (
                <div className="text-sm text-gray-800 whitespace-pre-wrap min-h-[120px] p-3 bg-white border rounded">
                  {preview?.current || '暂无内容'}
                </div>
              )}
              <div className="text-xs text-gray-500">
                {preview?.wordCount !== undefined && <span className="mr-3">字数：{preview.wordCount}</span>}
                {preview?.lastModified && <span>更新于：{new Date(preview.lastModified).toLocaleString('zh-CN')}</span>}
              </div>
            </div>
          ) : mode === 'view_all' ? (
            <div className="space-y-4">
              {loading ? (
                <div className="text-gray-500 text-sm">加载中...</div>
              ) : (
                metadataFields.map((f) => (
                  <div key={f.key} className="p-3 bg-white border rounded">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">{f.label}{f.required && <span className="text-red-500 ml-1">*</span>}</h4>
                      <button className="px-2 py-1 text-xs border rounded hover:bg-gray-50" onClick={() => { setActiveField(f.key); setMode('edit') }}>编辑</button>
                    </div>
                    <div className="mt-2 text-sm text-gray-800 whitespace-pre-wrap min-h-[80px]">
                      {previewsAll[f.key]?.current || '暂无内容'}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {previewsAll[f.key]?.wordCount !== undefined && <span className="mr-3">字数：{previewsAll[f.key]?.wordCount}</span>}
                      {previewsAll[f.key]?.lastModified && <span>更新于：{new Date(previewsAll[f.key]!.lastModified!).toLocaleString('zh-CN')}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            metadataFields.find((f) => f.key === activeField) && (
              <MetadataEditor
                type="project"
                entityId={project.id}
                field={activeField}
                required={metadataFields.find((f) => f.key === activeField)?.required}
                className="h-full"
              />
            )
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
