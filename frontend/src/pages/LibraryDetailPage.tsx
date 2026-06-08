import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  chaptersApi,
  collectionsApi,
  projectsApi,
  type Chapter,
  type Collection,
  type Project,
} from '../services/api'
import { useNotifications } from '../hooks/useNotifications'
import ProjectStatusBadge from '../components/projects/ProjectStatusBadge'
import FileStagingConfirmModal from '../components/projects/FileStagingConfirmModal'
import CollectionPickerModal from '../components/library/CollectionPickerModal'
import CreateCollectionModal from '../components/library/CreateCollectionModal'
import { IconArrowLeft, IconLibrary } from '../components/ui/icons'

const BOOK_REVIEW_TYPES = [
  { key: 'recommend', label: '推荐语', hint: '100—200 字' },
  { key: 'selling', label: '卖点提炼', hint: '3—5 条亮点' },
  { key: 'theme', label: '主题阐释', hint: '200—400 字' },
] as const

function formatDisplayDate(iso: string): string {
  return new Date(iso).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function LibraryDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { info: notifyInfo, success: notifySuccess, error: notifyError } =
    useNotifications()

  const [project, setProject] = useState<Project | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showFileStaging, setShowFileStaging] = useState(false)
  const [stagingLoading, setStagingLoading] = useState(false)
  const [showCollectionPicker, setShowCollectionPicker] = useState(false)
  const [showCreateCollection, setShowCreateCollection] = useState(false)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setLoadError(null)
    try {
      const [p, ch] = await Promise.all([
        projectsApi.getById(projectId),
        chaptersApi.getByProjectId(projectId),
      ])
      setProject(p)
      const sorted = [...ch].sort((a, b) => a.order - b.order)
      setChapters(sorted)
      setSelectedChapterId(prev => {
        if (prev && sorted.some(c => c.id === prev)) return prev
        return sorted[0]?.id ?? null
      })
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '无法加载作品信息'
      setLoadError(message)
      setProject(null)
      setChapters([])
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  const loadCollections = useCallback(async () => {
    try {
      setCollections(await collectionsApi.getAll())
    } catch {
      notifyError('加载失败', '无法获取文集列表')
    }
  }, [notifyError])

  useEffect(() => {
    void loadCollections()
  }, [loadCollections])

  const selectedChapter = useMemo(
    () => chapters.find(c => c.id === selectedChapterId) ?? null,
    [chapters, selectedChapterId]
  )

  const isArchived = project?.status === 'archived'

  const handleEditReview = () => {
    notifyInfo('编辑书评', 'AI 书评（Day 3 接入）')
  }

  const handleOpenCollectionPicker = () => {
    void loadCollections()
    setShowCollectionPicker(true)
  }

  const handleAssignCollection = async (collectionId: string | null) => {
    if (!project) return
    try {
      await projectsApi.update(project.id, { collectionId })
      notifySuccess(collectionId ? '已加入 Collection' : '已移出 Collection')
      setShowCollectionPicker(false)
      await load()
      await loadCollections()
    } catch {
      notifyError('操作失败', '无法更新文集归属')
    }
  }

  const handleCreateCollectionFromPicker = async (data: {
    name: string
    description?: string
  }) => {
    if (!project) return
    try {
      const created = await collectionsApi.create(data)
      notifySuccess('文集已创建')
      setShowCreateCollection(false)
      await loadCollections()
      await projectsApi.update(project.id, { collectionId: created.id })
      notifySuccess('已加入新文集')
      setShowCollectionPicker(false)
      await load()
    } catch {
      notifyError('创建失败')
    }
  }

  const handleConfirmFileStaging = async () => {
    if (!project) return
    setStagingLoading(true)
    try {
      await projectsApi.softDelete(project.id)
      setShowFileStaging(false)
      notifySuccess('已放入文件暂存')
      navigate('/library')
    } catch (e: unknown) {
      setShowFileStaging(false)
      notifyError(
        '放入文件暂存失败',
        e instanceof Error ? e.message : undefined
      )
    } finally {
      setStagingLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (loadError || !project) {
    return (
      <div className="text-center py-20 text-gray-500 space-y-3">
        <p className="text-sm">{loadError || '未找到该作品。'}</p>
        <button
          type="button"
          onClick={() => navigate('/library')}
          className="text-sm text-emerald-700 hover:underline"
        >
          返回文集库
        </button>
      </div>
    )
  }

  if (!isArchived) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-sm text-gray-600">该作品未归档，无法在文集库查看。</p>
        <ProjectStatusBadge status={project.status} phase="library" />
        <button
          type="button"
          onClick={() => navigate('/library')}
          className="block mx-auto text-sm text-emerald-700 hover:underline"
        >
          返回文集库
        </button>
      </div>
    )
  }

  const archivedLabel = formatDisplayDate(project.archivedAt ?? project.updatedAt)
  const tags = project.tags?.length ? project.tags : project.genre
  const collectionName = project.collectionId
    ? collections.find(c => c.id === project.collectionId)?.name ?? '已归入文集'
    : '未分组'

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/library')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 shrink-0"
          >
            <IconArrowLeft size={16} />
            返回文集库
          </button>
          <h1 className="text-xl font-bold text-gray-900 truncate">{project.title}</h1>
          <ProjectStatusBadge status={project.status} phase="library" />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <button
            type="button"
            onClick={handleEditReview}
            className="px-3 py-1.5 text-sm border border-emerald-200 text-emerald-800 rounded-lg hover:bg-emerald-50"
          >
            编辑书评
          </button>
          <button
            type="button"
            onClick={handleOpenCollectionPicker}
            className="px-3 py-1.5 text-sm border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            加入 Collection
          </button>
          <button
            type="button"
            onClick={() => setShowFileStaging(true)}
            className="px-3 py-1.5 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
          >
            📂 放入文件暂存
          </button>
        </div>
      </div>

      {/* 元数据 */}
      <section className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex gap-4 flex-wrap">
          {project.coverImage && (
            <img
              src={project.coverImage}
              alt=""
              className="w-20 h-28 object-cover rounded-lg border border-gray-100 shrink-0"
            />
          )}
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm flex-1 min-w-0">
            <div>
              <dt className="text-gray-500">作者</dt>
              <dd className="text-gray-900 font-medium">{project.author?.trim() || '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">字数</dt>
              <dd className="text-gray-900">{project.wordCount.toLocaleString()} 字</dd>
            </div>
            <div>
              <dt className="text-gray-500">章节</dt>
              <dd className="text-gray-900">{chapters.length} 章</dd>
            </div>
            <div>
              <dt className="text-gray-500">归档于</dt>
              <dd className="text-gray-900">{archivedLabel}</dd>
            </div>
            <div>
              <dt className="text-gray-500">创建</dt>
              <dd className="text-gray-900">{formatDisplayDate(project.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Collection</dt>
              <dd className="text-gray-900">{collectionName}</dd>
            </div>
          </dl>
        </div>
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {tags.map(tag => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        {project.description?.trim() && (
          <p className="text-sm text-gray-600 mt-4 line-clamp-3">{project.description}</p>
        )}
        {project.masterPrompt?.trim() && (
          <details className="mt-4 text-sm text-gray-600">
            <summary className="cursor-pointer text-gray-700 font-medium">暗线（masterPrompt）</summary>
            <p className="mt-2 whitespace-pre-wrap text-gray-600">{project.masterPrompt}</p>
          </details>
        )}
      </section>

      {/* 章节只读 */}
      <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">章节（只读）</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] min-h-[280px]">
          <div className="border-b lg:border-b-0 lg:border-r p-2 space-y-1 max-h-80 lg:max-h-none overflow-y-auto">
            {chapters.length === 0 ? (
              <p className="text-xs text-gray-400 px-2 py-4">暂无章节</p>
            ) : (
              chapters.map(c => {
                const active = c.id === selectedChapterId
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedChapterId(c.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      active
                        ? 'bg-emerald-50 text-emerald-900 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="line-clamp-2">{c.title || `第 ${c.order} 章`}</span>
                  </button>
                )
              })
            )}
          </div>
          <div className="flex flex-col min-h-[200px]">
            {selectedChapter ? (
              <>
                <div className="px-4 py-3 border-b shrink-0">
                  <h3 className="font-medium text-gray-900">{selectedChapter.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selectedChapter.wordCount.toLocaleString()} 字
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {selectedChapter.content?.trim() ? (
                    <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap">
                      {selectedChapter.content}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">本章暂无正文。</p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-400 p-6">
                {chapters.length === 0 ? '暂无章节' : '请选择章节'}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 书评板块占位 */}
      <section className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <IconLibrary size={18} className="text-emerald-600" />
          <h2 className="text-lg font-semibold text-gray-900">书评</h2>
        </div>
        <p className="text-sm text-emerald-700 mb-1">AI 书评（Day 3 接入）</p>
        <p className="text-xs text-gray-500 mb-4">书评内容将在 Day 3 由 AI 生成，可手动编辑后保存。</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {BOOK_REVIEW_TYPES.map(item => (
            <div
              key={item.key}
              className="rounded-lg border border-dashed border-gray-200 bg-gray-50/80 p-4"
            >
              <div className="text-sm font-medium text-gray-800">{item.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{item.hint}</div>
              <div className="text-xs text-gray-400 mt-3">待生成</div>
            </div>
          ))}
        </div>
      </section>

      <CollectionPickerModal
        open={showCollectionPicker}
        collections={collections}
        currentCollectionId={project.collectionId}
        onConfirm={id => void handleAssignCollection(id)}
        onCancel={() => setShowCollectionPicker(false)}
        onCreateNew={() => {
          setShowCollectionPicker(false)
          setShowCreateCollection(true)
        }}
      />

      <CreateCollectionModal
        open={showCreateCollection}
        onConfirm={data => void handleCreateCollectionFromPicker(data)}
        onCancel={() => {
          setShowCreateCollection(false)
          setShowCollectionPicker(true)
        }}
      />

      <FileStagingConfirmModal
        open={showFileStaging}
        loading={stagingLoading}
        onConfirm={() => void handleConfirmFileStaging()}
        onCancel={() => {
          if (!stagingLoading) setShowFileStaging(false)
        }}
      />
    </div>
  )
}
