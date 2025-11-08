import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MarkdownEditor from '../components/editor/MarkdownEditor'
import ProjectNavigationPanel from '../components/editor/ProjectNavigationPanel'
import ChapterMetadataPanel from '../components/editor/ChapterMetadataPanel'
import ProjectMetadataPanel from '../components/editor/ProjectMetadataPanel'
import ModeSwitcher from '../components/writing-mode/ModeSwitcher'
import ModeIndicator from '../components/writing-mode/ModeIndicator'
import PlanningPanel from '../components/writing-mode/PlanningPanel'
import WritingStatsPanel from '../components/writing-mode/WritingStatsPanel'
import { WritingModeProvider, useWritingMode, WritingMode } from '../contexts/WritingModeContext'
import { projectsApi, chaptersApi, Project, Chapter } from '../services/api'
import { ArrowLeft, Save } from 'lucide-react'
import { useNotifications } from '../contexts/UIContext'

const EnhancedEditorPageContent: React.FC = () => {
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

  // 当路由参数变化时（项目/章节切换）加载章节
  useEffect(() => {
    if (projectId && chapterId) {
      loadChapter()
    }
  }, [projectId, chapterId])

  // 当处于项目层级（没有选中章节）且项目数据就绪时，填充项目简介
  useEffect(() => {
    if (project && !chapterId) {
      setChapter(null)
      setContent(generateProjectIntro(project))
      setLoading(false)
    }
  }, [project, chapterId])

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
          {/* 写作模式指示器 */}
          <ModeIndicator />
          
          {/* 写作模式切换器 */}
          <ModeSwitcher variant="tabs" size="sm" />
          
          <div className="h-5 w-px bg-gray-300"></div>
          
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
        {/* 左侧边栏 - 项目导航 */}
        <div className="bg-gray-100 border-r border-gray-300 shadow-lg">
          <ProjectNavigationPanel 
            project={project} 
            chapters={chapters} 
            currentChapter={chapter} 
            onChapterSelect={handleChapterSelect} 
            onCreateChapter={handleCreateChapter} 
            onProjectSettings={() => setShowProjectMetadata(true)} 
            className="flex-shrink-0" 
          />
        </div>
        
        {/* 分隔线 */}
        <div className="w-1 bg-gradient-to-b from-gray-300 via-gray-400 to-gray-300 shadow-sm"></div>
        
        {/* 中间主编辑区域 */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white relative z-20 shadow-xl border-y border-gray-200">
          <MarkdownEditor 
            key={chapterId} 
            initialContent={content} 
            onSave={handleSave} 
            onContentChange={handleContentChange} 
            autoSave={true} 
            autoSaveDelay={3000} 
          />
        </div>
        
        {/* 分隔线 */}
        <div className="w-1 bg-gradient-to-b from-gray-300 via-gray-400 to-gray-300 shadow-sm"></div>
        
        {/* 右侧边栏 - 根据写作模式智能显示 */}
        {renderRightPanel()}
      </div>
      {showProjectMetadata && (
        <ProjectMetadataPanel
          project={project}
          onClose={() => setShowProjectMetadata(false)}
        />
      )}
    </div>
  )

  // 根据写作模式渲染右侧面板
  function renderRightPanel() {
    const { modeState } = useWritingMode()
    
    switch (modeState.currentMode) {
      case WritingMode.PLANNING:
        // 规划模式：显示项目规划面板
        return (
          <PlanningPanel 
            chapter={chapter}
            onOutlineChange={(outline) => console.log('大纲更新:', outline)}
            onCharactersChange={(characters) => console.log('角色更新:', characters)}
            className="flex-shrink-0 w-80"
          />
        )
        
      case WritingMode.WRITING:
        // 写作模式：显示写作统计面板
        return (
          <WritingStatsPanel 
            content={content}
            wordTarget={1000}
            timeTarget={60}
            className="flex-shrink-0 w-80"
          />
        )
        
      case WritingMode.REVIEW:
      default:
        // 审阅模式：显示章节元数据（默认行为）
        return (
          <div className="bg-purple-50 border-l border-purple-200 shadow-lg flex-shrink-0 w-80">
            <div className="p-4 border-b border-purple-200 bg-purple-100">
              <h3 className="font-medium text-purple-900">审阅模式</h3>
              <p className="text-xs text-purple-600">预览、元数据与版本管理</p>
            </div>
            <div className="bg-white">
              <ChapterMetadataPanel 
                chapter={chapter} 
                onUpdate={handleMetadataUpdate}
              />
            </div>
          </div>
        )
    }
  }
}

// 主组件：提供写作模式上下文
const EnhancedEditorPage: React.FC = () => {
  return (
    <WritingModeProvider>
      <EnhancedEditorPageContent />
    </WritingModeProvider>
  )
}

export default EnhancedEditorPage

