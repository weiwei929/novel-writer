import { IconArrowLeft, IconSave } from '../components/ui/icons'
import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MarkdownEditor, { MarkdownEditorRef } from '../components/editor/MarkdownEditor'
import ProjectNavigationPanel from '../components/editor/ProjectNavigationPanel'
import ContentMetadataCard from '../components/metadata/ContentMetadataCard'
import AIAssistantPanel from '../components/writer/AIAssistantPanel'
import ReferenceSidebar from '../components/writer/ReferenceSidebar'
import { projectsApi, chaptersApi, Project, Chapter } from '../services/api'
import { AI_UI_FROZEN } from '../config/aiFreeze'
import { useNotifications } from '../hooks/useNotifications'
import { useSettingsStore } from '../stores/settingsStore'

type EditorMode = 'pure' | 'reference' | 'ai' | 'review'

function ModeButton({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
        active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      {label}
    </button>
  )
}

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
  const { success: notifySuccess } = useNotifications()
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
      const [projectData, chaptersData, chapterData] = await Promise.all([
        projectsApi.getById(pId),
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
      setError('保存章节失败')
      console.error('Error saving chapter:', err)
      throw err
    } finally {
      setSaving(false)
    }
  }

  const handleChapterSelect = async (selectedChapter: Chapter) => {
    if (hasUnsavedChanges && chapter) {
      try {
        await handleSave()
        notifySuccess('自动保存成功', '已保存当前章节更改')
      } catch {
        // handleSave 已设置 error
      }
    }
    navigate(`/writing/${projectId}/${selectedChapter.id}`)
  }

  const handleGoBack = async () => {
    if (hasUnsavedChanges && chapter) {
      try {
        await handleSave()
        notifySuccess('自动保存成功', '已保存当前章节更改')
      } catch {
        // handleSave 已设置 error
      }
    }
    navigate(`/work/${projectId}`)
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
              onClick={() => navigate(`/work/${projectId}`)}
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
            onClick={() => navigate(`/work/${projectId}`)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            返回作品详情
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <div className="bg-white border-b px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={handleGoBack}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 shrink-0"
            title="返回作品详情"
          >
            <IconArrowLeft size={18} />
            <span className="text-xs hidden sm:inline">返回</span>
          </button>
          <div className="h-5 w-px bg-gray-200" />
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-gray-900 truncate">
              {project?.title || '加载中...'}
            </h1>
            {chapter && (
              <div className="text-xs text-gray-400">
                第 {chapter.order} 章 · {chapter.title}
                {hasUnsavedChanges && <span className="text-amber-500 ml-1">● 未保存</span>}
                {lastSaved && !hasUnsavedChanges && (
                  <span className="ml-1">· {lastSaved.toLocaleTimeString()}</span>
                )}
                <span className="ml-1">· {chapter.wordCount?.toLocaleString() || 0} 字</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-0.5">
            <ModeButton
              active={editorMode === 'pure'}
              label="写作"
              onClick={() => setMode('pure')}
            />
            <ModeButton
              active={editorMode === 'reference'}
              label="参考"
              onClick={toggleReference}
            />
            {showAiMode && (
              <ModeButton
                active={editorMode === 'ai'}
                label="AI"
                onClick={() => setMode(editorMode === 'ai' ? 'pure' : 'ai')}
              />
            )}
            <ModeButton
              active={editorMode === 'review'}
              label="审阅"
              onClick={() => setMode(editorMode === 'review' ? 'pure' : 'review')}
            />
          </div>

          <div className="h-5 w-px bg-gray-200 mx-1" />

          {chapter && (
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saving || !hasUnsavedChanges}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium transition-colors"
            >
              <IconSave size={14} />
              {saving ? '...' : '保存'}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
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

        <div className="flex-1 flex flex-col overflow-hidden bg-white relative z-20 shadow-xl border-y border-gray-200">
          <MarkdownEditor
            ref={editorRef}
            key={chapterId}
            initialContent={content}
            onSave={handleSave}
            onContentChange={handleContentChange}
            autoSave={editorPrefs.autoSave}
            autoSaveDelay={editorPrefs.autoSaveDelay}
          />
        </div>

        {editorMode !== 'pure' && (
          <>
            <div className="w-1 bg-gradient-to-b from-gray-300 via-gray-400 to-gray-300 shadow-sm" />
            {editorMode === 'reference' && projectId && (
              <ReferenceSidebar projectId={projectId} width={referenceWidth} />
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
