import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  chaptersApi, 
  projectsApi, 
  Project, 
  Chapter, 
  CreateChapterData 
} from '../../services/api'
import {
  Plus,
  Edit3,
  Trash2,
  BookOpen,
  FileText,
  Calendar,
  Clock,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Play
} from 'lucide-react'
import { CreateChapterModal, EditChapterModal } from './ChapterModals'

interface ChapterManagerProps {
  projectId: string
  currentChapterId?: string
  onChapterSelect?: (chapter: Chapter) => void
}

const ChapterManager: React.FC<ChapterManagerProps> = ({
  projectId,
  currentChapterId,
  onChapterSelect
}) => {
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null)

  useEffect(() => {
    loadData()
  }, [projectId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [projectData, chaptersData] = await Promise.all([
        projectsApi.getById(projectId),
        chaptersApi.getByProjectId(projectId) // 使用新的RESTful API
      ])
      
      setProject(projectData)
      setChapters(chaptersData.sort((a, b) => a.order - b.order))
    } catch (err) {
      setError('加载章节数据失败')
      console.error('Error loading chapters:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateChapter = async (chapterData: Omit<CreateChapterData, 'projectId'> & { summary?: string; mdSynopsis?: string }) => {
    try {
      const newChapter = await chaptersApi.createForProject(projectId, {
        title: chapterData.title,
        content: chapterData.content,
        notes: chapterData.notes,
        order: chapters.length + 1
      })
      // 写入章节梗概与初始元数据
      try {
        if (chapterData.summary && chapterData.summary.trim()) {
          await chaptersApi.update(newChapter.id, { summary: chapterData.summary.trim() })
        }
        if (chapterData.mdSynopsis && chapterData.mdSynopsis.trim()) {
          await chaptersApi.updateMetadata(newChapter.id, 'synopsis', chapterData.mdSynopsis.trim())
        }
      } catch (metaErr) {
        console.warn('初始化章节元数据失败：', metaErr)
      }
      
      setChapters([...chapters, newChapter])
      setShowCreateModal(false)
      
      // 自动跳转到新章节编辑
      if (onChapterSelect) {
        onChapterSelect(newChapter)
      } else {
        navigate(`/editor/${newChapter.id}`)
      }
    } catch (err) {
      setError('创建章节失败')
      console.error('Error creating chapter:', err)
    }
  }

  const handleUpdateChapter = async (chapterId: string, updates: Partial<Chapter>) => {
    try {
      const updatedChapter = await chaptersApi.update(chapterId, updates)
      setChapters(chapters.map(c => c.id === chapterId ? updatedChapter : c))
      setEditingChapter(null)
    } catch (err) {
      setError('更新章节失败')
      console.error('Error updating chapter:', err)
    }
  }

  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm('确定要删除这个章节吗？此操作无法撤销！')) return
    
    try {
      await chaptersApi.delete(chapterId)
      setChapters(chapters.filter(c => c.id !== chapterId))
    } catch (err) {
      setError('删除章节失败')
      console.error('Error deleting chapter:', err)
    }
  }

  const handleReorderChapter = async (chapterId: string, direction: 'up' | 'down') => {
    const chapterIndex = chapters.findIndex(c => c.id === chapterId)
    if (chapterIndex === -1) return
    
    const targetIndex = direction === 'up' ? chapterIndex - 1 : chapterIndex + 1
    if (targetIndex < 0 || targetIndex >= chapters.length) return
    
    const newChapters = [...chapters]
    const [chapter] = newChapters.splice(chapterIndex, 1)
    newChapters.splice(targetIndex, 0, chapter)
    
    // 更新order字段
    const updates = newChapters.map((c, index) => ({
      ...c,
      order: index + 1
    }))
    
    setChapters(updates)
    
    // 批量更新order（这里简化处理，实际项目中可能需要优化）
    try {
      await handleUpdateChapter(chapterId, { order: targetIndex + 1 })
      await handleUpdateChapter(chapters[targetIndex].id, { order: chapterIndex + 1 })
    } catch (err) {
      // 如果更新失败，恢复原顺序
      setChapters(chapters)
      setError('调整章节顺序失败')
    }
  }

  const getStatusColor = (status: Chapter['status'] | Project['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'writing': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'completed': return 'bg-green-100 text-green-700 border-green-200'
      case 'published': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'archived': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusText = (status: Chapter['status'] | Project['status']) => {
    switch (status) {
      case 'draft': return '草稿'
      case 'writing': return '写作中'
      case 'completed': return '已完成'
      case 'published': return '已发布'
      case 'archived': return '已归档'
      default: return '未知'
    }
  }

  const calculateReadingTime = (wordCount: number) => {
    // 假设阅读速度为每分钟 300 字
    const minutes = Math.ceil(wordCount / 300)
    if (minutes < 60) return `${minutes}分钟`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}小时${remainingMinutes > 0 ? remainingMinutes + '分钟' : ''}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">加载章节列表中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div className="text-red-700">{error}</div>
        <button
          onClick={loadData}
          className="mt-2 text-red-600 hover:underline text-sm"
        >
          重试
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 项目信息头部 */}
      {project && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-500" />
              {project.title}
            </h2>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
              {getStatusText(project.status)}
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              <span>{chapters.length} 章节</span>
            </div>
            <div className="flex items-center gap-1">
              <BarChart3 className="w-4 h-4" />
              <span>{project.wordCount.toLocaleString()} 字</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{calculateReadingTime(project.wordCount)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* 章节列表头部 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">章节管理</h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建章节
        </button>
      </div>

      {/* 章节列表 */}
      {chapters.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">还没有章节</h3>
          <p className="text-gray-500 mb-4">创建第一个章节开始你的写作之旅</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            创建章节
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {chapters.map((chapter, index) => (
            <div
              key={chapter.id}
              className={`bg-white rounded-lg border p-4 transition-all duration-200 hover:shadow-md ${
                currentChapterId === chapter.id ? 'ring-2 ring-blue-500 border-blue-500' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => {
                    if (onChapterSelect) {
                      onChapterSelect(chapter)
                    } else {
                      navigate(`/editor/${chapter.id}`)
                    }
                  }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm font-medium">
                      第 {chapter.order} 章
                    </span>
                    <h4 className="font-medium text-gray-900 hover:text-blue-600 transition-colors">
                      {chapter.title}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(chapter.status)}`}>
                      {getStatusText(chapter.status)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{chapter.wordCount.toLocaleString()} 字</span>
                    <span>{calculateReadingTime(chapter.wordCount)}</span>
                    <span>更新于 {new Date(chapter.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* 章节操作按钮 */}
                <div className="flex items-center gap-1 ml-4">
                  <button
                    onClick={() => {
                    if (onChapterSelect) {
                      onChapterSelect(chapter)
                    } else {
                      navigate(`/editor/${chapter.id}`)
                    }
                    }}
                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                    title="编辑章节"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => setEditingChapter(chapter)}
                    className="p-2 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 rounded transition-colors"
                    title="章节设置"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  
                  {index > 0 && (
                    <button
                      onClick={() => handleReorderChapter(chapter.id, 'up')}
                      className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded transition-colors"
                      title="上移"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                  )}
                  
                  {index < chapters.length - 1 && (
                    <button
                      onClick={() => handleReorderChapter(chapter.id, 'down')}
                      className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded transition-colors"
                      title="下移"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDeleteChapter(chapter.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="删除章节"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 创建章节模态框 */}
      {showCreateModal && (
        <CreateChapterModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateChapter}
          nextOrder={chapters.length + 1}
        />
      )}

      {/* 编辑章节模态框 */}
      {editingChapter && (
        <EditChapterModal
          chapter={editingChapter}
          onClose={() => setEditingChapter(null)}
          onSubmit={(updates: Partial<Chapter>) => handleUpdateChapter(editingChapter.id, updates)}
        />
      )}
    </div>
  )
}

export default ChapterManager
