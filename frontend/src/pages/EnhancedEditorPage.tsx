import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MarkdownEditor from '../components/editor/MarkdownEditor'
import ProjectNavigationPanel from '../components/editor/ProjectNavigationPanel'
import ChapterMetadataPanel from '../components/editor/ChapterMetadataPanel'
import ProjectMetadataPanel from '../components/editor/ProjectMetadataPanel'
import { projectsApi, chaptersApi, Project, Chapter } from '../services/api'
import { ArrowLeft, Save } from 'lucide-react'
import { useNotifications } from '../contexts/UIContext'

const EnhancedEditorPage: React.FC = () => {
  const { error: notifyError, success: notifySuccess } = useNotifications()
  const { projectId, chapterId } = useParams<{ projectId?: string; chapterId?: string }>()
  const navigate = useNavigate()

  // 数据状态
  const [project, setProject] = useState<Project | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [content, setContent] = useState('')

  // UI状态
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showProjectMetadata, setShowProjectMetadata] = useState(false)

  useEffect(() => {
    if (projectId) {
      loadProject()
    } else {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    if (projectId && chapterId) {
      loadChapter()
    } else if (project && !chapterId) {
      setChapter(null)
      setContent(generateProjectIntro(project))
      setLoading(false)
    }
  }, [projectId, chapterId, project])

  const loadProject = async () => {
    if (!projectId) return
    try {
      setLoading(true)
      setError(null)
      const [projectData, chaptersData] = await Promise.all([
        projectsApi.getById(projectId),
        chaptersApi.getByProjectId(projectId)
      ])
      setProject(projectData)
      setChapters(chaptersData)
    } catch (err) {
      setError('加载项目失败')
      console.error('Error loading project:', err)
      setLoading(false)
    }
  }

  const loadChapter = async () => {
    if (!chapterId) return
    try {
      setLoading(true)
      setError(null)
      const chapterData = await chaptersApi.getById(chapterId)
      setChapter(chapterData)
      setContent(chapterData.content || '')
      setHasUnsavedChanges(false)
      setLoading(false)
    } catch (err) {
      setError('加载章节失败')
      console.error('Error loading chapter:', err)
      setLoading(false)
    }
  }

  const generateProjectIntro = (project: Project): string => `# ${project.title}

## 项目信息
- **作者**: ${project.author}
- **类型**: ${project.genre.join(', ')}
- **状态**: ${project.status}
- **字数**: ${project.wordCount.toLocaleString()}
- **章节**: ${project.chapterCount}

## 开始创作
在左侧面板中选择一个章节开始编辑，或者创建新的章节开始写作。

祝你写作愉快！ 📝
`

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    setHasUnsavedChanges(true)
    if (chapter) {
      const newWordCount = calculateWordCount(newContent)
      setChapter({ ...chapter, wordCount: newWordCount })
    }
  }

  const handleSave = async (saveContent?: string) => {
    if (!chapter) return
    const contentToSave = saveContent || content
    const newWordCount = calculateWordCount(contentToSave)
    try {
      setSaving(true)
      await updateChapterAndProject(chapter.id, {
        content: contentToSave,
        wordCount: newWordCount
      })
      setHasUnsavedChanges(false)
      setLastSaved(new Date())
    } catch (err) {
      setError('保存章节失败')
      console.error('Error saving chapter:', err)
    } finally {
      setSaving(false)
    }
  }

  const calculateWordCount = (text: string): number => {
    return text
      .replace(/[^\u4e00-\u9fa5\w]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 0).length
  }

  const handleChapterSelect = async (selectedChapter: Chapter) => {
    if (hasUnsavedChanges && chapter) {
      try {
        await handleSave()
        notifySuccess('自动保存成功', '已保存当前章节更改')
      } catch {
        // 已在 handleSave 内部处理错误提示
      }
    }
    navigate(`/editor/${projectId}/${selectedChapter.id}`)
  }

  const handleCreateChapter = async () => {
    try {
      if (!project) return
      const defaultTitle = `第${chapters.length + 1}章`
      const title = prompt('请输入新章节标题', defaultTitle)
      if (title === null) return
      const newChapter = await chaptersApi.createForProject(project.id, { title: title || defaultTitle, content: '' })
      setChapters([...chapters, newChapter])
      notifySuccess('章节已创建', `已创建：${newChapter.title}`)
      navigate(`/editor/${project.id}/${newChapter.id}`)
    } catch (e: any) {
      console.error(e)
      notifyError('创建章节失败', e?.message || '请稍后重试')
    }
  }

  const updateChapterAndProject = async (chapterId: string, updates: Partial<Chapter>) => {
    try {
      const updatedChapter = await chaptersApi.update(chapterId, updates)
      const updatedChapters = chapters.map((c) => (c.id === chapterId ? updatedChapter : c))
      setChapters(updatedChapters)
      if (chapter && chapter.id === chapterId) setChapter(updatedChapter)
      if (project) {
        const totalWords = updatedChapters.reduce((sum, c) => sum + (c.wordCount || 0), 0)
        try {
          const savedProject = await projectsApi.update(project.id, {
            wordCount: totalWords,
            chapterCount: updatedChapters.length
          })
          setProject(savedProject)
        } catch (error) {
          console.log('项目统计更新失败，但章节保存成功')
          notifyError('项目统计更新失败', '章节内容已保存，但项目总字数/章节数未能同步更新。稍后可在项目页刷新重试。')
        }
      }
      return updatedChapter
    } catch (error) {
      console.error('更新章节失败:', error)
      throw error
    }
  }

  const handleGoBack = async () => {
    if (hasUnsavedChanges && chapter) {
      try {
        await handleSave()
        notifySuccess('自动保存成功', '已保存当前章节更改')
      } catch {
        // 已在 handleSave 内部处理错误提示
      }
    }
    navigate('/projects')
  }


  const handleMetadataUpdate = (field: string, value: string) => {
    console.log(`元数据更新: ${field} =`, value)
  }

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">加载中...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-500 text-xl mb-4">{error}</div>
        <div className="space-x-2">
          <button onClick={() => navigate('/projects')} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">返回</button>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">重新加载</button>
        </div>
      </div>
    </div>
  )

  if (!project) return (
    <div className="h-screen flex items-center justify-center">
      <div className="text-center text-gray-500">
        <p>未找到项目</p>
        <button onClick={() => navigate('/projects')} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          返回项目列表
        </button>
      </div>
    </div>
  )

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={handleGoBack} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft size={20} /><span>返回项目</span>
          </button>
          <div className="h-5 w-px bg-gray-300"></div>
          <div className="flex flex-col">
            <h1 className="font-semibold text-gray-900">{project.title}</h1>
            {chapter && (
              <div className="text-xs text-gray-500">
                第 {chapter.order} 章: {chapter.title}
                {lastSaved && !hasUnsavedChanges && ` · ${lastSaved.toLocaleTimeString()} 已保存`}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowProjectMetadata(true)}
            className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            项目元数据
          </button>
          {chapter && (
            <button onClick={() => handleSave()} disabled={saving || !hasUnsavedChanges}
              className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed">
              <Save size={16} />{saving ? '保存中...' : '保存'}
            </button>
          )}
          {project && <div className="text-sm text-gray-500">{project.wordCount.toLocaleString()} 字 · {project.chapterCount} 章节</div>}
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
  <ProjectNavigationPanel project={project} chapters={chapters} currentChapter={chapter} onChapterSelect={handleChapterSelect} onCreateChapter={handleCreateChapter} onProjectSettings={() => setShowProjectMetadata(true)} className="flex-shrink-0" />
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          <MarkdownEditor key={chapterId} initialContent={content} onSave={handleSave} onContentChange={handleContentChange} autoSave={true} autoSaveDelay={3000} />
        </div>
        <ChapterMetadataPanel chapter={chapter} onUpdate={handleMetadataUpdate} className="flex-shrink-0" />
      </div>
      {showProjectMetadata && (
        <ProjectMetadataPanel
          project={project}
          onClose={() => setShowProjectMetadata(false)}
        />
      )}
    </div>
  )
}

export default EnhancedEditorPage

