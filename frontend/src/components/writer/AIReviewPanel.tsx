import React, { useState, useEffect } from 'react'
import { X, Loader } from 'lucide-react'
import { aiApi } from '../../services/api'
import { ReviewReport, ReviewIssue } from '../../types/ai'

interface AIReviewPanelProps {
  onClose: () => void
  content: string
  onApplyFix?: (issue: ReviewIssue) => void
}

const AIReviewPanel: React.FC<AIReviewPanelProps> = ({ onClose, content }) => {
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState<ReviewReport | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    generateReview()
  }, [])

  const generateReview = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await aiApi.reviewChapter(content)
      if (res.success && res.data) {
        setReport(res.data)
      } else {
        setError(res.error?.message || '生成审阅报告失败')
      }
    } catch (err) {
      setError('网络请求失败')
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      typo: '错别字',
      grammar: '语法',
      logic: '逻辑',
      style: '润色'
    }
    return map[type] || type
  }

  return (
    <div className="w-80 h-full bg-white border-l border-gray-200 flex flex-col shadow-xl">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
           <span>🔍 AI 审阅官</span>
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded text-gray-500">
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading && (
          <div className="flex flex-col items-center justify-center h-40 space-y-3">
             <Loader className="animate-spin text-blue-500" size={32} />
             <p className="text-gray-500 text-sm">正在深度审阅全文...</p>
          </div>
        )}

        {error && (
           <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
              {error}
              <button onClick={generateReview} className="block mt-2 text-blue-600 hover:underline">重试</button>
           </div>
        )}

        {report && (
          <div className="space-y-6">
             {/* Score Card */}
             <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                <div className="text-3xl font-bold text-indigo-600">{report.overallScore} <span className="text-base font-normal text-gray-500">/ 10</span></div>
                <div className="text-sm text-gray-600 mt-2">{report.overallComment}</div>
             </div>

             {/* Issues List */}
             <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center justify-between">
                   <span>发现问题 ({report.issues.length})</span>
                   <span className="text-xs font-normal text-gray-400">点击定位</span>
                </h4>
                <div className="space-y-3">
                   {report.issues.map(issue => (
                      <div key={issue.id} className={`p-3 rounded-lg border text-sm ${getSeverityColor(issue.severity)} hover:shadow-md transition-shadow cursor-pointer relative group`}>
                          <div className="flex items-start justify-between mb-1">
                             <span className="font-bold text-xs uppercase tracking-wider opacity-80">{getTypeLabel(issue.type)}</span>
                          </div>
                          
                          <div className="mb-2">
                             <div className="text-gray-500 line-through text-xs mb-0.5">{issue.originalText}</div>
                             <div className="font-semibold">{issue.suggestion}</div>
                          </div>
                          
                          <div className="text-xs opacity-75 mt-1 border-t border-black/5 pt-1">
                             💡 {issue.explanation}
                          </div>
                          
                          {/* Hover Actions (Mock) */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             {/* Future: Add 'Apply' button if applying directly is supported */}
                          </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AIReviewPanel
