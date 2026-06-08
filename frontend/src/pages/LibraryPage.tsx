import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { collectionsApi, projectsApi, type Collection, type Project } from '../services/api'
import { useNotifications } from '../hooks/useNotifications'
import ProjectStatusBadge from '../components/projects/ProjectStatusBadge'
import FileStagingConfirmModal from '../components/projects/FileStagingConfirmModal'
import CreateCollectionModal from '../components/library/CreateCollectionModal'
import ConfirmModal from '../components/ui/ConfirmModal'
import { IconLibrary, IconPlus } from '../components/ui/icons'

type ActiveFilter = 'all' | string

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} 天前`
  return new Date(iso).toLocaleDateString('zh-CN')
}

function archiveSortKey(project: Project): number {
  const iso = project.archivedAt ?? project.updatedAt
  return new Date(iso).getTime()
}

interface LibrarySectionProps {
  title: string
  subtitle: string
  children: ReactNode
}

function LibrarySection({ title, subtitle, children }: LibrarySectionProps) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
      {children}
    </section>
  )
}

function PendingProjectCard({
  project,
  onOpen,
  onStage,
}: {
  project: Project
  onOpen: (id: string) => void
  onStage: (project: Project) => void
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm hover:border-emerald-200 transition-all">
      <button type="button" onClick={() => onOpen(project.id)} className="text-left w-full">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 truncate">{project.title}</h3>
          <ProjectStatusBadge status={project.status} phase="library" />
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mt-2">
          <span>{project.author?.trim() || '—'}</span>
          <span>{project.wordCount.toLocaleString()} 字</span>
          <span>{project.chapterCount ?? 0} 章</span>
        </div>
      </button>
      <button
        type="button"
        onClick={() => onStage(project)}
        className="mt-3 text-xs text-gray-500 hover:text-amber-700"
      >
        📂 放入文件暂存
      </button>
    </div>
  )
}

function ArchivedProjectCard({
  project,
  onOpen,
  onStage,
}: {
  project: Project
  onOpen: (id: string) => void
  onStage: (project: Project) => void
}) {
  const archivedLabel = formatRelativeTime(project.archivedAt ?? project.updatedAt)

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all">
      <button type="button" onClick={() => onOpen(project.id)} className="text-left w-full">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-base font-semibold text-gray-900 truncate">
                {project.title}
              </span>
              <ProjectStatusBadge status={project.status} phase="library" />
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
              <span>{project.author?.trim() || '—'}</span>
              <span>{project.wordCount.toLocaleString()} 字</span>
              <span>{project.chapterCount ?? 0} 章</span>
              <span>归档于 {archivedLabel}</span>
            </div>
          </div>
        </div>
      </button>
      <button
        type="button"
        onClick={() => onStage(project)}
        className="mt-3 text-xs text-gray-500 hover:text-amber-700"
      >
        📂 放入文件暂存
      </button>
    </div>
  )
}

function CollectionChip({
  collection,
  count,
  isActive,
  canDelete,
  menuOpen,
  onSelect,
  onToggleMenu,
  onEdit,
  onDelete,
}: {
  collection: Collection
  count: number
  isActive: boolean
  canDelete: boolean
  menuOpen: boolean
  onSelect: () => void
  onToggleMenu: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onToggleMenu()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen, onToggleMenu])

  return (
    <div ref={menuRef} className="relative shrink-0 flex items-center">
      <button
        type="button"
        onClick={onSelect}
        className={`pl-4 pr-2 py-2 rounded-l-full text-sm border border-r-0 transition-colors ${
          isActive
            ? 'bg-emerald-600 text-white border-emerald-600'
            : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-200'
        }`}
      >
        {collection.name} ({count})
      </button>
      <button
        type="button"
        onClick={onToggleMenu}
        aria-label="文集操作"
        className={`px-2 py-2 rounded-r-full text-sm border transition-colors ${
          isActive
            ? 'bg-emerald-600 text-white border-emerald-600'
            : 'bg-white text-gray-500 border-gray-200 hover:border-emerald-200 hover:text-gray-800'
        }`}
      >
        ⋯
      </button>
      {menuOpen && (
        <div className="absolute right-0 top-full mt-1 z-20 min-w-[120px] bg-white border border-gray-200 rounded-lg shadow-lg py-1 text-sm">
          <button
            type="button"
            onClick={() => {
              onToggleMenu()
              onEdit()
            }}
            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700"
          >
            编辑
          </button>
          <button
            type="button"
            disabled={!canDelete}
            title={canDelete ? '删除文集' : '文集内有作品时不可删除'}
            onClick={() => {
              if (!canDelete) return
              onToggleMenu()
              onDelete()
            }}
            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            删除
          </button>
        </div>
      )}
    </div>
  )
}

export default function LibraryPage() {
  const navigate = useNavigate()
  const { success: notifySuccess, error: notifyError } = useNotifications()
  const [collections, setCollections] = useState<Collection[]>([])
  const [pendingProjects, setPendingProjects] = useState<Project[]>([])
  const [archivedProjects, setArchivedProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<ActiveFilter>('all')

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCollection, setEditingCollection] = useState<Collection | undefined>()
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Collection | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [stagingTarget, setStagingTarget] = useState<Project | null>(null)
  const [stagingLoading, setStagingLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [cols, allProjects] = await Promise.all([
        collectionsApi.getAll(),
        projectsApi.getAll(),
      ])
      setCollections(cols)
      setPendingProjects(allProjects.filter(p => p.status === 'reviewed'))
      setArchivedProjects(
        allProjects
          .filter(p => p.status === 'archived')
          .sort((a, b) => archiveSortKey(b) - archiveSortKey(a))
      )
    } catch {
      notifyError('加载失败', '无法获取文集库数据')
    } finally {
      setLoading(false)
    }
  }, [notifyError])

  useEffect(() => {
    void load()
  }, [load])

  const countInCollection = useCallback(
    (collectionId: string) =>
      archivedProjects.filter(p => p.collectionId === collectionId).length,
    [archivedProjects]
  )

  const filteredArchived = useMemo(() => {
    if (activeId === 'all') return archivedProjects
    return archivedProjects.filter(p => p.collectionId === activeId)
  }, [archivedProjects, activeId])

  const openPending = (id: string) => navigate(`/work/${id}?from=library`)
  const openArchived = (id: string) => navigate(`/library/${id}`)

  const handleConfirmFileStaging = async () => {
    if (!stagingTarget) return
    setStagingLoading(true)
    try {
      await projectsApi.softDelete(stagingTarget.id)
      setStagingTarget(null)
      notifySuccess('已放入文件暂存')
      await load()
    } catch {
      setStagingTarget(null)
      notifyError('放入文件暂存失败')
    } finally {
      setStagingLoading(false)
    }
  }

  const handleCreateOrUpdateCollection = async (data: {
    name: string
    description?: string
  }) => {
    try {
      if (editingCollection) {
        await collectionsApi.update(editingCollection.id, data)
        notifySuccess('文集已更新')
      } else {
        await collectionsApi.create(data)
        notifySuccess('文集已创建')
      }
      setShowCreateModal(false)
      setEditingCollection(undefined)
      await load()
    } catch {
      notifyError(editingCollection ? '更新失败' : '创建失败')
    }
  }

  const handleConfirmDeleteCollection = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await collectionsApi.delete(deleteTarget.id)
      notifySuccess('文集已删除')
      setDeleteTarget(null)
      if (activeId === deleteTarget.id) setActiveId('all')
      await load()
    } catch {
      setDeleteTarget(null)
      notifyError('删除失败', '文集可能仍有作品或未找到')
    } finally {
      setDeleteLoading(false)
    }
  }

  const openCreate = () => {
    setEditingCollection(undefined)
    setShowCreateModal(true)
  }

  const openEdit = (collection: Collection) => {
    setEditingCollection(collection)
    setShowCreateModal(true)
  }

  const total = pendingProjects.length + archivedProjects.length
  const activeCollection = collections.find(c => c.id === activeId)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-gray-400">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-100 p-2 rounded-lg">
            <IconLibrary size={22} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">文集库</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {total} 部作品（待归库 / 已归档）
            </p>
          </div>
        </div>
      </div>

      <LibrarySection
        title="待归库"
        subtitle={`${pendingProjects.length} 部待归库作品`}
      >
        {pendingProjects.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
            暂无待归库作品。编审部确认审阅完成后将出现在此。
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingProjects.map(p => (
              <PendingProjectCard
                key={p.id}
                project={p}
                onOpen={openPending}
                onStage={setStagingTarget}
              />
            ))}
          </div>
        )}
      </LibrarySection>

      <LibrarySection
        title="文集管理"
        subtitle={`${collections.length} 个文集，管理归类与元数据`}
      >
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <p className="text-sm text-gray-500">创建或编辑文集，用于归档作品归类。</p>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
          >
            <IconPlus size={16} />
            新建文集
          </button>
        </div>
        {collections.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
            暂无文集。点击「新建文集」创建第一个文集。
          </p>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 items-center flex-wrap">
            {collections.map(c => {
              const count = countInCollection(c.id)
              return (
                <CollectionChip
                  key={c.id}
                  collection={c}
                  count={count}
                  isActive={false}
                  canDelete={count === 0}
                  menuOpen={menuOpenId === c.id}
                  onSelect={() => setMenuOpenId(null)}
                  onToggleMenu={() =>
                    setMenuOpenId(prev => (prev === c.id ? null : c.id))
                  }
                  onEdit={() => openEdit(c)}
                  onDelete={() => setDeleteTarget(c)}
                />
              )
            })}
          </div>
        )}
      </LibrarySection>

      <LibrarySection
        title="已归档"
        subtitle={`${archivedProjects.length} 部已归档作品`}
      >
        <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1 items-center">
          <button
            type="button"
            onClick={() => {
              setMenuOpenId(null)
              setActiveId('all')
            }}
            className={`shrink-0 px-4 py-2 rounded-full text-sm border transition-colors ${
              activeId === 'all'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-200'
            }`}
          >
            全部作品 ({archivedProjects.length})
          </button>
          {collections.map(c => {
            const count = countInCollection(c.id)
            return (
              <CollectionChip
                key={c.id}
                collection={c}
                count={count}
                isActive={activeId === c.id}
                canDelete={count === 0}
                menuOpen={menuOpenId === c.id}
                onSelect={() => {
                  setMenuOpenId(null)
                  setActiveId(c.id)
                }}
                onToggleMenu={() =>
                  setMenuOpenId(prev => (prev === c.id ? null : c.id))
                }
                onEdit={() => openEdit(c)}
                onDelete={() => setDeleteTarget(c)}
              />
            )
          })}
        </div>

        {activeCollection && activeId !== 'all' && (
          <p className="text-sm text-gray-500 mb-3">
            {activeCollection.description || '暂无描述'}
          </p>
        )}

        {archivedProjects.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
            暂无已归档作品。待归库作品归档后将出现在此。
          </p>
        ) : filteredArchived.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
            此文集暂无作品。可在作品详情页将待归库作品归入此文集并归档。
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredArchived.map(p => (
              <ArchivedProjectCard
                key={p.id}
                project={p}
                onOpen={openArchived}
                onStage={setStagingTarget}
              />
            ))}
          </div>
        )}
      </LibrarySection>

      <CreateCollectionModal
        open={showCreateModal}
        initial={editingCollection}
        onConfirm={data => void handleCreateOrUpdateCollection(data)}
        onCancel={() => {
          setShowCreateModal(false)
          setEditingCollection(undefined)
        }}
      />

      <ConfirmModal
        open={!!deleteTarget}
        title="删除文集"
        message={
          deleteTarget
            ? `确定删除文集「${deleteTarget.name}」吗？文集内的作品不会被删除。`
            : ''
        }
        confirmLabel="删除"
        variant="danger"
        loading={deleteLoading}
        onConfirm={() => void handleConfirmDeleteCollection()}
        onCancel={() => {
          if (!deleteLoading) setDeleteTarget(null)
        }}
      />

      <FileStagingConfirmModal
        open={!!stagingTarget}
        loading={stagingLoading}
        onConfirm={() => void handleConfirmFileStaging()}
        onCancel={() => {
          if (!stagingLoading) setStagingTarget(null)
        }}
      />
    </div>
  )
}
