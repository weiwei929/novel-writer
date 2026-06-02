import { IconArrowDown, IconArrowLeft, IconArrowRight, IconArrowUp, IconClose, IconDelete, IconDownload, IconFile, IconList, IconRefresh } from '../components/ui/icons'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  chaptersApi,
  projectsApi,
  workApi,
  type Chapter,
  type ChapterPlanItem,
  type WorkDetailResponse,
} from '../services/api'
import { useWorldStore } from '../stores/worldStore'
import { useNotifications } from '../hooks/useNotifications'
import ProjectStatusBadge from '../components/projects/ProjectStatusBadge'
import StageTransitionModal, {
  nextStatusForTransition,
  prevStatusForTransition,
  type StageTransitionAction,
} from '../components/projects/StageTransitionModal'
import WorldBuildingPage from './creative/WorldBuildingPage'
import ContentMetadataCard from '../components/metadata/ContentMetadataCard'
import ChapterContentModal from '../components/editor/ChapterContentModal'
import ChapterPlanningEditor from '../components/editor/ChapterPlanningEditor'
import ProjectMetadataPanel from '../components/editor/ProjectMetadataPanel'

type WorkTab = 'setting' | 'chapters' | 'metadata'

const TABS: { id: WorkTab; label: string }[] = [
  { id: 'setting', label: '作品设定' },
  { id: 'chapters', label: '章节列表' },
  { id: 'metadata', label: '元数据' },
]

function getChapterStatusLabel(status: Chapter['status']) {
  const map: Record<Chapter['status'], string> = {
    draft: '草稿',
    writing: '写作中',
    completed: '已完成',
  }
  return map[status] ?? status
}

function pickWritingChapter(chapters: Chapter[]): Chapter | null {
  if (chapters.length === 0) return null
  const sorted = [...chapters].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
  return sorted[0]
}

export default function WorkDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { success: notifySuccess, error: notifyError } = useNotifications()
  const setCurrentScope = useWorldStore(s => s.setCurrentScope)

  const [data, setData] = useState<WorkDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<WorkTab>('chapters')

  const [showPlanning, setShowPlanning] = useState(false)
  const [showMetadataEditor, setShowMetadataEditor] = useState(false)
  const [showTransition, setShowTransition] = useState(false)
  const [transitionLoading, setTransitionLoading] = useState(false)

  const [synopsisModal, setSynopsisModal] = useState<{
    order: number
    title: string
    synopsis: string
  } | null>(null)

  const [contentModal, setContentModal] = useState<{
    order: number
    title: string
    content: string
    wordCount: number
  } | null>(null)

  const [editingTitleId, setEditingTitleId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [reordering, setReordering] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    try {
      setLoading(true)
      setError(null)
      const detail = await workApi.getDetail(id)
      setData(detail)
    } catch (e) {
      console.error('加载作品详情失败:', e)
      setError('加载作品详情失败')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (id) {
      setCurrentScope({ type: 'project', id })
    }
    return () => setCurrentScope(null)
  }, [id, setCurrentScope])

  const project = data?.project
  const chapters = useMemo(
    () => [...(data?.chapters ?? [])].sort((a, b) => a.order - b.order),
    [data?.chapters]
  )

  const canEditSetting = project?.status === 'draft'
  const canEditMetadata =
    project?.status === 'draft' || project?.status === 'planning'

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('zh-CN')

  const handleEnterWriting = () => {
    if (!project) return
    const target = pickWritingChapter(chapters)
    if (target) {
      navigate(`/writing/${project.id}/${target.id}`)
    } else {
      notifyError('无法进入创作室', '请先创建章节')
    }
  }

  const handleExport = async () => {
    if (!project) return
    try {
      const blob = await projectsApi.exportProject(project.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${project.title}.md`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      notifySuccess('导出成功', '作品已下载')
    } catch {
      notifyError('导出失败', '无法导出作品')
    }
  }

  const handleRestore = async () => {
    if (!project) return
    try {
      await projectsApi.restore(project.id)
      notifySuccess('已还原', '作品已从暂存移出')
      await load()
    } catch {
      notifyError('还原失败', '无法还原作品')
    }
  }

  const handleDelete = async () => {
    if (!project) return
    if (!window.confirm(`确定要彻底删除「${project.title}」吗？此操作不可撤销。`)) return
    try {
      await projectsApi.delete(project.id)
      notifySuccess('已删除', '作品已彻底删除')
      navigate('/shelf')
    } catch {
      notifyError('删除失败', '无法删除作品')
    }
  }

  const handleTransition = async (action: StageTransitionAction, note?: string) => {
    if (!project) return
    const toMap: Record<StageTransitionAction, string | undefined> = {
      advance: nextStatusForTransition[project.status],
      retreat: prevStatusForTransition[project.status],
      shelve: 'shelved',
    }
    const to = toMap[action]
    if (!to) {
      notifyError('无法流转', '当前状态不支持该操作')
      return
    }
    try {
      setTransitionLoading(true)
      await projectsApi.transition(project.id, to, note)
      const msg =
        action === 'advance' ? '推进' : action === 'retreat' ? '回退' : '移入暂存'
      notifySuccess(`作品已${msg}`)
      setShowTransition(false)
      await load()
    } catch {
      notifyError('流转失败', '无法更新作品状态')
    } finally {
      setTransitionLoading(false)
    }
  }

  const stageManageButton = (
    <button
      type="button"
      onClick={() => setShowTransition(true)}
      disabled={transitionLoading}
      className="px-3 py-1.5 text-sm border border-amber-200 text-amber-800 rounded-lg hover:bg-amber-50 disabled:opacity-50"
    >
      阶段管理
    </button>
  )

  const startEditTitle = (chapter: Chapter) => {
    setEditingTitleId(chapter.id)
    setEditingTitle(chapter.title)
  }

  const saveTitle = async (chapterId: string) => {
    const trimmed = editingTitle.trim()
    setEditingTitleId(null)
    if (!trimmed) return
    try {
      await chaptersApi.update(chapterId, { title: trimmed })
      await load()
    } catch {
      notifyError('保存失败', '无法更新章节标题')
    }
  }

  const moveChapter = async (chapterId: string, direction: 'up' | 'down') => {
    const idx = chapters.findIndex(c => c.id === chapterId)
    if (idx === -1) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= chapters.length) return

    const current = chapters[idx]
    const swap = chapters[swapIdx]

    try {
      setReordering(true)
      await Promise.all([
        chaptersApi.update(current.id, { order: swap.order }),
        chaptersApi.update(swap.id, { order: current.order }),
      ])
      await load()
    } catch {
      notifyError('排序失败', '无法调整章节顺序')
    } finally {
      setReordering(false)
    }
  }

  const renderActions = () => {
    if (!project) return null

    switch (project.status) {
      case 'draft':
        return (
          <>
            <button
              onClick={() => setActiveTab('setting')}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              编辑作品设定
            </button>
            {stageManageButton}
          </>
        )
      case 'planning':
        return (
          <>
            <button
              onClick={() => setShowPlanning(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm"
            >
              <IconList size={14} />
              管理章节规划
            </button>
            <button
              onClick={() => setShowMetadataEditor(true)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              编辑元数据
            </button>
            {stageManageButton}
          </>
        )
      case 'writing':
        return (
          <>
            <button
              onClick={handleEnterWriting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              <IconArrowRight size={14} />
              进入创作室
            </button>
            <button
              onClick={() => setShowPlanning(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm"
            >
              <IconList size={14} />
              管理章节规划
            </button>
            {stageManageButton}
          </>
        )
      case 'reviewing':
        return stageManageButton
      case 'completed':
        return (
          <>
            <button
              onClick={() => void handleExport()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-green-200 text-green-700 rounded-lg hover:bg-green-50 text-sm"
            >
              <IconDownload size={14} />
              导出
            </button>
            {stageManageButton}
          </>
        )
      case 'archived':
        return null
      case 'shelved':
        return (
          <>
            <button
              onClick={() => void handleRestore()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 text-sm"
            >
              <IconRefresh size={14} />
              还原
            </button>
            <button
              onClick={() => void handleDelete()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm"
            >
              <IconDelete size={14} />
              彻底删除
            </button>
          </>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-sm">加载中...</span>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-700">
          {error || '作品不存在'}
        </div>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm"
        >
          返回首页
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* 顶部栏 */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 shrink-0"
            title="返回"
          >
            <IconArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 truncate">{project.title}</h1>
          <ProjectStatusBadge status={project.status} />
          {data?.proposal && (
            <span className="text-xs text-gray-400 shrink-0">来自企划建议书</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">{renderActions()}</div>
      </div>

      {/* Tab 导航 */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 内容 */}
      {activeTab === 'setting' && (
        <div>
          <WorldBuildingPage readOnly={!canEditSetting} />
        </div>
      )}

      {activeTab === 'chapters' && (
        <div className="bg-white rounded-lg border shadow-sm flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconFile size={14} className="text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900">
                章节列表
                <span className="text-gray-400 font-normal ml-1">({chapters.length})</span>
              </h3>
            </div>
            <span className="text-xs text-gray-400">
              总 {project.wordCount.toLocaleString()} 字
            </span>
          </div>

          {chapters.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 text-gray-500">
              <IconFile className="w-10 h-10 mb-3 text-gray-300" />
              <p className="text-sm mb-1">暂无章节</p>
              <p className="text-xs text-gray-400 mb-4">使用「管理章节规划」创建章节框架</p>
              {(project.status === 'planning' || project.status === 'writing') && (
                <button
                  onClick={() => setShowPlanning(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  <IconList size={14} />
                  管理章节规划
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {chapters.map((c, index) => {
                const hasSynopsis = !!(c.summary && c.summary.trim())
                const hasContent = !!(c.content && c.content.trim())
                const isEditing = editingTitleId === c.id

                return (
                  <div
                    key={c.id}
                    className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button
                          type="button"
                          disabled={index === 0 || reordering}
                          onClick={() => void moveChapter(c.id, 'up')}
                          className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                          title="上移"
                        >
                          <IconArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={index === chapters.length - 1 || reordering}
                          onClick={() => void moveChapter(c.id, 'down')}
                          className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                          title="下移"
                        >
                          <IconArrowDown size={14} />
                        </button>
                      </div>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600 shrink-0">
                        第 {c.order} 章
                      </span>
                      {isEditing ? (
                        <input
                          autoFocus
                          value={editingTitle}
                          onChange={e => setEditingTitle(e.target.value)}
                          onBlur={() => void saveTitle(c.id)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') void saveTitle(c.id)
                            if (e.key === 'Escape') setEditingTitleId(null)
                          }}
                          className="flex-1 min-w-0 text-sm font-medium border border-blue-300 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEditTitle(c)}
                          className="font-medium text-sm text-gray-800 truncate text-left hover:text-blue-600"
                          title="点击编辑标题"
                        >
                          {c.title || `第 ${c.order} 章`}
                        </button>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-400 shrink-0">
                        <span>{c.wordCount.toLocaleString()} 字</span>
                        <span>·</span>
                        <span>{formatDate(c.updatedAt)}</span>
                        <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">
                          {getChapterStatusLabel(c.status)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {hasSynopsis && (
                        <button
                          onClick={() =>
                            setSynopsisModal({
                              order: c.order,
                              title: c.title,
                              synopsis: c.summary!,
                            })
                          }
                          className="text-xs px-2 py-1 rounded text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                        >
                          梗概
                        </button>
                      )}
                      {hasContent && (
                        <button
                          onClick={() =>
                            setContentModal({
                              order: c.order,
                              title: c.title,
                              content: c.content,
                              wordCount: c.wordCount,
                            })
                          }
                          className="text-xs px-2 py-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                        >
                          正文
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/writing/${project.id}/${c.id}`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 border border-blue-200 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-xs font-medium"
                      >
                        <IconArrowRight size={12} />
                        写作
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'metadata' && (
        <ContentMetadataCard
          metadata={project.metadata}
          onEdit={canEditMetadata ? () => setShowMetadataEditor(true) : undefined}
        />
      )}

      {/* 章节梗概弹窗 */}
      {synopsisModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setSynopsisModal(null)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white rounded-lg shadow-2xl w-[640px] max-h-[80vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <h3 className="text-sm font-medium text-gray-900">
                第 {synopsisModal.order} 章 · {synopsisModal.title}
                <span className="text-gray-400 font-normal ml-2">— 章节梗概</span>
              </h3>
              <button
                onClick={() => setSynopsisModal(null)}
                className="p-1 hover:bg-gray-100 rounded text-gray-400"
              >
                <IconClose size={18} />
              </button>
            </div>
            <div className="px-5 py-4 overflow-y-auto text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {synopsisModal.synopsis}
            </div>
          </div>
        </div>
      )}

      <ChapterContentModal
        open={!!contentModal}
        order={contentModal?.order ?? 0}
        title={contentModal?.title ?? ''}
        content={contentModal?.content ?? ''}
        wordCount={contentModal?.wordCount ?? 0}
        onClose={() => setContentModal(null)}
      />

      {showPlanning && (
        <ChapterPlanningEditor
          projectId={project.id}
          initialPlans={(project.metadata as Record<string, unknown>)?.chapterPlanning as ChapterPlanItem[] || []}
          onClose={() => setShowPlanning(false)}
          onSaved={() => {
            setShowPlanning(false)
            notifySuccess('章节规划已更新')
            void load()
          }}
        />
      )}

      {showMetadataEditor && (
        <ProjectMetadataPanel
          project={project}
          onClose={async () => {
            setShowMetadataEditor(false)
            await load()
          }}
          initialField="synopsis"
          initialMode="view_all"
        />
      )}

      <StageTransitionModal
        open={showTransition}
        project={project}
        onConfirm={(action, note) => void handleTransition(action, note)}
        onCancel={() => setShowTransition(false)}
      />
    </div>
  )
}
