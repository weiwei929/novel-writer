import React, { useState } from 'react'
import { 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  Edit3, 
  Clock, 
  Target,
  CheckCircle,
  Circle,
  AlertCircle
} from 'lucide-react'
import { Chapter } from '../../services/api'

interface ChapterOutlineViewProps {
  chapters: Chapter[]
  currentChapterId?: string
  onChapterSelect: (chapter: Chapter) => void
  onChapterUpdate?: (chapterId: string, updates: Partial<Chapter>) => void
  className?: string
}

const ChapterOutlineView: React.FC<ChapterOutlineViewProps> = ({
  chapters,
  currentChapterId,
  onChapterSelect,
  onChapterUpdate,
  className = ''
}) => {
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set())
  const [editingChapter, setEditingChapter] = useState<string | null>(null)
  const [editingSummary, setEditingSummary] = useState('')

  const toggleChapterExpanded = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters)
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId)
    } else {
      newExpanded.add(chapterId)
    }
    setExpandedChapters(newExpanded)
  }

  const startEditingSummary = (chapter: Chapter) => {
    setEditingChapter(chapter.id)
    setEditingSummary(chapter.summary || '')
  }

  const saveSummary = async (chapterId: string) => {
    if (onChapterUpdate) {
      await onChapterUpdate(chapterId, { summary: editingSummary })
    }
    setEditingChapter(null)
    setEditingSummary('')
  }

  const cancelEditingSummary = () => {
    setEditingChapter(null)
    setEditingSummary('')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle size={16} className="text-green-500" />
      case 'completed':
        return <CheckCircle size={16} className="text-blue-500" />
      case 'draft':
        return <Circle size={16} className="text-gray-400" />
      default:
        return <AlertCircle size={16} className="text-orange-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published': return '已发布'
      case 'completed': return '已完成'
      case 'draft': return '草稿'
      default: return '待处理'
    }
  }

  const formatReadingTime = (wordCount: number) => {
    const minutes = Math.ceil(wordCount / 250)
    return minutes < 1 ? '< 1分钟' : `${minutes}分钟`
  }

  // 按状态分组章节
  const groupedChapters = React.useMemo(() => {
    const groups = {
      published: [] as Chapter[],
      completed: [] as Chapter[],
      draft: [] as Chapter[],
      other: [] as Chapter[]
    }

    chapters.forEach(chapter => {
      if (chapter.status === 'published') {
        groups.published.push(chapter)
      } else if (chapter.status === 'completed') {
        groups.completed.push(chapter)
      } else if (chapter.status === 'draft') {
        groups.draft.push(chapter)
      } else {
        groups.other.push(chapter)
      }
    })

    // 按order排序
    Object.values(groups).forEach(group => {
      group.sort((a, b) => a.order - b.order)
    })

    return groups
  }, [chapters])

  const renderChapterItem = (chapter: Chapter) => {
    const isExpanded = expandedChapters.has(chapter.id)
    const isCurrent = currentChapterId === chapter.id
    const isEditing = editingChapter === chapter.id

    return (
      <div key={chapter.id} className="border rounded-lg mb-2 overflow-hidden">
        <div
          className={`p-4 cursor-pointer transition-colors ${
            isCurrent 
              ? 'bg-blue-50 border-blue-200' 
              : 'hover:bg-gray-50'
          }`}
          onClick={() => onChapterSelect(chapter)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleChapterExpanded(chapter.id)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                
                <div className="flex items-center gap-2">
                  {getStatusIcon(chapter.status)}
                  <span className="font-medium text-gray-900">
                    第{chapter.order}章 {chapter.title}
                  </span>
                </div>
              </div>

              <div className="ml-7 flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <FileText size={14} />
                  <span>{chapter.wordCount?.toLocaleString() || 0} 字</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>{formatReadingTime(chapter.wordCount || 0)}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Target size={14} />
                  <span>{getStatusText(chapter.status)}</span>
                </div>
              </div>
            </div>

            {isCurrent && (
              <div className="text-xs text-blue-600 font-medium">当前章节</div>
            )}
          </div>
        </div>

        {/* 展开的详细信息 */}
        {isExpanded && (
          <div className="px-4 pb-4 bg-gray-50">
            <div className="border-t pt-4">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-medium text-gray-700">章节概要</h4>
                {!isEditing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      startEditingSummary(chapter)
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Edit3 size={14} />
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <textarea
                    value={editingSummary}
                    onChange={(e) => setEditingSummary(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:border-blue-500"
                    rows={3}
                    placeholder="输入章节概要..."
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveSummary(chapter.id)}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      保存
                    </button>
                    <button
                      onClick={cancelEditingSummary}
                      className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-600 leading-relaxed">
                  {chapter.summary || (
                    <span className="italic text-gray-400">点击编辑按钮添加章节概要...</span>
                  )}
                </div>
              )}

              {/* 章节元数据 */}
              <div className="mt-4 pt-3 border-t grid grid-cols-2 gap-4 text-xs text-gray-500">
                <div>创建时间：{new Date(chapter.createdAt).toLocaleDateString()}</div>
                <div>更新时间：{new Date(chapter.updatedAt).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderGroup = (title: string, chapters: Chapter[], icon: React.ReactNode) => {
    if (chapters.length === 0) return null

    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-700">
          {icon}
          <span>{title} ({chapters.length})</span>
        </div>
        <div className="space-y-2">
          {chapters.map(renderChapterItem)}
        </div>
      </div>
    )
  }

  return (
    <div className={`${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">章节大纲</h3>
        <p className="text-sm text-gray-600">
          共 {chapters.length} 个章节，{chapters.reduce((sum, c) => sum + (c.wordCount || 0), 0).toLocaleString()} 字
        </p>
      </div>

      <div className="space-y-4">
        {renderGroup(
          '已发布', 
          groupedChapters.published, 
          <CheckCircle size={16} className="text-green-500" />
        )}
        
        {renderGroup(
          '已完成', 
          groupedChapters.completed, 
          <CheckCircle size={16} className="text-blue-500" />
        )}
        
        {renderGroup(
          '草稿', 
          groupedChapters.draft, 
          <Circle size={16} className="text-gray-400" />
        )}
        
        {renderGroup(
          '其他', 
          groupedChapters.other, 
          <AlertCircle size={16} className="text-orange-500" />
        )}
      </div>

      {chapters.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <FileText size={48} className="mx-auto mb-4 text-gray-300" />
          <p>还没有章节</p>
          <p className="text-sm">创建第一个章节开始写作吧！</p>
        </div>
      )}
    </div>
  )
}

export default ChapterOutlineView