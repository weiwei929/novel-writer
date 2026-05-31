import { useState } from 'react'
import { Plus, Sparkles, Pencil, Trash2 } from 'lucide-react'
import { worldApi, type CreativeFlow, type CreativeFlowInput } from '../../services/api'
import { useWorldStore } from '../../stores/worldStore'
import { useUIStore } from '../../stores/uiStore'
import CreativeFlowFormModal from './CreativeFlowFormModal'
import ConfirmDialog from './ConfirmDialog'
import PanelStatus from './PanelStatus'

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
  } catch {
    return ''
  }
}

const preview = (content: string, max = 120) => {
  const text = content.replace(/[#*`>_-]/g, '').replace(/\n+/g, ' ').trim()
  return text.length > max ? text.slice(0, max) + '…' : text
}

export default function CreativeFlowPanel({ readOnly = false }: { readOnly?: boolean }) {
  const scope = useWorldStore(s => s.currentScope)
  const flows = useWorldStore(s => s.flows)
  const loading = useWorldStore(s => s.loading)
  const error = useWorldStore(s => s.error)
  const reload = useWorldStore(s => s.reload)
  const { addNotification } = useUIStore()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CreativeFlow | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleSubmit = async (data: Omit<CreativeFlowInput, 'projectId'>) => {
    if (!scope) return
    try {
      if (editing) {
        await worldApi.flows.update(editing.id, data)
        addNotification({ type: 'success', title: '已更新', message: '创作心流已更新' })
      } else {
        await worldApi.flows.create(scope, data)
        addNotification({ type: 'success', title: '已创建', message: '创作心流已创建' })
      }
      await reload('flows')
    } catch {
      addNotification({ type: 'error', title: '保存失败', message: '无法保存创作心流，请重试' })
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await worldApi.flows.delete(deleteId)
      addNotification({ type: 'success', title: '已删除', message: '创作心流已删除' })
      await reload('flows')
    } catch {
      addNotification({ type: 'error', title: '删除失败', message: '无法删除创作心流' })
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{flows.length} 篇心流</p>
        {!readOnly && (
          <button
            onClick={() => {
              setEditing(null)
              setModalOpen(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors text-sm shadow-sm"
          >
            <Plus size={16} />
            新增心流
          </button>
        )}
      </div>

      <PanelStatus
        loading={loading}
        error={error}
        empty={flows.length === 0}
        icon={<Sparkles size={48} className="opacity-30" />}
        emptyText={readOnly ? '该提案暂无创作心流。' : '还没有创作心流，点击右上角“新增心流”记录你的灵感片段。'}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {flows.map(f => (
            <div
              key={f.id}
              className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-900 truncate">{f.title}</h3>
                {!readOnly && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setEditing(f)
                        setModalOpen(true)
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="编辑"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteId(f.id)}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="删除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-2 flex-1 line-clamp-3">{preview(f.content)}</p>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-1 flex-wrap">
                  {(f.tags || []).slice(0, 3).map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="text-xs text-gray-400 shrink-0">{formatDate(f.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      </PanelStatus>

      {!readOnly && (
        <>
          <CreativeFlowFormModal
            open={modalOpen}
            flow={editing}
            onClose={() => {
              setModalOpen(false)
              setEditing(null)
            }}
            onSubmit={handleSubmit}
          />
          <ConfirmDialog
            open={deleteId !== null}
            message="确定要删除这篇创作心流吗？此操作不可恢复。"
            onConfirm={handleDelete}
            onCancel={() => setDeleteId(null)}
          />
        </>
      )}
    </div>
  )
}
