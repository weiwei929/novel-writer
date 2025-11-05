import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MarkdownEditor from '../components/editor/MarkdownEditor'
import ChapterManager from '../components/chapters/ChapterManager'
import ProjectManagementPanel from '../components/project/ProjectManagementPanel'
import ChapterOutlineView from '../components/project/ChapterOutlineView'
import WritingAssistant from '../components/writing/WritingAssistant'
import { projectsApi, chaptersApi, Project, Chapter } from '../services/api'
import { 
  ArrowLeft, 
  BookOpen, 
  PanelLeft, 
  PanelRight,
  Save,
  Settings,
  FileText,
  List,
  Target
} from 'lucide-react'

const EnhancedEditorPage: React.FC = () => {
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarView, setSidebarView] = useState<'chapters' | 'outline' | 'project' | 'assistant'>('chapters')
  
  // 编辑器状态
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

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
      // 没有选择章节时显示项目介绍
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

  const generateProjectIntro = (project: Project): string => {
    return `# ${project.title}

## 项目信息
- **作者**: ${project.author}
- **类型**: ${project.genre.join(', ')}
- **状态**: ${project.status}
- **字数**: ${project.wordCount.toLocaleString()}
- **章节**: ${project.chapterCount}
- **创建时间**: ${new Date(project.createdAt).toLocaleDateString()}
- **更新时间**: ${new Date(project.updatedAt).toLocaleDateString()}

## 项目描述
${project.description || '*暂无描述*'}

---

## 开始创作

在左侧面板中选择一个章节开始编辑，或者创建新的章节开始写作。

### 写作提示
- 使用 Markdown 格式进行写作
- 编辑器支持自动保存功能
- 可以使用快捷键快速插入格式
- 章节会自动统计字数和阅读时间

祝你写作愉快！ 📝
`
  }

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    setHasUnsavedChanges(true)
    
    // 实时更新字数统计（仅在前端显示，不保存到后端）
    if (chapter) {
      const newWordCount = calculateWordCount(newContent)
      setChapter({
        ...chapter,
        wordCount: newWordCount
      })
    }
  }

  const handleSave = async (saveContent?: string) => {
    if (!chapter) {
      console.log('没有选择章节，无法保存')
      return
    }

    const contentToSave = saveContent || content
    const newWordCount = calculateWordCount(contentToSave)
    
    try {
      setSaving(true)
      
      // 使用统一的更新函数，自动同步项目统计
      await updateChapterAndProject(chapter.id, {
        content: contentToSave,
        wordCount: newWordCount
      })
      
      setHasUnsavedChanges(false)
      setLastSaved(new Date())
      
      console.log('章节保存成功')
    } catch (err) {
      setError('保存章节失败')
      console.error('Error saving chapter:', err)
    } finally {
      setSaving(false)
    }
  }

  const calculateWordCount = (text: string): number => {
    return text.replace(/[^\u4e00-\u9fa5\w]/g, ' ').split(/\s+/).filter(word => word.length > 0).length
  }

  const handleChapterSelect = (selectedChapter: Chapter) => {
    // 如果有未保存的更改，先提示保存
    if (hasUnsavedChanges && chapter) {
      const shouldSave = confirm('当前章节有未保存的更改，是否保存？')
      if (shouldSave) {
        handleSave()
      }
    }
    
    // 导航到新章节
    navigate(`/editor/${projectId}/${selectedChapter.id}`)
  }

  // 更新章节并同步项目统计
  const updateChapterAndProject = async (chapterId: string, updates: Partial<Chapter>) => {
    try {
      const updatedChapter = await chaptersApi.update(chapterId, updates)
      
      // 更新章节列表
      const updatedChapters = chapters.map(c => 
        c.id === chapterId ? updatedChapter : c
      )
      setChapters(updatedChapters)
      
      // 如果是当前章节，也更新当前章节状态
      if (chapter && chapter.id === chapterId) {
        setChapter(updatedChapter)
      }
      
      // 重新计算项目统计
      if (project) {
        const totalWords = updatedChapters.reduce((sum, c) => sum + (c.wordCount || 0), 0)
        const updatedProject = {
          ...project,
          wordCount: totalWords,
          chapterCount: updatedChapters.length,
          updatedAt: new Date().toISOString()
        }
        
        // 更新项目信息
        try {
          const savedProject = await projectsApi.update(project.id, {
            wordCount: totalWords,
            chapterCount: updatedChapters.length
          })
          setProject(savedProject)
        } catch (error) {
          console.log('项目统计更新失败，但章节保存成功')
          setProject(updatedProject) // 至少在前端更新
        }
      }
      
      return updatedChapter
    } catch (error) {
      console.error('更新章节失败:', error)
      throw error
    }
  }

  const handleGoBack = () => {
    if (hasUnsavedChanges) {
      const shouldSave = confirm('有未保存的更改，是否保存后离开？')
      if (shouldSave) {
        handleSave().then(() => navigate('/projects'))
      } else {
        navigate('/projects')
      }
    } else {
      navigate('/projects')
    }
  }

  // 键盘快捷键处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault()
            if (chapter) {
              handleSave()
            }
            break
          case 'b':
            e.preventDefault()
            setSidebarCollapsed(!sidebarCollapsed)
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [chapter, sidebarCollapsed])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium text-gray-900 mb-2">加载中...</div>
          <div className="text-gray-500">正在加载项目数据</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="text-red-700 mb-4">{error}</div>
          <div className="flex gap-3">
            <button
              onClick={handleGoBack}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              返回
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              重新加载
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* 顶部工具栏 */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleGoBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>返回项目</span>
          </button>
          
          <div className="h-5 w-px bg-gray-300"></div>
          
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            title="切换侧栏"
          >
            {sidebarCollapsed ? <PanelRight size={20} /> : <PanelLeft size={20} />}
            <span>侧栏</span>
          </button>
          
          {!sidebarCollapsed && (
            <>
              <div className="h-5 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setSidebarView('chapters')}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    sidebarView === 'chapters' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <List size={16} className="inline mr-1" />
                  章节
                </button>
                <button
                  onClick={() => setSidebarView('outline')}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    sidebarView === 'outline' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FileText size={16} className="inline mr-1" />
                  大纲
                </button>
                <button
                  onClick={() => setSidebarView('project')}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    sidebarView === 'project' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Settings size={16} className="inline mr-1" />
                  项目
                </button>
                <button
                  onClick={() => setSidebarView('assistant')}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    sidebarView === 'assistant' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Target size={16} className="inline mr-1" />
                  助手
                </button>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <BookOpen size={20} className="text-gray-400" />
            <div className="text-center">
              <div className="font-medium">
                {chapter ? chapter.title : (project ? project.title : '小说编辑器')}
              </div>
              {project && (
                <div className="text-xs text-gray-500">
                  {project.author}
                  {chapter && ` · 第${chapter.order}章`}
                  {hasUnsavedChanges && ' · 未保存'}
                  {saving && ' · 保存中...'}
                  {lastSaved && !hasUnsavedChanges && ` · ${lastSaved.toLocaleTimeString()} 已保存`}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {chapter && (
            <button
              onClick={() => handleSave()}
              disabled={saving || !hasUnsavedChanges}
              className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save size={16} />
              {saving ? '保存中...' : '保存'}
            </button>
          )}
          
          {project && (
            <div className="text-sm text-gray-500">
              {project.wordCount.toLocaleString()} 字 · {project.chapterCount} 章节
            </div>
          )}
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 侧边栏 */}
        <div className={`bg-gray-50 border-r transition-all duration-300 ${
          sidebarCollapsed ? 'w-0' : 'w-96'
        } overflow-hidden`}>
          {projectId && (
            <div className="h-full overflow-y-auto">
              {sidebarView === 'chapters' && (
                <div className="p-4">
                  <ChapterManager
                    projectId={projectId}
                    currentChapterId={chapterId}
                    onChapterSelect={handleChapterSelect}
                  />
                </div>
              )}
              
              {sidebarView === 'outline' && project && (
                <div className="p-4">
                  <ChapterOutlineView
                    chapters={chapters}
                    currentChapterId={chapterId}
                    onChapterSelect={handleChapterSelect}
                    onChapterUpdate={updateChapterAndProject}
                  />
                </div>
              )}
              
              {sidebarView === 'project' && project && (
                <div className="p-4">
                  <ProjectManagementPanel
                    project={project}
                    chapters={chapters}
                    onProjectUpdate={setProject}
                  />
                </div>
              )}
              
              {sidebarView === 'assistant' && project && (
                <div className="p-4">
                  <WritingAssistant
                    project={project}
                    chapters={chapters}
                    currentChapter={chapter}
                    currentContent={content}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* 编辑器区域 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1">
            <MarkdownEditor
              key={chapterId} // 强制重新渲染当切换章节时
              initialContent={content}
              onSave={handleSave}
              onContentChange={handleContentChange}
              autoSave={true}
              autoSaveDelay={3000}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnhancedEditorPage