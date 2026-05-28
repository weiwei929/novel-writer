import React, { useState } from 'react'
import { X, Bot, BookOpen, Download, Edit2, Check, AlertCircle } from 'lucide-react'
import { aiApi, chaptersApi } from '../../services/api'

interface ChapterOutlineGeneratorProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  onSuccess: () => void
}

interface ChapterItem {
  order: number
  title: string
  synopsis: string
}

interface OutlineData {
  chapters: ChapterItem[]
  structure?: {
    opening: string
    development: string
    climax: string
    ending: string
  }
  keyChapters?: Array<{
    chapter: number
    type: string
    description: string
  }>
}

export const ChapterOutlineGenerator: React.FC<ChapterOutlineGeneratorProps> = ({
  isOpen,
  onClose,
  projectId,
  onSuccess,
}) => {
  const [chapterCount, setChapterCount] = useState(20)
  const [userRequirements, setUserRequirements] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [outline, setOutline] = useState<OutlineData | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editedChapters, setEditedChapters] = useState<ChapterItem[]>([])
  const [importing, setImporting] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await aiApi.generateChapterOutline({
        projectId,
        chapterCount,
        userRequirements: userRequirements.trim() || undefined,
      })

      if (response.success && response.data?.outline) {
        setOutline(response.data.outline)
        setEditedChapters(response.data.outline.chapters || [])
      } else {
        throw new Error(response.error?.message || '大纲生成失败')
      }
    } catch (err: any) {
      setError(err.message || '大纲生成失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleEditChapter = (index: number, field: 'title' | 'synopsis', value: string) => {
    const updated = [...editedChapters]
    updated[index] = { ...updated[index], [field]: value }
    setEditedChapters(updated)
  }

  const handleImport = async () => {
    if (!editedChapters || editedChapters.length === 0) {
      setError('没有可导入的章节')
      return
    }

    setImporting(true)
    setError(null)

    try {
      // 批量创建章节
      for (const chapter of editedChapters) {
        await chaptersApi.create({
          projectId,
          title: chapter.title,
          content: '',
          summary: chapter.synopsis,
          order: chapter.order,
        })
      }

      onSuccess()
      handleClose()
    } catch (err: any) {
      setError(err.message || '导入失败，请稍后重试')
    } finally {
      setImporting(false)
    }
  }

  const handleClose = () => {
    setChapterCount(20)
    setUserRequirements('')
    setOutline(null)
    setEditedChapters([])
    setEditingIndex(null)
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <BookOpen size={24} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">AI 章节大纲生成</h2>
              <p className="text-sm text-gray-500">基于项目元数据，一次性生成完整的章节规划</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-white/50 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* 左侧：输入区域 */}
          {!outline && (
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="max-w-2xl mx-auto space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    章节数量 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={chapterCount}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1
                      if (value > 50) {
                        setError('章节数量不能超过 50 章，建议拆分为多部作品（上、中、下或续集）')
                        setChapterCount(50)
                      } else {
                        setChapterCount(Math.max(1, value))
                        setError(null)
                      }
                    }}
                    min="1"
                    max="50"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    建议：短篇 10-20 章，中篇 20-35 章，长篇 35-50 章
                  </p>
                  <p className="mt-1 text-xs text-orange-600">
                    ⚠️ 超过 50 章请拆分为多部作品（上、中、下或续集）
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    额外要求（可选）
                  </label>
                  <textarea
                    value={userRequirements}
                    onChange={(e) => setUserRequirements(e.target.value)}
                    placeholder="例如：希望前三章节奏快一些，重点刻画主角的成长弧..."
                    className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    disabled={loading}
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 transition-all"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      AI 正在构思中...
                    </>
                  ) : (
                    <>
                      <Bot size={20} />
                      生成章节大纲
                    </>
                  )}
                </button>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                  <p className="font-semibold mb-2">⚠️ 重要提示</p>
                  <ul className="space-y-1 text-xs">
                    <li>• AI 将基于项目元数据（梗概、人物、世界观等）生成大纲</li>
                    <li>• 生成后可以编辑每个章节的标题和梗概</li>
                    <li>• 确认无误后，点击"导入为章节"批量创建</li>
                    <li>• 建议先完善项目元数据，再生成大纲</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* 右侧：大纲预览 */}
          {outline && (
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">生成的大纲（共 {editedChapters.length} 章）</h3>
                <button
                  onClick={handleGenerate}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  disabled={loading}
                >
                  <Bot size={16} />
                  重新生成
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {/* 结构信息 */}
                {outline.structure && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">📖 故事结构</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="font-medium">开端：</span>{outline.structure.opening}</div>
                      <div><span className="font-medium">发展：</span>{outline.structure.development}</div>
                      <div><span className="font-medium">高潮：</span>{outline.structure.climax}</div>
                      <div><span className="font-medium">结局：</span>{outline.structure.ending}</div>
                    </div>
                  </div>
                )}

                {/* 章节列表 */}
                <div className="space-y-3">
                  {editedChapters.map((chapter, index) => {
                    const isKeyChapter = outline.keyChapters?.find(k => k.chapter === chapter.order)
                    const isEditing = editingIndex === index

                    return (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${
                          isKeyChapter
                            ? 'bg-yellow-50 border-yellow-300'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            {isEditing ? (
                              <input
                                type="text"
                                value={chapter.title}
                                onChange={(e) => handleEditChapter(index, 'title', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 font-medium"
                              />
                            ) : (
                              <h4 className="font-semibold text-gray-900">
                                第 {chapter.order} 章：{chapter.title}
                              </h4>
                            )}
                          </div>
                          <button
                            onClick={() => setEditingIndex(isEditing ? null : index)}
                            className="ml-2 p-1 hover:bg-gray-100 rounded"
                          >
                            {isEditing ? <Check size={16} className="text-green-600" /> : <Edit2 size={16} className="text-gray-500" />}
                          </button>
                        </div>

                        {isEditing ? (
                          <textarea
                            value={chapter.synopsis}
                            onChange={(e) => handleEditChapter(index, 'synopsis', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm min-h-[60px]"
                          />
                        ) : (
                          <p className="text-sm text-gray-600">{chapter.synopsis}</p>
                        )}

                        {isKeyChapter && (
                          <div className="mt-2 text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                            🔑 关键章节：{isKeyChapter.type} - {isKeyChapter.description}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 底部操作 */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                {error && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}
                
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {importing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      导入中...
                    </>
                  ) : (
                    <>
                      <Download size={18} />
                      导入为章节（{editedChapters.length} 章）
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
