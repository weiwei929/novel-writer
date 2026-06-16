import React, { useState, useEffect } from 'react'
import { projectsApi, chaptersApi } from '../../services/api'
import { useNotifications } from '../../hooks/useNotifications'
import { getWorkSynopsis } from '../../utils/workSynopsis'

interface MetadataEditorProps {
  type: 'project' | 'chapter'
  entityId: string
  field: string
  initialValue?: string
  required?: boolean
  onSave?: (content: string) => void
  className?: string
}

const MetadataEditor: React.FC<MetadataEditorProps> = ({
  type,
  entityId,
  field,
  initialValue = '',
  required = false,
  onSave,
  className = '',
}) => {
  const { success: notifySuccess, error: notifyError, warning: notifyWarning } = useNotifications()
  const [content, setContent] = useState(initialValue)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [wordCount, setWordCount] = useState(0)

  // 计算字数
  useEffect(() => {
    const count = content.trim() ? content.trim().split(/\s+/).length : 0
    setWordCount(count)
  }, [content])

  // 加载初始值
  useEffect(() => {
    setContent(initialValue)
  }, [initialValue])

  // 拉取当前已保存值
  useEffect(() => {
    let canceled = false
    const loadCurrent = async () => {
      try {
        const api = type === 'project' ? projectsApi : chaptersApi
        const item = await api.getById(entityId)
        if (!canceled) {
          const metadata = item.metadata || {}
          // 特殊处理：对于章节的 synopsis 字段，从 summary 读取
          let content = ''
          if (type === 'chapter' && field === 'synopsis') {
            content = (item as any).summary || metadata[field] || ''
          } else if (type === 'project' && field === 'synopsis') {
            content = getWorkSynopsis(
              (item as { description?: string | null }).description,
              metadata as Record<string, unknown>,
            )
          } else {
            content = metadata[field] || ''
          }
          setContent(content)
          if (item.updatedAt) setLastSaved(new Date(item.updatedAt))
        }
      } catch (error) {
        console.warn('Load metadata current failed:', error)
        if (!canceled) {
          notifyWarning('加载元数据失败', '未能加载已保存内容，可继续编辑后保存')
        }
      }
    }
    loadCurrent()
    return () => {
      canceled = true
    }
  }, [type, entityId, field])

  // 保存元数据
  const handleQuickSave = async () => {
    if (!content.trim() && required) {
      notifyWarning('必填项为空', `${field} 是必填项，不能为空`)
      return
    }

    setIsSaving(true)
    try {
      const api = type === 'project' ? projectsApi : chaptersApi
      await api.updateMetadata(entityId, field, content)
      setLastSaved(new Date())
      onSave?.(content)
      notifySuccess('已保存', `${field} 已保存`)
    } catch (error) {
      console.error('Save failed:', error)
      notifyError('保存失败', '保存失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }



  return (
    <div className={`metadata-editor flex flex-col ${className}`}>
      {/* 顶部工具栏 */}
      <div className="toolbar flex items-center justify-between p-2 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">
            {field} {required && <span className="text-red-500">*</span>}
          </span>
          <span className="text-xs text-gray-500">{wordCount} 字</span>
          {lastSaved && (
            <span className="text-xs text-gray-400">
              最后保存: {lastSaved.toLocaleString('zh-CN')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleQuickSave}
            disabled={isSaving}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
          >
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      {/* 编辑区域 */}
      <div className="flex-1 overflow-auto">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={`请输入${field}内容...`}
          spellCheck={false}
          className="w-full h-full min-h-[300px] p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  )
}

export default MetadataEditor
