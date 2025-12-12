import React, { useState, useEffect } from 'react'
import { projectsApi, chaptersApi } from '../../services/api'
import { useNotifications } from '../../hooks/useNotifications'

interface MetadataEditorProps {
  type: 'project' | 'chapter'
  entityId: string
  field: string
  initialValue?: string
  required?: boolean
  onSave?: (content: string) => void
  className?: string
}

interface SavedVersion {
  id: string
  content: string
  timestamp: string
  userNote: string
  autoSaved: boolean
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
  const [showVersionDialog, setShowVersionDialog] = useState(false)
  const [versionNote, setVersionNote] = useState('')
  const [versions, setVersions] = useState<SavedVersion[]>([])
  const [showVersions, setShowVersions] = useState(false)
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
        const item = await api.getMetadata(entityId, field)
        if (!canceled) {
          setContent(item?.current || '')
          if (item?.lastModified) setLastSaved(new Date(item.lastModified))
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

  // 加载版本历史
  const loadVersions = async () => {
    try {
      const api = type === 'project' ? projectsApi : chaptersApi
      const data = await api.getMetadataVersions(entityId, field)
      setVersions(data)
    } catch (error) {
      console.error('Failed to load versions:', error)
    }
  }

  // 自动保存(快速保存)
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

  // 保存版本(手动保存版本)
  const handleSaveVersion = async () => {
    if (!content.trim() && required) {
      notifyWarning('必填项为空', `${field} 是必填项，不能为空`)
      return
    }

    setIsSaving(true)
    try {
      const api = type === 'project' ? projectsApi : chaptersApi
      await api.saveMetadataVersion(entityId, field, content, versionNote, false)
      setLastSaved(new Date())
      setShowVersionDialog(false)
      setVersionNote('')
      notifySuccess('版本已保存', '版本保存成功')
      await loadVersions()
      onSave?.(content)
    } catch (error) {
      console.error('Save version failed:', error)
      notifyError('保存版本失败', '请稍后重试')
    } finally {
      setIsSaving(false)
    }
  }

  // 恢复历史版本
  const handleRestoreVersion = (version: SavedVersion) => {
    setContent(version.content)
    setShowVersions(false)
    notifySuccess('已恢复版本', `恢复到 ${new Date(version.timestamp).toLocaleString()} 的版本`)
  }

  // 格式化时间
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-CN')
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
              最后保存: {formatTime(lastSaved.toISOString())}
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
          <button
            onClick={() => setShowVersionDialog(true)}
            className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
          >
            保存版本
          </button>
          <button
            onClick={async () => {
              await loadVersions()
              setShowVersions(!showVersions)
            }}
            className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            {showVersions ? '隐藏历史' : '版本历史'}
          </button>
        </div>
      </div>

      {/* 编辑区域 */}
      <div className="flex-1 flex overflow-hidden">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={`请输入${field}内容...`}
          className="flex-1 p-4 font-mono text-sm resize-none focus:outline-none"
          style={{ minHeight: '200px' }}
        />

        {/* 版本历史侧边栏 */}
        {showVersions && (
          <div className="w-80 border-l bg-gray-50 overflow-y-auto">
            <div className="p-3 border-b bg-white">
              <h3 className="font-medium text-gray-900">版本历史</h3>
              <p className="text-xs text-gray-500 mt-1">共 {versions.length} 个版本</p>
            </div>
            <div className="divide-y">
              {versions.length === 0 ? (
                <div className="p-4 text-center text-gray-400 text-sm">暂无保存的版本</div>
              ) : (
                versions.map(version => (
                  <div key={version.id} className="p-3 hover:bg-gray-100">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-xs text-gray-500">{formatTime(version.timestamp)}</div>
                        {version.userNote && (
                          <div className="text-sm text-gray-700 mt-1">{version.userNote}</div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          {version.content.trim().split(/\s+/).length} 字
                        </div>
                      </div>
                      <button
                        onClick={() => handleRestoreVersion(version)}
                        className="ml-2 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        恢复
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* 保存版本对话框 */}
      {showVersionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h3 className="text-lg font-medium mb-4">保存版本</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">版本说明</label>
              <input
                type="text"
                value={versionNote}
                onChange={e => setVersionNote(e.target.value)}
                placeholder="例如: 调整主线情节走向"
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">建议填写版本说明，方便后续查找和恢复</p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowVersionDialog(false)
                  setVersionNote('')
                }}
                className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSaveVersion}
                disabled={isSaving}
                className="px-4 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
              >
                {isSaving ? '保存中...' : '确认保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MetadataEditor
