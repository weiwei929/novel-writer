import React, { useState } from 'react'
import { Project, Chapter } from '../../services/api'
import { ChevronRight, FileText, Settings } from 'lucide-react'
import { useNotifications } from '../../contexts/UIContext'
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
  className = ''
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { success: notifySuccess } = useNotifications()
  const [showPlanning, setShowPlanning] = useState(false)

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
      archived: '已归档'
    }
    return statusMap[status] || status
  }

  if (isCollapsed) {
    return (
      <div className={`w-12 border-r bg-gray-50 flex flex-col items-center py-4 ${className}`}>
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 hover:bg-gray-200 rounded"
          title="展开项目面板"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    )
  }

  return (
    <div className={`w-80 h-full bg-gray-100 flex flex-col overflow-hidden ${className}`}>
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-300 bg-white shadow-sm">
        <h2 className="font-semibold text-gray-900 truncate flex-1">项目导航</h2>
        <div className="flex items-center gap-1">
          {onProjectSettings && (
            <button
              onClick={() => onProjectSettings()}
              className="p-1.5 hover:bg-gray-100 rounded"
              title="项目设置"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 hover:bg-gray-100 rounded"
            title="收起面板"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 项目信息 */}
      <div className="p-4 border-b border-gray-300 bg-white shadow-sm">
        <h3 className="font-medium text-lg text-gray-900 mb-2">{project.title}</h3>
        <div className="space-y-1.5 text-sm text-gray-600">
          <div className="flex items-center justify-between">
            <span>作者:</span>
            <span className="font-medium">{project.author}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>状态:</span>
            <span className="font-medium">{getStatusText(project.status)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>字数:</span>
            <span className="font-medium">{project.wordCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>章节:</span>
            <span className="font-medium">{project.chapterCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>创建时间:</span>
            <span className="text-xs">{formatDate(project.createdAt)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>更新时间:</span>
            <span className="text-xs">{formatDate(project.updatedAt)}</span>
          </div>
        </div>

        {/* 章节规划入口（始终可见） */}
        <div className="mt-3 p-3 bg-gray-50 rounded">
          <div className="font-medium text-gray-700 mb-2">章节规划</div>
          <button
            className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => setShowPlanning(true)}
          >
            管理章节规划
          </button>
        </div>
      </div>

      {/* 章节列表 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 border-b bg-white flex items-center justify-between">
          <h4 className="font-medium text-sm text-gray-700">章节列表</h4>
          {/* 已移除“+”新建入口，统一通过“管理章节规划”进行新建/规划 */}
        </div>

        <div className="divide-y">
          {chapters.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>暂无章节</p>
              {/* 取消空状态下的新建按钮入口 */}
            </div>
          ) : (
            chapters.map((chapter) => {
              const isActive = currentChapter?.id === chapter.id
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
                        {chapter.status !== 'draft' && (
                          <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                            {getStatusText(chapter.status)}
                          </span>
                        )}
                      </div>
                      <h5 className={`font-medium truncate ${isActive ? 'text-blue-700' : 'text-gray-900'}`}>
                        {chapter.title}
                      </h5>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>{chapter.wordCount.toLocaleString()} 字</span>
                        <span>{formatDate(chapter.updatedAt)}</span>
                      </div>
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
          initialPlans={(project as any).chapterPlanning || []}
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
