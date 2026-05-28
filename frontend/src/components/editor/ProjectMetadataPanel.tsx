import React, { useEffect, useState } from 'react'
import { Project, projectsApi } from '../../services/api'
import MetadataEditor from '../metadata/MetadataEditor'
import { X, Bot } from 'lucide-react'
import { AIMetadataAssistant } from '../ai/AIMetadataAssistant'

interface ProjectMetadataPanelProps {
  project: Project
  onClose: () => void
  className?: string
  initialField?: string
  initialMode?: 'view' | 'edit' | 'view_all'
}

const ProjectMetadataPanel: React.FC<ProjectMetadataPanelProps> = ({
  project,
  onClose,
  className = '',
  initialField,
  initialMode,
}) => {
  const [activeField, setActiveField] = useState<string>(initialField || 'synopsis')
  const [mode, setMode] = useState<'view' | 'edit' | 'view_all'>(initialMode || 'view')
  const [preview, setPreview] = useState<{
    current: string
    lastModified?: string
    wordCount?: number
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [previewsAll, setPreviewsAll] = useState<
    Record<string, { current: string; lastModified?: string; wordCount?: number } | null>
  >({})
  
  // AI 元数据助手状态
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const [aiAssistantField, setAiAssistantField] = useState<string>('')
  const [aiExistingContent, setAiExistingContent] = useState<string>('')  // AI 助手的现有内容

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
      projectsApi
        .getById(project.id)
        .then(res => {
          const metadata = res.metadata || {}
          setPreview({
            current: metadata[activeField] || '',
            lastModified: res.updatedAt,
            wordCount: undefined,
          })
        })
        .catch(() => setPreview(null))
        .finally(() => setLoading(false))
    }
  }, [project.id, activeField, mode])

  useEffect(() => {
    if (mode === 'view_all') {
      setLoading(true)
      projectsApi
        .getById(project.id)
        .then(res => {
          const metadata = res.metadata || {}
          const map: Record<
            string,
            { current: string; lastModified?: string; wordCount?: number } | null
          > = {}
          metadataFields.forEach(f => {
            map[f.key] = {
              current: metadata[f.key] || '',
              lastModified: res.updatedAt,
              wordCount: undefined,
            }
          })
          setPreviewsAll(map)
        })
        .catch(() => setPreviewsAll({}))
        .finally(() => setLoading(false))
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
            <h2 className="font-semibold text-gray-900 truncate">作品元数据</h2>
            <div className="text-xs text-gray-500 truncate">{project.title}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className={`px-2 py-1 text-xs border rounded ${mode === 'view' ? 'bg-gray-50' : ''}`}
              onClick={() => setMode('view')}
            >
              预览
            </button>
            <button
              className={`px-2 py-1 text-xs border rounded ${mode === 'view_all' ? 'bg-gray-50' : ''}`}
              onClick={() => setMode('view_all')}
            >
              预览全部
            </button>
            <button
              className={`px-2 py-1 text-xs border rounded ${mode === 'edit' ? 'bg-gray-50' : ''}`}
              onClick={() => setMode('edit')}
            >
              编辑
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded" title="关闭">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 元数据字段导航 */}
        <div className="border-b bg-white">
          <div className="flex flex-wrap gap-1 p-2">
            {metadataFields.map(field => (
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
          
          {/* AI 辅助按钮 - 在编辑模式显示 */}
          {mode === 'edit' && (
            <div className="px-2 pb-2">
              <button
                onClick={async () => {
                  setAiAssistantField(activeField)
                  // 获取现有内容
                  try {
                    const res = await projectsApi.getById(project.id)
                    const metadata = res.metadata || {}
                    setAiExistingContent(metadata[activeField] || '')
                  } catch (error) {
                    console.error('Failed to load existing content:', error)
                    setAiExistingContent('')
                  }
                  setShowAIAssistant(true)
                }}
                className="w-full px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Bot size={16} />
                AI 辅助构建/修改"{metadataFields.find(f => f.key === activeField)?.label}"
              </button>
            </div>
          )}
        </div>

        {/* 预览/编辑 */}
        <div className="flex-1 overflow-auto p-4">
          {mode === 'view' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">
                  {metadataFields.find(f => f.key === activeField)?.label}
                </h3>
                <button
                  className="px-2 py-1 text-sm border rounded hover:bg-gray-50"
                  onClick={() => setMode('edit')}
                >
                  编辑此字段
                </button>
              </div>
              {loading ? (
                <div className="text-gray-500 text-sm">加载中...</div>
              ) : (
                <div className="text-sm text-gray-800 whitespace-pre-wrap min-h-[120px] p-3 bg-white border rounded">
                  {preview?.current || '暂无内容'}
                </div>
              )}
              <div className="text-xs text-gray-500">
                {preview?.wordCount !== undefined && (
                  <span className="mr-3">字数：{preview.wordCount}</span>
                )}
                {preview?.lastModified && (
                  <span>更新于：{new Date(preview.lastModified).toLocaleString('zh-CN')}</span>
                )}
              </div>
            </div>
          ) : mode === 'view_all' ? (
            <div className="space-y-4">
              {loading ? (
                <div className="text-gray-500 text-sm">加载中...</div>
              ) : (
                metadataFields.map(f => (
                  <div key={f.key} className="p-3 bg-white border rounded">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">
                        {f.label}
                        {f.required && <span className="text-red-500 ml-1">*</span>}
                      </h4>
                      <button
                        className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
                        onClick={() => {
                          setActiveField(f.key)
                          setMode('edit')
                        }}
                      >
                        编辑
                      </button>
                    </div>
                    <div className="mt-2 text-sm text-gray-800 whitespace-pre-wrap min-h-[80px]">
                      {previewsAll[f.key]?.current || '暂无内容'}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {previewsAll[f.key]?.wordCount !== undefined && (
                        <span className="mr-3">字数：{previewsAll[f.key]?.wordCount}</span>
                      )}
                      {previewsAll[f.key]?.lastModified && (
                        <span>
                          更新于：
                          {new Date(previewsAll[f.key]!.lastModified!).toLocaleString('zh-CN')}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            metadataFields.find(f => f.key === activeField) && (
              <MetadataEditor
                type="project"
                entityId={project.id}
                field={activeField}
                required={metadataFields.find(f => f.key === activeField)?.required}
                className="h-full"
              />
            )
          )}
        </div>

        {/* 底部提示 */}
        <div className="p-3 border-t bg-white">
          <div className="text-xs text-gray-500">
            <p>💡 点击"保存"按钮即时保存当前内容</p>
            <p>🤖 点击"AI 辅助"按钮，让 AI 帮助你构建元数据</p>
          </div>
        </div>
      </div>
      
      {/* AI 元数据助手 */}
      <AIMetadataAssistant
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        type="project"
        entityId={project.id}
        field={aiAssistantField}
        fieldLabel={metadataFields.find(f => f.key === aiAssistantField)?.label || ''}
        existingContent={aiExistingContent}  // 传递现有内容
        onSave={async (content) => {
          // 保存元数据
          await projectsApi.updateMetadata(project.id, aiAssistantField, content)
          // 刷新预览
          if (mode === 'view' && activeField === aiAssistantField) {
            const res = await projectsApi.getById(project.id)
            const metadata = res.metadata || {}
            setPreview({
              current: metadata[aiAssistantField] || '',
              lastModified: res.updatedAt,
            })
          }
        }}
      />
    </div>
  )
}

export default ProjectMetadataPanel
