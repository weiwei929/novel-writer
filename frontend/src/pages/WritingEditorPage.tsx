import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MarkdownEditor, { MarkdownEditorRef } from '../components/editor/MarkdownEditor'
import ProjectNavigationPanel from '../components/editor/ProjectNavigationPanel'
import ContentMetadataCard from '../components/metadata/ContentMetadataCard'
import AIAssistantPanel from '../components/writer/AIAssistantPanel'
import ReferenceSidebar from '../components/writer/ReferenceSidebar'
import WritingEditorNav from '../components/writing/WritingEditorNav'
import '../components/writing/WritingEditorShell.css'
import { projectsApi, chaptersApi, Project, Chapter } from '../services/api'
import { AI_UI_FROZEN } from '../config/aiFreeze'
import { useNotifications } from '../hooks/useNotifications'
import { useSettingsStore } from '../stores/settingsStore'
import { getWorkPermissions } from '../services/workPermissions'
import { getWorkSetting } from '../services/workSetting'

function workDetailPath(projectId: string) {
  return `/work/${projectId}?from=writing`
}

function writingChapterPath(projectId: string, chapterId: string) {
  return `/writing/${projectId}/${chapterId}?from=writing`
}

type EditorMode = 'pure' | 'reference' | 'ai' | 'review'

function ReviewPlaceholder({ onClose }: { onClose: () => void }) {
  return (
    <div className="w-[360px] shrink-0 h-full bg-white border-l border-gray-200 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800">审阅</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-gray-500 hover:text-gray-800"
        >
          关闭
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div className="max-w-xs">
          <h4 className="text-base font-medium text-gray-900 mb-2">审阅功能</h4>
          <p className="text-sm text-gray-500 leading-relaxed">
            编审部模块尚未实现。
            <br />
            审阅功能将在后续版本中归属于「编审部」阶段。
          </p>
        </div>
      </div>
    </div>
  )
}

const REFERENCE_WIDTH_KEY = 'reference_sidebar_width'
const REFERENCE_OPEN_KEY = 'editor_reference_open'

const WritingEditorPage: React.FC = () => {
  const { projectId, chapterId } = useParams<{ projectId: string; chapterId: string }>()
  const navigate = useNavigate()
  const editorRef = useRef<MarkdownEditorRef>(null)
  const { success: notifySuccess, error: notifyError } = useNotifications()
  const aiWriter = useSettingsStore(s => s.ai.writer)
  const showAiMode = aiWriter && !AI_UI_FROZEN
  const editorPrefs = useSettingsStore(s => s.editor)

  const [project, setProject] = useState<Project | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [content, setContent] = useState('')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showProjectMetadata, setShowProjectMetadata] = useState(false)
  const [editorMode, setEditorMode] = useState<EditorMode>('pure')

  const [referenceWidth] = useState(() => {
    const saved = localStorage.getItem(REFERENCE_WIDTH_KEY)
    const parsed = saved ? parseInt(saved, 10) : 280
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 280
  })

  useEffect(() => {
    if (editorPrefs.referenceSidebar && window.innerWidth >= 1024) {
      setEditorMode('reference')
    }
  }, [editorPrefs.referenceSidebar])

  useEffect(() => {
    if (!showAiMode && editorMode === 'ai') {
      setEditorMode('pure')
    }
  }, [showAiMode, editorMode])

  useEffect(() => {
    if (!projectId || !chapterId) {
      setLoading(false)
      return
    }
    loadData(projectId, chapterId)
  }, [projectId, chapterId])

  useEffect(() => {
    const checkWidth = () => {
      if (window.innerWidth < 1024 && editorMode === 'reference') {
        setEditorMode('pure')
      }
    }
    window.addEventListener('resize', checkWidth)
    return () => window.removeEventListener('resize', checkWidth)
  }, [editorMode])

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

  const loadData = async (pId: string, cId: string) => {
    try {
      setLoading(true)
      setError(null)
      const projectData = await projectsApi.getById(pId)
      if (!getWorkPermissions(projectData).body) {
        navigate(workDetailPath(pId), { replace: true })
        return
      }
      const [chaptersData, chapterData] = await Promise.all([
        chaptersApi.getByProjectId(pId),
        chaptersApi.getById(cId),
      ])
      setProject(projectData)
      setChapters(chaptersData)
      setChapter(chapterData)
      setContent(chapterData.content || '')
      setHasUnsavedChanges(false)
    } catch (err: unknown) {
      console.error('加载数据失败:', err)
      const message = err instanceof Error ? err.message : ''
      if (message.includes('Chapter')) {
        setError('加载章节失败，找不到指定章节')
      } else {
        setError('加载项目数据失败')
      }
    } finally {
      setLoading(false)
    }
  }

  const refreshChapters = async () => {
    if (!projectId) return
    try {
      const chaptersData = await chaptersApi.getByProjectId(projectId)
      setChapters(chaptersData)
    } catch (err) {
      console.error('刷新章节列表失败:', err)
    }
  }

  const calculateWordCount = (text: string): number => {
    return text
      .replace(/[^\u4e00-\u9fa5\w]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0).length
  }

  const updateProjectWordCount = async (chapterWordCount: number) => {
    if (!project || !chapter) return
    const updatedChapters = chapters.map(c =>
      c.id === chapter.id ? { ...c, wordCount: chapterWordCount } : c
    )
    setChapters(updatedChapters)
    setChapter({ ...chapter, wordCount: chapterWordCount })
    const totalWords = updatedChapters.reduce((sum, c) => sum + (c.wordCount || 0), 0)
    try {
      const savedProject = await projectsApi.update(project.id, {
        wordCount: totalWords,
        chapterCount: updatedChapters.length,
      })
      setProject(savedProject)
    } catch {
      console.log('项目统计更新失败，但章节保存成功')
    }
  }

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    setHasUnsavedChanges(true)
    if (chapter) {
      setChapter({ ...chapter, wordCount: calculateWordCount(newContent) })
    }
  }

  const handleSave = async (saveContent?: string) => {
    if (!chapter) return
    const contentToSave = saveContent || content
    const newWordCount = calculateWordCount(contentToSave)
    try {
      setSaving(true)
      const updatedChapter = await chaptersApi.update(chapter.id, {
        content: contentToSave,
        wordCount: newWordCount,
      })
      setChapter(updatedChapter)
      await updateProjectWordCount(newWordCount)
      setHasUnsavedChanges(false)
      setLastSaved(new Date())
    } catch (err) {
      console.error('Error saving chapter:', err)
      throw err
    } finally {
      setSaving(false)
    }
  }

  const handleEditorSave = async (saveContent: string, context: 'autosave' | 'shortcut') => {
    try {
      await handleSave(saveContent)
      if (context === 'shortcut') {
        notifySuccess('保存成功', '章节内容已保存')
      }
    } catch {
      notifyError('保存失败', '请检查网络后重试')
    }
  }

  const runWithSaveGuard = async (action: () => void) => {
    if (hasUnsavedChanges && chapter) {
      try {
        await handleSave()
        notifySuccess('自动保存成功', '已保存当前章节更改')
      } catch {
        notifyError('保存失败', '无法离开当前页面，请稍后重试')
        return
      }
    }
    action()
  }

  const handleGuardedNavigate = (to: string) => {
    void runWithSaveGuard(() => navigate(to))
  }

  const handleChapterSelect = async (selectedChapter: Chapter) => {
    await runWithSaveGuard(() => {
      navigate(writingChapterPath(projectId!, selectedChapter.id))
    })
  }

  const handleGoBack = async () => {
    await runWithSaveGuard(() => {
      if (projectId) navigate(workDetailPath(projectId))
    })
  }

  const handleManualSave = async () => {
    try {
      await handleSave()
      notifySuccess('保存成功', '章节内容已保存')
    } catch {
      notifyError('保存失败', '请检查网络后重试')
    }
  }

  const handleApplyAIContent = (contentToInsert: string) => {
    if (editorRef.current) {
      editorRef.current.insertContent(contentToInsert)
      notifySuccess('已插入内容', 'AI 生成内容已插入编辑器')
    }
  }

  const setMode = (mode: EditorMode) => {
    setEditorMode(mode)
    if (mode === 'reference') {
      localStorage.setItem(REFERENCE_OPEN_KEY, 'true')
    } else if (mode === 'pure') {
      localStorage.setItem(REFERENCE_OPEN_KEY, 'false')
    }
  }

  const toggleReference = () => {
    const newMode = editorMode === 'reference' ? 'pure' : 'reference'
    if (newMode === 'reference' && window.innerWidth < 1024) return
    setMode(newMode)
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">{error}</div>
          <div className="space-x-2">
            <button
              type="button"
              onClick={() => projectId && navigate(workDetailPath(projectId))}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              返回
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              重新加载
            </button>
          </div>
        </div>
      </div>
    )
  }

  if ((!chapter && !loading) || !chapterId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p>请选择要编辑的章节</p>
          <button
            type="button"
            onClick={() => projectId && navigate(workDetailPath(projectId))}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            返回作品详情
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="writing-editor-shell h-full flex flex-col">
      <WritingEditorNav
        project={project}
        chapter={chapter}
        editorMode={editorMode}
        showAiMode={showAiMode}
        hasUnsavedChanges={hasUnsavedChanges}
        lastSaved={lastSaved}
        saving={saving}
        onGoBack={() => void handleGoBack()}
        onSave={() => void handleManualSave()}
        onSetMode={setMode}
        onToggleReference={toggleReference}
        onGuardedNavigate={handleGuardedNavigate}
      />

      <div className="flex-1 flex overflow-hidden min-h-0">
        {project && (
          <div className="bg-gray-100 border-r border-gray-300 shadow-lg h-full">
            <ProjectNavigationPanel
              project={project}
              chapters={chapters}
              currentChapter={chapter}
              onChapterSelect={handleChapterSelect}
              onProjectSettings={() => setShowProjectMetadata(true)}
              onChaptersRefresh={refreshChapters}
              className="flex-shrink-0"
            />
          </div>
        )}

        {project && (
          <div className="w-1 bg-gradient-to-b from-gray-300 via-gray-400 to-gray-300 shadow-sm" />
        )}

        <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-white relative z-20 shadow-xl border-y border-gray-200">
          <MarkdownEditor
            ref={editorRef}
            key={chapterId}
            initialContent={content}
            onEditorSave={handleEditorSave}
            onContentChange={handleContentChange}
            autoSave={editorPrefs.autoSave}
            autoSaveDelay={editorPrefs.autoSaveDelay}
          />
        </div>

        {editorMode !== 'pure' && (
          <>
            <div className="w-1 bg-gradient-to-b from-gray-300 via-gray-400 to-gray-300 shadow-sm" />
            {editorMode === 'reference' && projectId && project && chapter && (
              <ReferenceSidebar
                projectId={projectId}
                width={referenceWidth}
                workSetting={getWorkSetting(project.metadata as Record<string, unknown>)}
                chapterSummary={chapter.summary}
                chapterLabel={`第 ${chapter.order} 章 · ${chapter.title}`}
              />
            )}
            {showAiMode && editorMode === 'ai' && (
              <AIAssistantPanel
                onClose={() => setMode('pure')}
                onApplyContent={handleApplyAIContent}
                projectId={project?.id}
                chapterId={chapter?.id}
              />
            )}
            {editorMode === 'review' && (
              <ReviewPlaceholder onClose={() => setMode('pure')} />
            )}
          </>
        )}
      </div>

      {showProjectMetadata && project && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setShowProjectMetadata(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white rounded-lg shadow-2xl w-[680px] h-[75vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute top-3 right-3 z-10">
              <button
                type="button"
                onClick={() => setShowProjectMetadata(false)}
                className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <ContentMetadataCard
              metadata={project.metadata}
              className="h-full border-0 shadow-none rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default WritingEditorPage
