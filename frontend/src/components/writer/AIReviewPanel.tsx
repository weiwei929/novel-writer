import React, { useState, useEffect } from 'react'
import { aiApi } from '../../services/api'
import { IconClose, IconLoading } from '../ui/icons'

interface AIReviewPanelProps {
  onClose: () => void
  content: string
  chapterId?: string
}

/** @experimental Blocker B1 — API returns Markdown; structured ReviewReport UI deferred */
const AIReviewPanel: React.FC<AIReviewPanelProps> = ({ onClose, content, chapterId }) => {
  const [loading, setLoading] = useState(true)
  const [reportText, setReportText] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    generateReview()
  }, [])

  const generateReview = async () => {
    if (!chapterId) {
      setError('缺少章节 ID，无法发起审阅（实验性功能）')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const res = await aiApi.reviewChapter(chapterId, content)
      if (res.success && res.data?.report) {
        setReportText(res.data.report)
      } else {
        setError(res.error?.message || '生成审阅报告失败')
      }
    } catch (err) {
      setError('网络请求失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-80 h-full bg-white border-l border-gray-200 flex flex-col shadow-xl">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
           <span>🔍 AI 审阅官</span>
           <span className="text-xs font-normal text-amber-600">实验性</span>
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded text-gray-500">
          <IconClose size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading && (
          <div className="flex flex-col items-center justify-center h-40 space-y-3">
             <IconLoading className="animate-spin text-blue-500" size={32} />
             <p className="text-gray-500 text-sm">正在深度审阅全文...</p>
          </div>
        )}

        {error && (
           <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
              {error}
              <button onClick={generateReview} className="block mt-2 text-blue-600 hover:underline">重试</button>
           </div>
        )}

        {reportText && (
          <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {reportText}
          </div>
        )}
      </div>
    </div>
  )
}

export default AIReviewPanel
