/**
 * ❌ DEPRECATED - 此组件已废弃
 * 
 * 原因：独立的大纲生成功能已重新设计
 * 替代方案：
 *   - 项目大纲 → AIMetadataAssistant 组件的"情节结构"字段
 *   - 章节大纲 → ChapterOutlineGenerator 组件（一次性生成所有章节）
 * 
 * 保留此文件仅作为 UI 设计参考
 */

import React, { useState } from 'react'
import { X, Bot, BookOpen, Sparkles, Download, RefreshCw } from 'lucide-react'
import { aiApi, chaptersApi } from '../../services/api'

interface OutlineGenerationModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  onImport: () => void
}

export const OutlineGenerationModal: React.FC<OutlineGenerationModalProps> = ({
  isOpen,
  onClose,
  projectId,
  onImport,
}) => {
  const [prompt, setPrompt] = useState('')
  const [outline, setOutline] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('请输入故事梗概')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await aiApi.generateOutline(projectId, prompt)
      if (response.success && response.data) {
        setOutline(response.data)
      } else {
        setError(response.error?.message || '大纲生成失败')
      }
    } catch (err: any) {
      setError(err.message || '大纲生成失败,请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!outline || !outline.acts) {
      setError('没有可导入的大纲')
      return
    }

    setImporting(true)
    setError(null)
    try {
      // Get current max order
      const existingChapters = await chaptersApi.getByProjectId(projectId)
      let order = existingChapters.length > 0 
        ? Math.max(...existingChapters.map(c => c.order)) + 1 
        : 1

      // Import chapters from outline
      for (const act of outline.acts) {
        if (act.chapters && Array.isArray(act.chapters)) {
          for (const chapter of act.chapters) {
            await chaptersApi.create({
              projectId,
              title: chapter.title || `第 ${order} 章`,
              content: chapter.summary || '',
              summary: chapter.summary,
              order: order++
            })
          }
        }
      }

      onImport()
      handleClose()
    } catch (err: any) {
      setError(err.message || '导入失败,请稍后重试')
    } finally {
      setImporting(false)
    }
  }

  const handleClose = () => {
    setPrompt('')
    setOutline(null)
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <BookOpen size={24} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">AI 大纲生成</h2>
              <p className="text-sm text-gray-500">输入故事梗概,AI 将为你生成完整大纲</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-white/50 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Input Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              故事梗概 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="例如: 一个关于星际探险的科幻故事,主角是一名宇航员,在执行任务时发现了外星文明的遗迹..."
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={loading}
            />
            <p className="mt-2 text-xs text-gray-500">
              💡 提示: 包含故事背景、主要角色、核心冲突等信息,大纲会更加完整
            </p>
          </div>

          {/* Generate Button */}
          {!outline && (
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  AI 正在构思中...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  生成大纲
                </>
              )}
            </button>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* Outline Display */}
          {outline && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Bot size={20} className="text-blue-600" />
                  生成的大纲
                </h3>
                <button
                  onClick={handleGenerate}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  disabled={loading}
                >
                  <RefreshCw size={16} />
                  重新生成
                </button>
              </div>

              {/* Outline Structure */}
              <div className="space-y-4">
                {outline.acts && outline.acts.map((act: any, actIndex: number) => (
                  <div key={actIndex} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">
                        {act.name || `第 ${actIndex + 1} 幕`}
                      </span>
                    </h4>
                    
                    {act.chapters && act.chapters.length > 0 && (
                      <div className="space-y-2 ml-4">
                        {act.chapters.map((chapter: any, chapterIndex: number) => (
                          <div key={chapterIndex} className="bg-white p-3 rounded border border-gray-100">
                            <div className="font-medium text-gray-900 mb-1">
                              {chapter.title || `第 ${chapterIndex + 1} 章`}
                            </div>
                            {chapter.summary && (
                              <p className="text-sm text-gray-600">{chapter.summary}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Raw JSON (collapsible) */}
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                  查看完整 JSON 数据
                </summary>
                <pre className="mt-2 p-4 bg-gray-900 text-green-400 rounded-lg text-xs overflow-x-auto">
                  {JSON.stringify(outline, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
          >
            取消
          </button>
          {outline && (
            <button
              onClick={handleImport}
              disabled={importing}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {importing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  导入中...
                </>
              ) : (
                <>
                  <Download size={18} />
                  导入为章节
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
