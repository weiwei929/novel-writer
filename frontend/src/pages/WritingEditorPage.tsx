import { IconAlert, IconArrowLeft, IconCheck, IconLoading, IconSave } from '../components/ui/icons'
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
import { getWorkPermissions } from '../services/workPermissions'
import { getWorkSetting } from '../services/workSetting'
import { saveDraft, getDraft, clearDraft, hasUnsavedDraft, LocalDraft } from '../utils/draftStorage'

function workDetailPath(projectId: string) {
  return `/work/${projectId}?from=writing`
}

function writingChapterPath(projectId: string, chapterId: string) {
  return `/writing/${projectId}/${chapterId}?from=writing`
}

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
  /** 保存失败态，独立于页面级 error（避免整页错误屏遮住正文，见执行卡任务 3） */
  const [saveError, setSaveError] = useState<string | null>(null)
  const [pendingDraft, setPendingDraft] = useState<LocalDraft | null>(null)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const draftTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showProjectMetadata, setShowProjectMetadata] = useState(false)
  const [showChapterNav, setShowChapterNav] = useState(false)
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

  useEffect(() => {
    if (!showChapterNav) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowChapterNav(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [showChapterNav])

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

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
      const serverContent = chapterData.content || ''
      setContent(serverContent)
      setHasUnsavedChanges(false)
      setSaveError(null)

      if (hasUnsavedDraft(pId, cId, serverContent)) {
        const draft = getDraft(pId, cId)
        setPendingDraft(draft)
      } else {
        setPendingDraft(null)
      }
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
      if (projectId) {
        if (draftTimeoutRef.current) clearTimeout(draftTimeoutRef.current)
        draftTimeoutRef.current = setTimeout(() => {
          saveDraft(projectId, chapter.id, newContent)
        }, 800)
      }
    }
  }

  const handleRestoreDraft = () => {
    if (!pendingDraft) return
    setContent(pendingDraft.content)
    setHasUnsavedChanges(true)
    if (chapter) {
      setChapter({ ...chapter, wordCount: calculateWordCount(pendingDraft.content) })
    }
    notifySuccess('已成功恢复本地暂存草稿')
    setPendingDraft(null)
  }

  const handleDiscardDraft = () => {
    if (projectId && chapter) {
      clearDraft(projectId, chapter.id)
    }
    setPendingDraft(null)
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
      setSaveError(null)

      if (projectId) {
        clearDraft(projectId, chapter.id)
      }
      setPendingDraft(null)
    } catch (err) {
      setSaveError('保存失败，点击重试')
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
        // handleSave 已设置 saveError，切章前的保存失败不阻断导航
      }
    }
    navigate(writingChapterPath(projectId!, selectedChapter.id))
    setShowChapterNav(false)
  }

  const handleGoBack = async () => {
    if (hasUnsavedChanges && chapter) {
      try {
        await handleSave()
        notifySuccess('自动保存成功', '已保存当前章节更改')
      } catch {
        // handleSave 已设置 saveError，返回前的保存失败不阻断导航
      }
    }
    if (projectId) navigate(workDetailPath(projectId))
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
            <div className="text-[11px] text-gray-400 font-normal truncate">
              作品：《{project?.title || '加载中...'}》
            </div>
            {chapter && (
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-bold text-indigo-900 truncate">
                  当前写作：第 {chapter.order} 章 · {chapter.title}
                </h1>
                <div className="text-xs text-gray-500 flex items-center gap-1.5">
                  {isOffline ? (
                    <span className="inline-flex items-center gap-1 text-amber-600 font-medium" title="网络离线，修改已保存在本地">
                      <IconAlert size={12} />
                      离线保存中（已存本地）
                    </span>
                  ) : saveError ? (
                    <button
                      type="button"
                      onClick={() => handleSave()}
                      className="inline-flex items-center gap-1 text-amber-600 font-medium hover:text-amber-700"
                      title="点击重试保存"
                    >
                      <IconAlert size={12} />
                      {saveError}
                    </button>
                  ) : saving ? (
                    <span className="inline-flex items-center gap-1 text-indigo-600">
                      <IconLoading size={12} />
                      正在保存…
                    </span>
                  ) : hasUnsavedChanges ? (
                    <span className="text-amber-600 font-medium">● 编辑中…</span>
                  ) : lastSaved ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                      <IconCheck size={12} />
                      已保存 · {lastSaved.toLocaleTimeString()}
                    </span>
                  ) : null}
                  <span>· {chapter.wordCount?.toLocaleString() || 0} 字</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {chapter && (
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saving || !hasUnsavedChanges}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium transition-colors shadow-sm"
            >
              <IconSave size={14} />
              {saving ? '保存中...' : '保存正文'}
            </button>
          )}
        </div>
      </div>

      {pendingDraft && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-xs text-amber-900 shrink-0 animate-fadeIn">
          <div className="flex items-center gap-2 min-w-0">
            <IconAlert size={16} className="text-amber-600 shrink-0" />
            <span className="truncate">
              检测到本地存在未经同步的编辑草稿（上次修改于{' '}
              {new Date(pendingDraft.updatedAt).toLocaleTimeString()}）
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <button
              type="button"
              onClick={handleRestoreDraft}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium transition-colors shadow-sm"
            >
              一键恢复
            </button>
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-700 border border-amber-300 rounded transition-colors"
            >
              忽略
            </button>
          </div>
        </div>
      )}

      {/* 创作室自然三栏经典布局 (Natural Three-Column Layout) */}
      <div className="flex-1 flex overflow-hidden relative bg-gray-50">
        {/* 👈 左栏：【章节栏】 (上下布局：上为本章梗概，下为章节列表) */}
        {project && chapter && (
          <div className="w-72 shrink-0 h-full border-r border-gray-200 bg-white flex flex-col overflow-hidden select-none">
            {/* 上部：本章节梗概 */}
            <div className="p-3.5 border-b border-gray-100 bg-indigo-50/40">
              <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                本章节大纲梗概
              </div>
              <div className="text-xs text-gray-700 bg-white border border-indigo-100/80 rounded-lg p-2.5 max-h-36 overflow-y-auto leading-relaxed shadow-2xs font-sans whitespace-pre-wrap">
                {chapter.summary?.trim() || <span className="text-gray-400 italic">企划阶段未填写本章梗概</span>}
              </div>
            </div>

            {/* 下部：章节列表 (稳固显示，去除随手误跳的危险炫技) */}
            <div className="flex-1 flex flex-col overflow-hidden p-3.5">
              <div className="text-xs font-bold text-gray-700 mb-2 flex items-center justify-between">
                <span>作品章节 ({chapters.length})</span>
                <span className="text-[10px] font-normal text-gray-400">稳定写作中</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                {chapters.map(c => {
                  const isCurrent = c.id === chapter.id
                  return (
                    <div
                      key={c.id}
                      className={`p-2 rounded-lg text-xs flex items-center justify-between border transition-all ${
                        isCurrent
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-semibold shadow-2xs'
                          : 'border-transparent text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="truncate flex-1 pr-2">
                        <span className="text-gray-400 mr-1 font-normal">第{c.order}章</span>
                        <span>{c.title}</span>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-normal shrink-0 ${
                        isCurrent ? 'bg-indigo-600 text-white' : 'text-gray-400'
                      }`}>
                        {isCurrent ? '当前写作' : `${c.wordCount || 0}字`}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* 📖 中栏：【正文打字工作区】 */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white relative z-10 border-r border-gray-200">
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

        {/* 👉 右栏：【作品设定】 (直接展示 4 项作品设定，替代原有的复杂 Tab 侧栏) */}
        {project && (
          <div className="w-80 shrink-0 h-full border-l border-gray-200 bg-white flex flex-col overflow-hidden select-none">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/70">
              <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                作品设定只读参阅
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">企划继承设定 · 时刻对照创作</p>
            </div>
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
              {(() => {
                const ws = getWorkSetting(project.metadata as Record<string, unknown>)
                const blocks = [
                  { label: '人物与关系', val: ws.charactersAndRelations },
                  { label: '时间与地点', val: ws.timeAndPlace },
                  { label: '事件与情节', val: ws.eventsAndPlot },
                  { label: '叙事风格 / 心流', val: ws.narrativeStyle },
                ]
                return blocks.map(b => (
                  <div key={b.label} className="border border-gray-100 rounded-lg p-2.5 bg-gray-50/40">
                    <div className="text-xs font-semibold text-gray-700 mb-1">{b.label}</div>
                    {b.val?.trim() ? (
                      <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed font-sans">
                        {b.val.trim()}
                      </p>
                    ) : (
                      <span className="text-xs text-gray-400 italic">企划未填写</span>
                    )}
                  </div>
                ))
              })()}
            </div>
          </div>
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
