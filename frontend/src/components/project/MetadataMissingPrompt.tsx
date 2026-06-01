import React, { useState } from 'react'
import { projectsApi } from '../../services/api'
import { useNotifications } from '../../hooks/useNotifications'
import { IconInfo, IconSparkles } from '../ui/icons'

interface MetadataMissingPromptProps {
  projectId: string
  onAIStarted: () => void
  onDismiss: () => void
}

export const MetadataMissingPrompt: React.FC<MetadataMissingPromptProps> = ({
  projectId,
  onAIStarted,
  onDismiss
}) => {
  const [loading, setLoading] = useState(false)
  const { error, info } = useNotifications()
  
  const handleAIExtract = async () => {
    setLoading(true)
    try {
      await projectsApi.extractMetadata(projectId)
      info('AI 正在分析...', '请稍候，这可能需要几秒钟')
      onAIStarted()
    } catch (e: any) {
      error('AI 分析失败', e.message)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <IconInfo className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
        <div className="flex-1">
          <h4 className="font-medium text-yellow-800">元数据缺失</h4>
          <p className="text-sm text-yellow-700 mt-1">
            该项目尚未设置元数据（故事简介、角色、时间线等）。
            您可以选择让 AI 协助分析并生成，或稍后手动填写。
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button 
            onClick={handleAIExtract}
            disabled={loading}
            className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <IconSparkles size={16} />
            {loading ? '分析中...' : '启动 AI 协助'}
          </button>
          <button 
            onClick={onDismiss}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            稍后填写
          </button>
        </div>
      </div>
    </div>
  )
}

export default MetadataMissingPrompt
