import { IconArrowDown, IconArrowLeft, IconArrowRight, IconArrowUp, IconFile, IconList } from '../components/ui/icons'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  chaptersApi,
  workApi,
  type Chapter,
  type ChapterPlanItem,
  type WorkDetailResponse,
} from '../services/api'
import { useWorldStore } from '../stores/worldStore'
import { useNotifications } from '../hooks/useNotifications'
import ProjectStatusBadge from '../components/projects/ProjectStatusBadge'
import type { PhaseContext } from '../services/statusLabels'
import WorldBuildingPage from './creative/WorldBuildingPage'
import ContentMetadataCard from '../components/metadata/ContentMetadataCard'
import ChapterContentModal from '../components/editor/ChapterContentModal'
import WorkChapterEditor from '../components/editor/WorkChapterEditor'
import WorkMetadataPanel from '../components/editor/WorkMetadataPanel'

// === 作品元数据 / 作品章节 / 作品正文 / 创作资料 ===
type WorkTab = 'synopsis' | 'chapters' | 'body' | 'world'

const TABS: { id: WorkTab; label: string }[] = [
  { id: 'synopsis', label: '作品元数据' },
  { id: 'chapters', label: '作品章节' },
  { id: 'body', label: '作品正文' },
  { id: 'world', label: '创作资料' },
]

function getChapterStatusLabel(status: Chapter['status']) {
  const map: Record<Chapter['status'], string> = {
    draft: '写作中',
    written: '已完成',
  }
  return map[status] ?? status
}

/**
 * work.synopsis — 作品梗概，Work 语义的真相源。
 * 存储位置：metadata.synopsis（legacy），远期迁移为独立字段。
 * 读取：metadata.synopsis → description（legacy fallback）。
 */
function getWorkSynopsis(
  description: string | undefined | null,
  metadata: Record<string, any> | undefined | null,
): string {
  if (metadata?.synopsis && typeof metadata.synopsis === 'string') return metadata.synopsis
  if (description) return description
  return ''
}

/** 按作品状态返回各区的可写权限 */
function getWorkPermissions(status: string) {
  switch (status) {
    case 'draft':      return { synopsis: true, chapters: true, body: true, world: true }
    case 'planning':   return { synopsis: true, chapters: true, body: false, world: true }
    case 'writing':    return { synopsis: true, chapters: true, body: true, world: true }
    case 'reviewing':  return { synopsis: false, chapters: false, body: true, world: false }
    default:           return { synopsis: false, chapters: false, body: false, world: false }
  }
}

/** 当前作品状态是否有任何可写权限 */
function hasAnyPermission(perms: ReturnType<typeof getWorkPermissions>) {
  return perms.synopsis || perms.chapters || perms.body || perms.world
}

/** 获取各 Tab 的编辑态按钮文案 */
function getEditActionLabel(tab: WorkTab): string {
  switch (tab) {
    case 'synopsis': return '编辑作品元数据'
    case 'chapters': return '编辑作品章节'
    case 'body':     return '编辑正文'
    default:         return '编辑'
  }
}

export default function WorkDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { success: notifySuccess, error: notifyError } = useNotifications()
  const setCurrentScope = useWorldStore(s => s.setCurrentScope)

  const [data, setData] = useState<WorkDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<WorkTab>('synopsis')

  // === 页面级编辑态门控：默认只读 ===
  const [isEditing, setIsEditing] = useState(false)

  const [showPlanning, setShowPlanning] = useState(false)
  const [showMetadataEditor, setShowMetadataEditor] = useState(false)

  const [collapsedSynopses, setCollapsedSynopses] = useState<Set<string>>(new Set())

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

  const work = data?.project
  const chapters = useMemo(
    () => [...(data?.chapters ?? [])].sort((a, b) => a.order - b.order),
    [data?.chapters]
  )

  const workSynopsis = useMemo(
    () => getWorkSynopsis(work?.description, work?.metadata),
    [work?.description, work?.metadata]
  )

  const permissions = useMemo(
    () => (work ? getWorkPermissions(work.status) : { synopsis: false, chapters: false, body: false, world: false }),
    [work?.status]
  )

  const canEverEdit = hasAnyPermission(permissions)

  // 当前 Tab 是否有编辑权限（页面级编辑态 + 分区权限）
  const canEditCurrentTab = isEditing && permissions[activeTab]

  const [searchParams] = useSearchParams()
  const from = searchParams.get('from')
  const isPlanningContext = from === 'planning'
  const badgePhase: PhaseContext | undefined =
    from === 'planning'
      ? 'planning'
      : from === 'writing'
        ? 'studio'
        : from === 'editorial'
          ? 'editorial'
          : from === 'library'
            ? 'library'
            : undefined

  const handleBack = useCallback(() => {
    setIsEditing(false)
    if (isPlanningContext) {
      if (work?.status === 'planning') {
        navigate('/planning/in-progress')
      } else if (work?.status === 'planned') {
        navigate('/planning/projects')
      } else {
        navigate('/planning/proposals')
      }
      return
    }
    if (from === 'writing') {
      navigate('/writing/projects')
      return
    }
    if (from === 'editorial') {
      navigate('/editorial')
      return
    }
    if (from === 'library') {
      navigate('/library')
      return
    }
    navigate(-1)
  }, [isPlanningContext, from, work?.status, navigate])

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('zh-CN')

  const startEditTitle = (chapter: Chapter) => {
    if (!isEditing) return
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
    if (!isEditing) return
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

  const toggleSynopsis = (chapterId: string) => {
    setCollapsedSynopses(prev => {
      const next = new Set(prev)
      if (next.has(chapterId)) next.delete(chapterId)
      else next.add(chapterId)
      return next
    })
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

  if (error || !work) {
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
      {/* 顶部栏 — 标题 + 状态 + 编辑态门控 */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => void handleBack()}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 shrink-0"
          title="返回"
        >
          <IconArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900 truncate">{work.title}</h1>
        <ProjectStatusBadge status={work.status} phase={badgePhase} />
        {data?.proposal && (
          <span className="text-xs text-gray-400 shrink-0">来自企划建议书</span>
        )}

        {/* 页面级编辑态门控 */}
        <div className="ml-auto">
          {canEverEdit && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              编辑作品详情
            </button>
          )}
          {isEditing && (
            <button
              onClick={() => { setIsEditing(false); setEditingTitleId(null) }}
              className="text-xs px-3 py-1.5 border border-gray-300 text-gray-600 rounded hover:bg-gray-50 transition-colors"
            >
              退出编辑
            </button>
          )}
        </div>
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

      {/* ─── 作品元数据 ─── */}
      {activeTab === 'synopsis' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">作品元数据</h2>
              {canEditCurrentTab && (
                <button
                  onClick={() => setShowMetadataEditor(true)}
                  className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                >
                  {getEditActionLabel('synopsis')}
                </button>
              )}
            </div>

            <div className="mb-4">
              <div className="text-xs text-gray-400 mb-1">作品标题</div>
              <div className="text-base font-bold text-gray-900">{work.title}</div>
            </div>

            <div className="mb-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-gray-400">作品梗概</span>
                {!workSynopsis && (
                  <span className="text-xs text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">待填写</span>
                )}
              </div>
              {workSynopsis ? (
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-lg p-3 border border-gray-100">
                  {workSynopsis}
                </div>
              ) : (
                <div className="text-sm text-gray-400 italic bg-gray-50 rounded-lg p-3 border border-gray-100">
                  尚未填写作品梗概。梗概是创作时最重要的参照。
                  {canEditCurrentTab && ' 点击右上角「编辑作品元数据」开始填写。'}
                </div>
              )}
              {work.description && (work.metadata as any)?.synopsis && work.description !== (work.metadata as any).synopsis && (
                <div className="text-xs text-gray-400 mt-1">
                  ℹ️ 梗概当前存储在内容元数据中，与项目描述字段不同。将来会统一为 work.synopsis。
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-gray-100">
              {work.author && (
                <div>
                  <div className="text-xs text-gray-400">作者</div>
                  <div className="text-sm text-gray-700">{work.author}</div>
                </div>
              )}
              {work.tags && work.tags.length > 0 && (
                <div>
                  <div className="text-xs text-gray-400">标签</div>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {work.tags.map((t: string) => (
                      <span key={t} className="text-xs px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">{t}</span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <div className="text-xs text-gray-400">总字数</div>
                <div className="text-sm text-gray-700">{work.wordCount.toLocaleString()} 字</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">创建时间</div>
                <div className="text-sm text-gray-700">{formatDate(work.createdAt)}</div>
              </div>
            </div>
          </div>

          <ContentMetadataCard
            metadata={work.metadata}
            onEdit={canEditCurrentTab ? () => setShowMetadataEditor(true) : undefined}
          />
        </div>
      )}

      {/* ─── 作品章节 ─── */}
      {activeTab === 'chapters' && (
        <div className="bg-white rounded-lg border shadow-sm flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconFile size={14} className="text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900">
                作品章节
                <span className="text-gray-400 font-normal ml-1">({chapters.length})</span>
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {canEditCurrentTab && (
                <button
                  onClick={() => setShowPlanning(true)}
                  className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                >
                  {getEditActionLabel('chapters')}
                </button>
              )}
              <span className="text-xs text-gray-400">
                总 {work.wordCount.toLocaleString()} 字
              </span>
            </div>
          </div>

          {chapters.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 text-gray-500">
              <IconFile className="w-10 h-10 mb-3 text-gray-300" />
              <p className="text-sm mb-1">暂无章节</p>
              <p className="text-xs text-gray-400 mb-4">使用「编辑作品章节」创建章节框架</p>
              {canEditCurrentTab && (
                <button
                  onClick={() => setShowPlanning(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  <IconList size={14} />
                  编辑作品章节
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {chapters.map((c, index) => {
                const hasSynopsis = !!(c.summary && c.summary.trim())
                const hasContent = !!(c.content && c.content.trim())
                const isEditingTitle = editingTitleId === c.id
                const isSynopsisOpen = !collapsedSynopses.has(c.id)

                return (
                  <div key={c.id} className="px-4 py-3 hover:bg-gray-50">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {/* 上下箭头 — 仅编辑态可见 */}
                        {isEditing && (
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
                        )}
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600 shrink-0">
                          第 {c.order} 章
                        </span>
                        {isEditingTitle ? (
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
                            className={`font-medium text-sm text-gray-800 truncate text-left ${
                              isEditing ? 'hover:text-blue-600 cursor-pointer' : 'cursor-default'
                            }`}
                            title={isEditing ? '点击编辑标题' : undefined}
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
                            onClick={() => toggleSynopsis(c.id)}
                            className={`text-xs px-2 py-1 rounded transition-colors ${
                              isSynopsisOpen
                                ? 'text-amber-700 bg-amber-100'
                                : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                            }`}
                          >
                            {isSynopsisOpen ? '收起梗概' : '梗概'}
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
                        {!isPlanningContext && isEditing && (
                          <button
                            onClick={() => navigate(`/writing/${work.id}/${c.id}`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 border border-blue-200 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-xs font-medium"
                          >
                            <IconArrowRight size={12} />
                            进入正文编辑
                          </button>
                        )}
                        {!isPlanningContext && !isEditing && hasContent && (
                          <button
                            onClick={() =>
                              setContentModal({
                                order: c.order,
                                title: c.title,
                                content: c.content,
                                wordCount: c.wordCount,
                              })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 border border-gray-200 text-gray-500 rounded hover:bg-gray-50 text-xs font-medium"
                          >
                            <IconArrowRight size={12} />
                            查看正文
                          </button>
                        )}
                      </div>
                    </div>

                    {hasSynopsis && isSynopsisOpen && (
                      <div className="mt-2 ml-10 pl-3 border-l-2 border-amber-200">
                        <div className="text-xs text-amber-600 mb-1 font-medium">章节梗概</div>
                        <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                          {c.summary}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── 作品正文 ─── */}
      {activeTab === 'body' && (
        <div className="bg-white rounded-lg border shadow-sm flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconFile size={14} className="text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900">
                作品正文
                <span className="text-gray-400 font-normal ml-1">({chapters.length} 章)</span>
              </h3>
            </div>
            <span className="text-xs text-gray-400">
              总 {work.wordCount.toLocaleString()} 字
            </span>
          </div>

          {chapters.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 text-gray-500">
              <IconFile className="w-10 h-10 mb-3 text-gray-300" />
              <p className="text-sm mb-1">暂无章节</p>
              <p className="text-xs text-gray-400">
                先在「作品章节」中创建章节框架，然后开始写作。
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {chapters.map(c => {
                const hasContent = !!(c.content && c.content.trim())
                const preview = hasContent
                  ? c.content.trim().replace(/\n{3,}/g, '\n\n').slice(0, 200)
                  : ''

                return (
                  <div key={c.id} className="px-4 py-3 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                          第 {c.order} 章
                        </span>
                        <span className="text-sm font-medium text-gray-800">
                          {c.title || `第 ${c.order} 章`}
                        </span>
                        <span className="text-xs text-gray-400">
                          {c.wordCount.toLocaleString()} 字
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          c.status === 'written' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {getChapterStatusLabel(c.status)}
                        </span>
                      </div>
                      {isEditing ? (
                        <button
                          onClick={() => navigate(`/writing/${work.id}/${c.id}`)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 border border-blue-200 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-xs font-medium shrink-0"
                        >
                          <IconArrowRight size={12} />
                          进入正文编辑
                        </button>
                      ) : hasContent ? (
                        <button
                          onClick={() =>
                            setContentModal({
                              order: c.order,
                              title: c.title,
                              content: c.content,
                              wordCount: c.wordCount,
                            })
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 border border-gray-200 text-gray-500 rounded hover:bg-gray-50 text-xs font-medium shrink-0"
                        >
                          <IconArrowRight size={12} />
                          查看正文
                        </button>
                      ) : null}
                    </div>
                    {hasContent ? (
                      <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded p-3 border border-gray-100">
                        {preview}{c.content.trim().length > 200 && '…'}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400 italic bg-gray-50 rounded p-3 border border-gray-100">
                        尚未开始写作
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── 创作资料 ─── */}
      {activeTab === 'world' && (
        <div>
          <div className="flex items-center gap-2 mb-3 px-1">
            <span className="text-xs text-gray-400">
              📚 创作资料 — 角色设定、故事时间线、创意心流。不等同于作品元数据。
            </span>
          </div>
          <WorldBuildingPage readOnly={!canEditCurrentTab} />
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
        <WorkChapterEditor
          projectId={work.id}
          initialPlans={(work.metadata as Record<string, unknown>)?.chapterPlanning as ChapterPlanItem[] || []}
          onClose={() => setShowPlanning(false)}
          onSaved={() => {
            setShowPlanning(false)
            notifySuccess('作品章节已更新')
            void load()
          }}
        />
      )}

      {showMetadataEditor && (
        <WorkMetadataPanel
          work={work}
          onClose={async () => {
            setShowMetadataEditor(false)
            await load()
          }}
          initialField="synopsis"
          initialMode="view_all"
        />
      )}
    </div>
  )
}
