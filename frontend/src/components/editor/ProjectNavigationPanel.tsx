import React, { useState } from 'react'
import { Project, Chapter } from '../../services/api'
import { FileText, Settings, BookOpen, ChevronDown } from 'lucide-react'
import { useNotifications } from '../../hooks/useNotifications'
import { readMetadataFieldValue } from '../../utils/metadataField'
import ChapterPlanningEditor from './ChapterPlanningEditor'

interface ProjectNavigationPanelProps {
  project: Project
  chapters: Chapter[]
  currentChapter: Chapter | null
  onChapterSelect: (chapter: Chapter) => void
  onProjectSettings?: (field?: string) => void
  onChaptersRefresh?: () => void
  className?: string
}

const ProjectNavigationPanel: React.FC<ProjectNavigationPanelProps> = ({
  project,
  chapters,
  currentChapter,
  onChapterSelect,
  onProjectSettings,
  onChaptersRefresh,
  className = '',
}) => {
  const { success: notifySuccess } = useNotifications()
  const [showPlanning, setShowPlanning] = useState(false)
  const [expandedSynopsisId, setExpandedSynopsisId] = useState<string | null>(null)

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  // 获取状态文本
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      draft: '草稿',
      writing: '创作中',
      completed: '已完成',
      published: '已发布',
      archived: '已归档',
    }
    return statusMap[status] || status
  }

  return (
    <div className={`w-80 h-full bg-gray-100 flex flex-col overflow-hidden ${className}`}>
      {/* 作品基本信息（合入原顶部工具栏功能） */}
      <div className="p-4 border-b border-gray-300 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-lg text-gray-900 truncate flex-1">{project.title}</h3>
          <div className="flex items-center gap-0.5 shrink-0 ml-2">
            {onProjectSettings && (
              <button
                onClick={() => onProjectSettings()}
                className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded text-xs text-gray-500"
                title="元数据设置"
              >
                <Settings size={14} />
                <span>元数据</span>
              </button>
            )}
          </div>
        </div>
        
        {/* 紧凑状态行 */}
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
          <span>{project.wordCount.toLocaleString()} 字</span>
          <span className="text-gray-300">·</span>
          <span>{chapters.length} 章</span>
          <span className="text-gray-300">·</span>
          <span>{getStatusText(project.status)}</span>
        </div>

        {/* 作品梗概 */}
        {(() => {
          const synopsis = readMetadataFieldValue(project.metadata?.synopsis)
          if (!synopsis) return null
          return (
            <div className="border border-gray-100 rounded-lg bg-gray-50/50 overflow-hidden">
              <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-gray-100 text-xs text-gray-500">
                <BookOpen size={12} />
                作品梗概
              </div>
              <div className="px-3 py-2 text-xs text-gray-700 leading-relaxed max-h-40 overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                {synopsis}
              </div>
            </div>
          )
        })()}
      </div>

      {/* 章节管理分隔 */}
      <div className="px-3 py-2 border-t border-b border-gray-300 bg-white">
        <button
          className="w-full px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
          onClick={() => setShowPlanning(true)}>
          管理章节规划
        </button>
      </div>

      {/* 章节列表 */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y">
          {chapters.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>暂无章节</p>
            </div>
          ) : (
            chapters.map(chapter => {
              const isActive = currentChapter?.id === chapter.id
              const hasSynopsis = !!(chapter.summary && chapter.summary.trim())
              const isSynopsisOpen = expandedSynopsisId === chapter.id
              return (
                <button
                  key={chapter.id}
                  onClick={() => onChapterSelect(chapter)}
                  className={`w-full text-left p-3 hover:bg-gray-100 transition-colors ${
                    isActive ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-500">
                          第 {chapter.order} 章
                        </span>
                        {hasSynopsis && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation()
                              setExpandedSynopsisId(isSynopsisOpen ? null : chapter.id)
                            }}
                            className={`inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                              isSynopsisOpen
                                ? 'bg-amber-100 text-amber-700'
                                : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                            }`}
                            title="章节梗概"
                          >
                            梗概
                            <ChevronDown
                              size={10}
                              className={`transition-transform ${isSynopsisOpen ? 'rotate-180' : ''}`}
                            />
                          </span>
                        )}
                        {chapter.status !== 'draft' && (
                          <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                            {getStatusText(chapter.status)}
                          </span>
                        )}
                      </div>
                      <h5
                        className={`font-medium truncate ${isActive ? 'text-blue-700' : 'text-gray-900'}`}
                      >
                        {chapter.title}
                      </h5>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>{chapter.wordCount.toLocaleString()} 字</span>
                        <span>{formatDate(chapter.updatedAt)}</span>
                      </div>
                      {/* 展开的梗概 */}
                      {isSynopsisOpen && hasSynopsis && (
                        <div
                          className="mt-2 border-t border-gray-100 pt-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="text-xs text-gray-600 leading-relaxed max-h-32 overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                            {chapter.summary}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* 底部提示 */}
      <div className="p-3 border-t bg-white text-xs text-gray-500 text-center">
        按顺序选择章节进行编辑
      </div>

      {showPlanning && (
        <ChapterPlanningEditor
          projectId={project.id}
          initialPlans={(project.metadata as any)?.chapterPlanning || []}
          onClose={() => setShowPlanning(false)}
          onSaved={() => {
            setShowPlanning(false)
            notifySuccess('章节规划已更新')
            onChaptersRefresh?.()
          }}
        />
      )}
    </div>
  )
}

export default ProjectNavigationPanel
