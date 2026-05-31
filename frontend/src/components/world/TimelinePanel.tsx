import { useState } from 'react'
import { Plus, GitCommitHorizontal, Pencil, Trash2 } from 'lucide-react'
import { worldApi, type TimelineEntry, type TimelineInput } from '../../services/api'
import { useWorldStore } from '../../stores/worldStore'
import { useUIStore } from '../../stores/uiStore'
import TimelineFormModal from './TimelineFormModal'
import ConfirmDialog from './ConfirmDialog'
import PanelStatus from './PanelStatus'

export default function TimelinePanel({ projectId }: { projectId: string }) {
  const entries = useWorldStore(s => s.timelineEntries)
  const loading = useWorldStore(s => s.loading)
  const error = useWorldStore(s => s.error)
  const reload = useWorldStore(s => s.reload)
  const { addNotification } = useUIStore()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<TimelineEntry | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const nextSortOrder =
    entries.length > 0 ? Math.max(...entries.map(e => e.sortOrder)) + 1 : 0

  const handleSubmit = async (data: Omit<TimelineInput, 'projectId'>) => {
    try {
      if (editing) {
        await worldApi.timeline.update(editing.id, data)
        addNotification({ type: 'success', title: '已更新', message: '故事线条目已更新' })
      } else {
        await worldApi.timeline.create({ ...data, projectId })
        addNotification({ type: 'success', title: '已创建', message: '故事线条目已创建' })
      }
      await reload('timeline')
    } catch {
      addNotification({ type: 'error', title: '保存失败', message: '无法保存故事线条目，请重试' })
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await worldApi.timeline.delete(deleteId)
      addNotification({ type: 'success', title: '已删除', message: '故事线条目已删除' })
      await reload('timeline')
    } catch {
      addNotification({ type: 'error', title: '删除失败', message: '无法删除故事线条目' })
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{entries.length} 条故事线</p>
        <button
          onClick={() => {
            setEditing(null)
            setModalOpen(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors text-sm shadow-sm"
        >
          <Plus size={16} />
          新增条目
        </button>
      </div>

      <PanelStatus
        loading={loading}
        error={error}
        empty={entries.length === 0}
        icon={<GitCommitHorizontal size={48} className="opacity-30" />}
        emptyText="还没有故事线条目，点击右上角“新增条目”开始编排时间线。"
      >
        <div className="space-y-3">
          {entries.map((e, idx) => (
            <div
              key={e.id}
              className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-4 hover:shadow-sm transition-shadow"
            >
              <div className="shrink-0 w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-semibold">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap text-sm">
                  <span className="font-semibold text-gray-900">{e.time}</span>
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-600">{e.location}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1 truncate">{e.characters}</p>
                {(e.premise || e.process || e.outcome) && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                    {[e.premise, e.process, e.outcome].filter(Boolean).join(' → ')}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => {
                    setEditing(e)
                    setModalOpen(true)
                  }}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  title="编辑"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => setDeleteId(e.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="删除"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </PanelStatus>

      <TimelineFormModal
        open={modalOpen}
        entry={editing}
        defaultSortOrder={nextSortOrder}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        onSubmit={handleSubmit}
      />
      <ConfirmDialog
        open={deleteId !== null}
        message="确定要删除这条故事线条目吗？此操作不可恢复。"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
