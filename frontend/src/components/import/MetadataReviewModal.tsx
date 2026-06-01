import React, { useState, useEffect } from 'react'
import { projectsApi } from '../../services/api'
import { IconCheckCircle, IconClose, IconInfo, IconLoading } from '../ui/icons'

interface MetadataReviewModalProps {
  isOpen: boolean
  projectId: string
  projectTitle: string
  extractedMetadata: any
  onConfirm: () => void
  onReject: () => void
  onClose: () => void
}

export const MetadataReviewModal: React.FC<MetadataReviewModalProps> = ({
  isOpen,
  projectId,
  projectTitle,
  extractedMetadata,
  onConfirm,
  onReject,
  onClose
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editedMetadata, setEditedMetadata] = useState<any>(extractedMetadata || {})


  // 同步 extractedMetadata 到 editedMetadata
  useEffect(() => {
    if (extractedMetadata) {
      setEditedMetadata(extractedMetadata)
    }
  }, [extractedMetadata])

  if (!isOpen) return null

  const handleFieldChange = (key: string, value: string) => {
    setEditedMetadata((prev: any) => ({
      ...prev,
      [key]: value
    }))

  }

  const handleConfirm = async () => {
    setLoading(true)
    setError(null)
    try {
      // 始终传递编辑后的元数据，确保后端能收到数据，即使 _draft 丢失
      await projectsApi.confirmMetadata(projectId, true, editedMetadata)
      onConfirm()
    } catch (e: any) {
      const errorMessage = e.response?.data?.error?.message 
        || e.response?.data?.error 
        || e.message 
        || '确认失败'
      setError(errorMessage)
      console.error('Confirm metadata error:', e.response?.status, errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    setLoading(true)
    setError(null)
    try {
      await projectsApi.confirmMetadata(projectId, false)
      onReject()
    } catch (e: any) {
      const errorMessage = e.response?.data?.error?.message 
        || e.response?.data?.error 
        || e.message 
        || '操作失败'
      setError(errorMessage)
      console.error('Reject metadata error:', e.response?.status, errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // 元数据字段映射
  const metadataFields = [
    { key: 'synopsis', label: '作品梗概', icon: '📖' },
    { key: 'characters', label: '人物设定', icon: '👥' },
    { key: 'worldBuilding', label: '作品设定', icon: '🌍' },
    { key: 'plotStructure', label: '情节结构', icon: '📊' },
    { key: 'themes', label: '主题思想', icon: '💡' },
    { key: 'writingStyle', label: '写作风格', icon: '✍️' },
    { key: 'author', label: '作者', icon: '👤' },
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
          <div className="flex items-center gap-3 mb-2">
            <IconInfo size={28} />
            <h2 className="text-2xl font-bold">AI 提取的元数据待确认</h2>
          </div>
          <p className="text-purple-100 text-sm">
            《{projectTitle}》- AI 已自动分析内容并提取元数据，请仔细审阅后确认
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <IconClose className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-red-700">{error}</div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <IconInfo className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">重要提示</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>元数据是 AI 写作和审阅的"宪法"，请仔细审阅</li>
                  <li>确认后，这些元数据将成为所有 AI 功能的核心约束</li>
                  <li>您可以稍后在项目元数据面板中修改</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Metadata Fields */}
          <div className="space-y-4">
            {metadataFields.map(field => {
              const rawValue = editedMetadata?.[field.key]
              // 如果是对象，转换为格式化的 JSON 字符串
              let value = ''
              if (typeof rawValue === 'object' && rawValue !== null) {
                value = JSON.stringify(rawValue, null, 2)
              } else if (typeof rawValue === 'string') {
                value = rawValue
              } else {
                value = rawValue ? String(rawValue) : ''
              }

              return (
                <div key={field.key} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center gap-2">
                    <span className="text-xl">{field.icon}</span>
                    <span className="font-semibold text-gray-800">{field.label}</span>
                    {value && (
                      <span className="ml-auto text-xs text-gray-500">
                        {value.length} 字
                      </span>
                    )}
                  </div>
                  <div className="p-4 bg-white">
                    <textarea
                      value={value}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y text-gray-700"
                      placeholder={`请输入${field.label}...`}
                    />
                  </div>
                </div>
              )
            })}
          </div>

        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            稍后处理
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={handleReject}
              disabled={loading}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <IconLoading size={18} className="animate-spin" />
              ) : (
                <IconClose size={18} />
              )}
              拒绝元数据
            </button>
            
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg"
            >
              {loading ? (
                <IconLoading size={18} className="animate-spin" />
              ) : (
                <IconCheckCircle size={18} />
              )}
              确认并保存
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MetadataReviewModal
