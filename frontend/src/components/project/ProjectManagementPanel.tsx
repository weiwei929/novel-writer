import React, { useState, useEffect } from 'react'
import {
  BookOpen,
  Edit3,
  Save,
  X,
  Target,
  TrendingUp,
  Clock,
  FileText,
  Calendar,
  Award,
  BarChart3,
} from 'lucide-react'
import { Project, Chapter, projectsApi } from '../../services/api'

interface ProjectManagementPanelProps {
  project: Project
  chapters: Chapter[]
  onProjectUpdate: (project: Project) => void
  className?: string
}

const ProjectManagementPanel: React.FC<ProjectManagementPanelProps> = ({
  project,
  chapters,
  onProjectUpdate,
  className = '',
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editedProject, setEditedProject] = useState<Partial<Project>>(project)
  const [saving, setSaving] = useState(false)
  const [writingGoal, setWritingGoal] = useState(50000) // 默认目标字数
  const [dailyGoal, setDailyGoal] = useState(1000) // 默认每日目标

  useEffect(() => {
    setEditedProject(project)
  }, [project])

  // 计算统计数据
  const statistics = React.useMemo(() => {
    const totalWords = chapters.reduce((sum, chapter) => sum + (chapter.wordCount || 0), 0)
    const completedChapters = chapters.filter(c => c.status === 'completed').length
    const draftChapters = chapters.filter(c => c.status === 'draft').length
    const publishedChapters = chapters.filter(c => c.status === 'published').length
    const avgWordsPerChapter = chapters.length > 0 ? Math.round(totalWords / chapters.length) : 0
    const progress = writingGoal > 0 ? Math.round((totalWords / writingGoal) * 100) : 0
    const estimatedReadingTime = Math.ceil(totalWords / 250) // 按每分钟250字计算

    return {
      totalWords,
      completedChapters,
      draftChapters,
      publishedChapters,
      avgWordsPerChapter,
      progress,
      estimatedReadingTime,
    }
  }, [chapters, writingGoal])

  const handleSave = async () => {
    if (!editedProject.id) return

    setSaving(true)
    try {
      const updatedProject = await projectsApi.update(editedProject.id, editedProject)
      onProjectUpdate(updatedProject)
      setIsEditing(false)
    } catch (error) {
      console.error('更新项目失败:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedProject(project)
    setIsEditing(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getProgressColor = (progress: number) => {
    if (progress < 30) return 'bg-red-500'
    if (progress < 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* 项目信息头部 */}
      <div className="p-6 border-b">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={editedProject.title || ''}
                  onChange={e => setEditedProject({ ...editedProject, title: e.target.value })}
                  className="text-2xl font-bold w-full border-b-2 border-blue-500 focus:outline-none"
                  placeholder="项目标题"
                />
                <input
                  type="text"
                  value={editedProject.author || ''}
                  onChange={e => setEditedProject({ ...editedProject, author: e.target.value })}
                  className="text-lg text-gray-600 w-full border-b border-gray-300 focus:outline-none"
                  placeholder="作者"
                />
                <textarea
                  value={editedProject.description || ''}
                  onChange={e =>
                    setEditedProject({ ...editedProject, description: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:border-blue-500"
                  rows={3}
                  placeholder="项目描述..."
                />
              </div>
            ) : (
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{project.title}</h1>
                <p className="text-lg text-gray-600 mb-3">作者：{project.author}</p>
                {project.description && (
                  <p className="text-gray-700 leading-relaxed">{project.description}</p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 ml-4">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  <Save size={16} />
                  {saving ? '保存中...' : '保存'}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  <X size={16} />
                  取消
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <Edit3 size={16} />
                编辑
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 统计概览 */}
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 size={20} />
          创作统计
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <FileText size={16} />
              <span className="text-sm font-medium">总字数</span>
            </div>
            <div className="text-2xl font-bold text-blue-700">
              {statistics.totalWords.toLocaleString()}
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <BookOpen size={16} />
              <span className="text-sm font-medium">章节数</span>
            </div>
            <div className="text-2xl font-bold text-green-700">{chapters.length}</div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-purple-600 mb-1">
              <Clock size={16} />
              <span className="text-sm font-medium">阅读时长</span>
            </div>
            <div className="text-2xl font-bold text-purple-700">
              {statistics.estimatedReadingTime}分钟
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-orange-600 mb-1">
              <Award size={16} />
              <span className="text-sm font-medium">平均章节字数</span>
            </div>
            <div className="text-2xl font-bold text-orange-700">
              {statistics.avgWordsPerChapter.toLocaleString()}
            </div>
          </div>
        </div>

        {/* 进度条 */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">写作进度</span>
              <span className="text-sm text-gray-500">
                {statistics.totalWords.toLocaleString()} / {writingGoal.toLocaleString()} 字
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(statistics.progress)}`}
                style={{ width: `${Math.min(statistics.progress, 100)}%` }}
              ></div>
            </div>
            <div className="text-right text-sm text-gray-500 mt-1">{statistics.progress}% 完成</div>
          </div>
        </div>
      </div>

      {/* 写作目标设置 */}
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target size={20} />
          写作目标
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">总字数目标</label>
            <input
              type="number"
              value={writingGoal}
              onChange={e => setWritingGoal(Number(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              min="1000"
              step="1000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">每日字数目标</label>
            <input
              type="number"
              value={dailyGoal}
              onChange={e => setDailyGoal(Number(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              min="100"
              step="100"
            />
          </div>
        </div>
      </div>

      {/* 章节状态分布 */}
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp size={20} />
          章节状态
        </h3>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-700 mb-1">{statistics.draftChapters}</div>
            <div className="text-sm text-gray-600">草稿</div>
          </div>

          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-700 mb-1">
              {statistics.completedChapters}
            </div>
            <div className="text-sm text-yellow-600">已完成</div>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-700 mb-1">
              {statistics.publishedChapters}
            </div>
            <div className="text-sm text-green-600">已发布</div>
          </div>
        </div>

        {/* 项目元信息 */}
        <div className="mt-6 pt-6 border-t grid grid-cols-2 gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Calendar size={16} />
            <span>创建时间：{formatDate(project.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} />
            <span>最后更新：{formatDate(project.updatedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectManagementPanel
