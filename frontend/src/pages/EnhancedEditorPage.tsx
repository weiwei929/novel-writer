import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MarkdownEditor, { MarkdownEditorRef } from '../components/editor/MarkdownEditor'
import ProjectNavigationPanel from '../components/editor/ProjectNavigationPanel'
import ProjectMetadataPanel from '../components/editor/ProjectMetadataPanel'
import ChapterMetadataPanel from '../components/editor/ChapterMetadataPanel'
import DualModeSwitch, { EditorMode } from '../components/writer/DualModeSwitch'
import AIAssistantPanel from '../components/writer/AIAssistantPanel'
import AIReviewPanel from '../components/writer/AIReviewPanel'
import { projectsApi, chaptersApi, Project, Chapter } from '../services/api'
import { ArrowLeft, Save } from 'lucide-react'
import { useNotifications } from '../hooks/useNotifications'

const EnhancedEditorPageContent: React.FC = () => {
  const { error: notifyError, success: notifySuccess } = useNotifications()
  // 改用 projectId 和 chapterId 双参数
  const { projectId, chapterId } = useParams<{ projectId: string, chapterId: string }>()
  const navigate = useNavigate()
  const editorRef = useRef<MarkdownEditorRef>(null)

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
  const [projectMetadataField, setProjectMetadataField] = useState<string>('synopsis')
  const [showChapterMetadata, setShowChapterMetadata] = useState(false)
  const [exitStatus, setExitStatus] = useState<'writing' | 'completed'>('writing')
  const [editorMode, setEditorMode] = useState<EditorMode>('pure')

  // 初始化加载：并行获取项目和章节
  useEffect(() => {
    if (!projectId || !chapterId) {
      setLoading(false)
      return
    }
    loadData(projectId, chapterId)
  }, [projectId, chapterId])

  const loadData = async (pId: string, cId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      // 1. 并行获取项目详情、章节列表、当前章节内容
      // 这样即使章节加载失败，项目框架也能显示
      const [projectData, chaptersData, chapterData] = await Promise.all([
        projectsApi.getById(pId),
        chaptersApi.getByProjectId(pId),
        chaptersApi.getById(cId)
      ])

      setProject(projectData)
      setChapters(chaptersData)
      setChapter(chapterData)
      
      // 2. 构造编辑器内容
      const raw = chapterData.content || ''
      const hasHeader = /^#\s/.test(raw.trim()) || /^---\n/.test(raw.trim())
      let header = ''
      
      // 总是使用最新的项目和章节元数据构造
      const projSynopsis = (projectData as any)?.metadata?.synopsis?.current || ''
      const chapSynopsis = (chapterData as any)?.summary || (chapterData as any)?.metadata?.synopsis?.current || ''
      
      header += `---\nprojectTitle: ${projectData.title}\nprojectAuthor: ${projectData.author}\nprojectCreatedAt: ${new Date(projectData.createdAt).toLocaleDateString()}\nprojectUpdatedAt: ${new Date(projectData.updatedAt).toLocaleDateString()}\nprojectSynopsis: ${projSynopsis}\nchapterOrder: ${chapterData.order}\nchapterTitle: ${chapterData.title}\nchapterAuthor: ${projectData.author}\nchapterCreatedAt: ${new Date(chapterData.createdAt).toLocaleDateString()}\nchapterUpdatedAt: ${new Date(chapterData.updatedAt).toLocaleDateString()}\nchapterSynopsis: ${chapSynopsis}\n---\n\n# ${projectData.title}\n\n`
      header += `## 第 ${chapterData.order} 章：${chapterData.title}\n\n`
      
      const composed = hasHeader ? raw : `${header}${raw}`
      setContent(composed)
      setHasUnsavedChanges(false)

    } catch (err: any) {
      console.error('加载数据失败:', err)
      // 尝试至少保留项目上下文以便导航
      if (err.message?.includes('Chapter')) {
          setError('加载章节失败，找不到指定章节')
      } else {
          setError('加载项目数据失败')
      }
    } finally {
      setLoading(false)
    }
  }

  // 刷新当前项目的章节列表
  const refreshChapters = async () => {
    if (!projectId) return
    try {
      const chaptersData = await chaptersApi.getByProjectId(projectId)
      setChapters(chaptersData)
    } catch (err) {
      console.error('刷新章节列表失败:', err)
    }
  }

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
    let contentToSave = saveContent || content
    const newWordCount = calculateWordCount(contentToSave)
    try {
      setSaving(true)
      const fmMatch = contentToSave.match(/^---\n([\s\S]*?)\n---\n/)
      if (fmMatch) {
        const lines = fmMatch[1].split(/\n/)
        const kv: Record<string, string> = {}
        for (const line of lines) {
          const idx = line.indexOf(':')
          if (idx > -1) {
            const key = line.slice(0, idx).trim()
            const val = line.slice(idx + 1).trim()
            kv[key] = val
          }
        }
        if (kv['chapterSynopsis']) {
          try {
            await chaptersApi.update(chapter.id, { summary: kv['chapterSynopsis'] })
            await chaptersApi.updateMetadata(chapter.id, 'synopsis', kv['chapterSynopsis'])
          } catch {}
        }
        if (kv['projectSynopsis'] && project) {
          try {
            await projectsApi.updateMetadata(project.id, 'synopsis', kv['projectSynopsis'])
          } catch {}
        }
        const nowStr = new Date().toISOString()
        kv['projectUpdatedAt'] = nowStr
        kv['chapterUpdatedAt'] = nowStr
        const pTitle = kv['projectTitle'] || project?.title || ''
        const cTitle = kv['chapterTitle'] || chapter.title
        const header = `---\nprojectTitle: ${pTitle}\nprojectAuthor: ${kv['projectAuthor'] || project?.author || ''}\nprojectCreatedAt: ${kv['projectCreatedAt'] || new Date(project!.createdAt).toLocaleDateString()}\nprojectUpdatedAt: ${kv['projectUpdatedAt']}\nprojectSynopsis: ${kv['projectSynopsis'] || (project as any)?.metadata?.synopsis?.current || ''}\nchapterOrder: ${kv['chapterOrder'] || chapter.order}\nchapterTitle: ${cTitle}\nchapterAuthor: ${kv['chapterAuthor'] || project?.author || ''}\nchapterCreatedAt: ${kv['chapterCreatedAt'] || new Date(chapter.createdAt).toLocaleDateString()}\nchapterUpdatedAt: ${kv['chapterUpdatedAt']}\nchapterSynopsis: ${kv['chapterSynopsis'] || (chapter as any)?.summary || ''}\n---\n`
        contentToSave = contentToSave.replace(fmMatch[0], header)
      }

      await updateChapterAndProject(chapter.id, {
        content: contentToSave,
        wordCount: newWordCount,
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
      .filter(word => word.length > 0).length
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
    navigate(`/editor/${project?.id}/${selectedChapter.id}`)
  }

  const updateChapterAndProject = async (chapterId: string, updates: Partial<Chapter>) => {
    try {
      const updatedChapter = await chaptersApi.update(chapterId, updates)
      const updatedChapters = chapters.map(c => (c.id === chapterId ? updatedChapter : c))
      setChapters(updatedChapters)
      if (chapter && chapter.id === chapterId) setChapter(updatedChapter)
      if (project) {
        const totalWords = updatedChapters.reduce((sum, c) => sum + (c.wordCount || 0), 0)
        try {
          const savedProject = await projectsApi.update(project.id, {
            wordCount: totalWords,
            chapterCount: updatedChapters.length,
          })
          setProject(savedProject)
        } catch (error) {
          console.log('项目统计更新失败，但章节保存成功')
          notifyError(
            '项目统计更新失败',
            '章节内容已保存，但项目总字数/章节数未能同步更新。稍后可在项目页刷新重试。'
          )
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
  
  const handleApplyAIContent = (contentToInsert: string) => {
    if (editorRef.current) {
        editorRef.current.insertContent(contentToInsert)
        notifySuccess('已插入内容', 'AI 生成内容已插入编辑器')
    }
  }

  // 退出保存提醒（关闭页面或刷新时提示）
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [hasUnsavedChanges])

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )

  if (error)
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">{error}</div>
          <div className="space-x-2">
            <button
              onClick={() => navigate('/projects')}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              返回
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              重新加载
            </button>
          </div>
        </div>
      </div>
    )

  if ((!chapter && !loading) || !chapterId) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p>请选择要编辑的章节</p>
          <button
            onClick={() => navigate('/projects')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            返回项目列表
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleGoBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            <span>返回项目</span>
          </button>
          <div className="h-5 w-px bg-gray-300"></div>
          <div className="flex flex-col">
            <h1 className="font-semibold text-gray-900">{project ? project.title : '加载中...'}</h1>
            {chapter && (
              <div className="text-xs text-gray-500">
                第 {chapter.order} 章: {chapter.title}
                {hasUnsavedChanges && ' · 有未保存更改'}
                {lastSaved && !hasUnsavedChanges && ` · ${lastSaved.toLocaleTimeString()} 已保存`}
              </div>
            )}
            {project?.metadata?.synopsis?.current && (
              <div className="mt-2 text-sm line-clamp-2">
                <span className="px-2 py-0.5 mr-2 rounded bg-blue-100 text-blue-700 border border-blue-200 text-xs">
                  作品梗概
                </span>
                <span className="text-gray-800">{project.metadata.synopsis.current}</span>
              </div>
            )}
            {((chapter as any)?.metadata?.synopsis?.current || chapter?.summary) && (
              <div className="mt-1 text-xs line-clamp-1">
                <span className="px-2 py-0.5 mr-2 rounded bg-green-100 text-green-700 border border-green-200">
                  章节梗概
                </span>
                <span className="text-gray-700">
                  {(chapter as any)?.metadata?.synopsis?.current || chapter?.summary}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <DualModeSwitch mode={editorMode} onChange={setEditorMode} />
          
          <button
             onClick={() => setEditorMode(editorMode === 'review' ? 'pure' : 'review')}
             className={`px-3 py-1.5 text-sm border rounded-lg flex items-center gap-1 transition-colors ${editorMode === 'review' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'text-gray-600 hover:bg-gray-50'}`}
             title="AI 审阅"
          >
             <span>🔍 审阅</span>
          </button>

          <div className="h-5 w-px bg-gray-300"></div>

          <button
            onClick={() => setShowProjectMetadata(true)}
            className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            项目元数据
          </button>
          {chapter && (
            <button
              onClick={() => setShowChapterMetadata(true)}
              className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
            >
              章节元数据
            </button>
          )}
          {chapter && (
            <button
              onClick={() => handleSave()}
              disabled={saving || !hasUnsavedChanges}
              className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              {saving ? '保存中...' : '保存'}
            </button>
          )}

          {chapter && (
            <div className="flex items-center gap-2">
              <select
                value={exitStatus}
                onChange={e => setExitStatus(e.target.value as 'writing' | 'completed')}
                className="px-2 py-1 text-sm border rounded"
              >
                <option value="writing">写作中</option>
                <option value="completed">已完成</option>
              </select>
              <button
                onClick={async () => {
                  const navigateProjectId = project?.id || chapter?.projectId
                  try {
                    await handleSave()
                  } catch (err) {
                    notifyError('章节保存失败', '将尝试仅更新状态并继续退出')
                  }
                  if (chapter) {
                    try {
                      await chaptersApi.update(chapter.id, { status: exitStatus })
                      notifySuccess(
                        '章节状态已更新',
                        exitStatus === 'completed' ? '状态：已完成' : '状态：写作中'
                      )
                    } catch (err) {
                      console.error('更新章节状态失败:', err)
                      notifyError('更新章节状态失败', '请稍后在章节列表重试。')
                    }
                  } else {
                    notifyError('无有效章节', '无法更新章节状态')
                  }
                  if (navigateProjectId) {
                    navigate(`/projects/${navigateProjectId}`)
                  } else {
                    navigate('/projects')
                  }
                }}
                className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                保存并退出
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧边栏 - 项目导航 */}
        {project && (
          <div className="bg-gray-100 border-r border-gray-300 shadow-lg h-full">
            <ProjectNavigationPanel
              project={project}
              chapters={chapters}
              currentChapter={chapter}
              onChapterSelect={handleChapterSelect}
              onProjectSettings={field => {
                setProjectMetadataField(field || 'synopsis')
                setShowProjectMetadata(true)
              }}
              onChaptersRefresh={refreshChapters}
              className="flex-shrink-0"
            />
          </div>
        )}

        {/* 分隔线 */}
        {project && (
          <div className="w-1 bg-gradient-to-b from-gray-300 via-gray-400 to-gray-300 shadow-sm"></div>
        )}

        {/* 中间主编辑区域 */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white relative z-20 shadow-xl border-y border-gray-200">
          <MarkdownEditor
            ref={editorRef}
            key={chapterId}
            initialContent={content}
            onSave={handleSave}
            onContentChange={handleContentChange}
            autoSave={false}
            autoSaveDelay={3000}
          />
        </div>

        {/* 分隔线 */}
        <div className="w-1 bg-gradient-to-b from-gray-300 via-gray-400 to-gray-300 shadow-sm"></div>

        {/* Right Panel - AI Assistant */}
        {editorMode === 'ai' && (
           <>
             <div className="w-1 bg-gradient-to-b from-gray-300 via-gray-400 to-gray-300 shadow-sm"></div>
             <AIAssistantPanel 
                onClose={() => setEditorMode('pure')} 
                onApplyContent={handleApplyAIContent}
                onUpdateMetadata={async (field, content) => {
                    if (!project) return;
                    try {
                        // Append to existing content for these fields to avoid overwriting
                        // Or just replace if it's "logline".
                        // Logic:
                        // - characters: Append or Replace? AI usually generates a list. Append seems safer if list.
                        // - worldview: Append.
                        // - logline: Replace.
                        
                        // For MVP, let's just append with a newline if it exists.
                        const currentVal = (project.metadata as any)?.[field] || '';
                        const newVal = currentVal ? `${currentVal}\n\n${content}` : content;
                        
                        await projectsApi.updateMetadata(project.id, field, newVal);
                        notifySuccess('设定已更新', `已更新项目的 ${field}`);
                        // Refresh project data to update context
                        const updated = await projectsApi.getById(project.id);
                        setProject(updated);
                    } catch (e) {
                        notifyError('更新失败', '无法保存设定');
                    }
                }}
                projectId={project?.id}
                chapterId={chapter?.id}
             />
           </>
        )}
        
        {/* Right Panel - AI Reviewer */}
        {editorMode === 'review' && (
           <>
             <div className="w-1 bg-gradient-to-b from-gray-300 via-gray-400 to-gray-300 shadow-sm"></div>
             <AIReviewPanel 
                content={content}
                onClose={() => setEditorMode('pure')} 
             />
           </>
        )}

        {/* 章节元数据弹窗（与项目元数据一致的固定遮罩抽屉） */}
        {showChapterMetadata && (
          <div className="fixed inset-0 z-50 flex">
            <div
              className="absolute inset-0 bg-black bg-opacity-30"
              onClick={() => setShowChapterMetadata(false)}
            />
            <ChapterMetadataPanel
              chapter={chapter}
              onUpdate={(_field, _value) => {
                setShowChapterMetadata(false)
              }}
              onClose={() => setShowChapterMetadata(false)}
              initialMode={'view_all'}
              className="relative ml-auto h-full w-[28rem]"
            />
          </div>
        )}
      </div>
      {showProjectMetadata && project && (
        <ProjectMetadataPanel
          project={project}
          onClose={() => setShowProjectMetadata(false)}
          initialField={projectMetadataField}
          initialMode={'view_all'}
        />
      )}
    </div>
  )
}

// 主组件：不再提供 WritingModeProvider
const EnhancedEditorPage: React.FC = () => {
  return (
    <EnhancedEditorPageContent />
  )
}

export default EnhancedEditorPage
