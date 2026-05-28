import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search, Plus, Library, Tag } from 'lucide-react'
import { scrapsApi, projectsApi } from '../services/api'
import type { Scrap, Project } from '../services/api'
import ScrapCard from '../components/scraps/ScrapCard'
import ScrapFormModal from '../components/scraps/ScrapFormModal'
import { useUIStore } from '../stores/uiStore'

const FILTER_ALL = ''
const FILTER_UNASSIGNED = '__unassigned__'

export default function ScrapsPage() {
  const [scraps, setScraps] = useState<Scrap[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterProjectId, setFilterProjectId] = useState(FILTER_ALL)
  const [filterTags, setFilterTags] = useState<string[]>([]) 
  const [modalOpen, setModalOpen] = useState(false)
  const [editingScrap, setEditingScrap] = useState<Scrap | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { addNotification } = useUIStore()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [scrapsData, projectsData] = await Promise.all([
        scrapsApi.getAll(),
        projectsApi.getAll(),
      ])
      setScraps(scrapsData)
      setProjects(projectsData)
    } catch {
      addNotification({ type: 'error', title: '加载失败', message: '无法加载灵感碎片数据' })
    } finally {
      setLoading(false)
    }
  }, [addNotification])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 收集所有已有标签用于快速筛选
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    scraps.forEach(s => {
      const t = Array.isArray(s.tags) ? s.tags : []
      t.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }, [scraps])

  // 过滤
  const filteredScraps = useMemo(() => {
    return scraps.filter(s => {
      // 搜索过滤
      if (search) {
        const q = search.toLowerCase()
        const inContent = s.content.toLowerCase().includes(q)
        const inNote = s.note?.toLowerCase().includes(q)
        const inTags = Array.isArray(s.tags) ? s.tags.some(t => t.toLowerCase().includes(q)) : false
        if (!inContent && !inNote && !inTags) return false
      }

      // 作品过滤
      if (filterProjectId === FILTER_UNASSIGNED) {
        if (s.projectId) return false
      } else if (filterProjectId !== FILTER_ALL) {
        if (s.projectId !== filterProjectId) return false
      }

      // 标签过滤
      if (filterTags.length > 0) {
        const sTags = Array.isArray(s.tags) ? s.tags : []
        if (!filterTags.some(t => sTags.includes(t))) return false
      }

      return true
    })
  }, [scraps, search, filterProjectId, filterTags])

  const toggleFilterTag = (tag: string) => {
    setFilterTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  // 新建
  const handleCreate = () => {
    setEditingScrap(null)
    setModalOpen(true)
  }

  // 编辑
  const handleEdit = (scrap: Scrap) => {
    setEditingScrap(scrap)
    setModalOpen(true)
  }

  // 保存（创建 or 更新）
  const handleSave = async (data: { content: string; note?: string; tags?: string[]; projectId?: string }) => {
    if (editingScrap) {
      await scrapsApi.update(editingScrap.id, data)
      addNotification({ type: 'success', title: '已更新', message: '碎片已更新' })
    } else {
      await scrapsApi.create(data)
      addNotification({ type: 'success', title: '已保存', message: '灵感碎片已保存' })
    }
    await loadData()
  }

  // 删除
  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await scrapsApi.delete(deleteId)
      addNotification({ type: 'success', title: '已删除', message: '灵感碎片已删除' })
      await loadData()
    } catch {
      addNotification({ type: 'error', title: '删除失败', message: '无法删除灵感碎片' })
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 顶部栏 */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Library size={22} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">灵感碎片</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {filteredScraps.length} 条碎片
              </p>
            </div>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg 
                       hover:bg-blue-700 font-medium transition-colors text-sm shadow-sm"
          >
            <Plus size={18} />
            新建碎片
          </button>
        </div>

        {/* 搜索 + 项目过滤 */}
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索碎片内容、备注..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm 
                         placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 
                         focus:border-transparent bg-white"
            />
          </div>
          <select
            value={filterProjectId}
            onChange={e => setFilterProjectId(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 
                       bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 
                       focus:border-transparent"
          >
            <option value={FILTER_ALL}>全部作品</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
            {scraps.some(s => !s.projectId) && (
              <option value={FILTER_UNASSIGNED}>未归属作品</option>
            )}
          </select>
        </div>

        {/* 标签筛选 */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Tag size={14} className="text-gray-400 flex-shrink-0" />
            <button
              onClick={() => setFilterTags([])}
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                filterTags.length === 0
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              全部
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleFilterTag(tag)}
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                  filterTags.includes(tag)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 内容区域 */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            <span className="text-sm">加载中...</span>
          </div>
        </div>
      ) : filteredScraps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Library size={48} className="mb-3 opacity-30" />
          <p className="text-sm">
            {search || filterProjectId || filterTags.length > 0
              ? '没有匹配的碎片'
              : '还没有灵感碎片，点击上方"新建碎片"开始记录灵感吧'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredScraps.map(scrap => (
            <ScrapCard
              key={scrap.id}
              scrap={scrap}
              onEdit={handleEdit}
              onDelete={id => setDeleteId(id)}
            />
          ))}
        </div>
      )}

      {/* 新建/编辑弹窗 */}
      <ScrapFormModal
        isOpen={modalOpen}
        scrap={editingScrap}
        onClose={() => {
          setModalOpen(false)
          setEditingScrap(null)
        }}
        onSave={handleSave}
      />

      {/* 删除确认弹窗 */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
            <div className="p-5">
              <p className="text-gray-700 text-sm">
                确定要删除这条灵感碎片吗？此操作不可恢复。
              </p>
            </div>
            <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
