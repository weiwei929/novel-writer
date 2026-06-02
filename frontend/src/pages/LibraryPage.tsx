import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { collectionsApi, projectsApi, type Collection, type Project } from '../services/api'
import { useNotifications } from '../hooks/useNotifications'
import ProjectStatusBadge from '../components/projects/ProjectStatusBadge'
import CreateCollectionModal from '../components/library/CreateCollectionModal'
import {
  IconDelete,
  IconDownload,
  IconEdit,
  IconLibrary,
  IconPlus,
} from '../components/ui/icons'

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

function LibraryProjectCard({
  project,
  showRemoveFromCollection,
  onExport,
  onShelve,
  onRemoveFromCollection,
}: {
  project: Project
  showRemoveFromCollection: boolean
  onExport: (p: Project) => void
  onShelve: (p: Project) => void
  onRemoveFromCollection: (p: Project) => void
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Link
              to={`/work/${project.id}`}
              className="text-base font-semibold text-gray-900 hover:text-blue-600 truncate"
            >
              {project.title}
            </Link>
            <ProjectStatusBadge status={project.status} />
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
            <span>{project.wordCount.toLocaleString()} 字</span>
            <span>{project.chapterCount ?? 0} 章</span>
            <span>更新于 {formatRelativeTime(project.updatedAt)}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
        <button
          type="button"
          onClick={() => onExport(project)}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-green-200 text-green-700 rounded-lg hover:bg-green-50"
        >
          <IconDownload size={12} />
          导出 Markdown
        </button>
        {showRemoveFromCollection && (
          <button
            type="button"
            onClick={() => onRemoveFromCollection(project)}
            className="px-2.5 py-1 text-xs border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
          >
            移出文集
          </button>
        )}
        <button
          type="button"
          onClick={() => onShelve(project)}
          className="px-2.5 py-1 text-xs text-gray-400 hover:text-amber-600"
        >
          移入暂存
        </button>
      </div>
    </div>
  )
}

export default function LibraryPage() {
  const { success: notifySuccess, error: notifyError } = useNotifications()
  const [collections, setCollections] = useState<Collection[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<ActiveFilter>('all')

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCollection, setEditingCollection] = useState<Collection | undefined>()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [cols, projs] = await Promise.all([
        collectionsApi.getAll(),
        projectsApi.getLibraryProjects(),
      ])
      setCollections(cols)
      setProjects(projs)
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
      projects.filter(p => p.collectionId === collectionId).length,
    [projects]
  )

  const filteredProjects = useMemo(() => {
    if (activeId === 'all') return projects
    return projects.filter(p => p.collectionId === activeId)
  }, [projects, activeId])

  const handleExport = async (project: Project) => {
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
      notifySuccess('导出成功')
    } catch {
      notifyError('导出失败')
    }
  }

  const handleShelve = async (project: Project) => {
    try {
      await projectsApi.shelve(project.id, 'library')
      notifySuccess('已移入暂存')
      await load()
    } catch {
      notifyError('暂存失败')
    }
  }

  const handleRemoveFromCollection = async (project: Project) => {
    try {
      await projectsApi.update(project.id, { collectionId: null })
      notifySuccess('已移出文集')
      await load()
    } catch {
      notifyError('操作失败')
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

  const handleDeleteCollection = async (collection: Collection) => {
    const count = countInCollection(collection.id)
    if (count > 0) return
    if (!window.confirm(`确定删除文集「${collection.name}」吗？`)) return
    try {
      await collectionsApi.delete(collection.id)
      notifySuccess('文集已删除')
      if (activeId === collection.id) setActiveId('all')
      await load()
    } catch {
      notifyError('删除失败', '文集可能仍有作品或未找到')
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-gray-400">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    )
  }

  const totalCount = projects.length
  const activeCollection = collections.find(c => c.id === activeId)

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <IconLibrary size={24} className="text-emerald-600" />
          <h1 className="text-2xl font-bold text-gray-900">文集库</h1>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
        >
          <IconPlus size={16} />
          新建文集
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 min-h-[480px]">
        {/* 文集侧栏 */}
        <aside className="w-full lg:w-56 shrink-0 bg-white border border-gray-200 rounded-xl p-3 flex flex-col">
          <nav className="space-y-1 flex-1">
            <button
              type="button"
              onClick={() => setActiveId('all')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeId === 'all'
                  ? 'bg-emerald-50 text-emerald-800 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              全部作品 ({totalCount})
            </button>
            {collections.map(c => {
              const count = countInCollection(c.id)
              const canDelete = count === 0
              return (
                <div
                  key={c.id}
                  className={`group relative rounded-lg ${
                    activeId === c.id ? 'bg-emerald-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveId(c.id)}
                    className={`w-full text-left px-3 py-2 pr-14 rounded-lg text-sm ${
                      activeId === c.id
                        ? 'text-emerald-800 font-medium'
                        : 'text-gray-700'
                    }`}
                  >
                    <span className="line-clamp-1">{c.name}</span>
                    <span className="text-xs text-gray-400 font-normal">({count})</span>
                  </button>
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation()
                        openEdit(c)
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600 rounded"
                      title="编辑"
                    >
                      <IconEdit size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={!canDelete}
                      onClick={e => {
                        e.stopPropagation()
                        void handleDeleteCollection(c)
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      title={canDelete ? '删除' : '文集内有作品时不可删除'}
                    >
                      <IconDelete size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </nav>
          <button
            type="button"
            onClick={openCreate}
            className="mt-3 w-full flex items-center justify-center gap-1 px-3 py-2 text-sm text-emerald-700 border border-dashed border-emerald-200 rounded-lg hover:bg-emerald-50"
          >
            <IconPlus size={14} />
            新建文集
          </button>
        </aside>

        {/* 作品列表 */}
        <section className="flex-1 min-w-0">
          {activeCollection && (
            <p className="text-sm text-gray-500 mb-3">
              {activeCollection.description || '暂无描述'}
            </p>
          )}

          {totalCount === 0 ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
              <IconLibrary size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-600 font-medium mb-1">还没有完结作品</p>
              <p className="text-sm text-gray-400 mb-4">
                作品完成创作并标记为「已完成」后，会出现在文集库中。
              </p>
              <Link
                to="/"
                className="inline-block text-sm text-blue-600 hover:underline"
              >
                返回首页查看管线进度 →
              </Link>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
              <p className="text-gray-600 font-medium mb-1">还没有作品归入此文集</p>
              <p className="text-sm text-gray-400">
                在作品详情页将已完成作品「归入文集」，或从「全部作品」中筛选后归类。
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProjects.map(p => (
                <LibraryProjectCard
                  key={p.id}
                  project={p}
                  showRemoveFromCollection={!!p.collectionId}
                  onExport={p => void handleExport(p)}
                  onShelve={p => void handleShelve(p)}
                  onRemoveFromCollection={p => void handleRemoveFromCollection(p)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <CreateCollectionModal
        open={showCreateModal}
        initial={editingCollection}
        onConfirm={data => void handleCreateOrUpdateCollection(data)}
        onCancel={() => {
          setShowCreateModal(false)
          setEditingCollection(undefined)
        }}
      />
    </div>
  )
}
