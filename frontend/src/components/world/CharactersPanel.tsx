import { IconDelete, IconEdit, IconPlus, IconUser } from '../ui/icons'
import { useState } from 'react'
import { worldApi, type WorldCharacter, type CharacterInput } from '../../services/api'
import { useWorldStore } from '../../stores/worldStore'
import { useUIStore } from '../../stores/uiStore'
import CharacterFormModal from './CharacterFormModal'
import ConfirmDialog from './ConfirmDialog'
import PanelStatus from './PanelStatus'

export default function CharactersPanel({ readOnly = false }: { readOnly?: boolean }) {
  const scope = useWorldStore(s => s.currentScope)
  const characters = useWorldStore(s => s.characters)
  const loading = useWorldStore(s => s.loading)
  const error = useWorldStore(s => s.error)
  const reload = useWorldStore(s => s.reload)
  const { addNotification } = useUIStore()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<WorldCharacter | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleSubmit = async (data: Omit<CharacterInput, 'projectId'>) => {
    if (!scope) return
    try {
      if (editing) {
        await worldApi.chars.update(editing.id, data)
        addNotification({ type: 'success', title: '已更新', message: '人物已更新' })
      } else {
        await worldApi.chars.create(scope, data)
        addNotification({ type: 'success', title: '已创建', message: '人物已创建' })
      }
      await reload('characters')
    } catch {
      addNotification({ type: 'error', title: '保存失败', message: '无法保存人物，请重试' })
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await worldApi.chars.delete(deleteId)
      addNotification({ type: 'success', title: '已删除', message: '人物已删除' })
      await reload('characters')
    } catch {
      addNotification({ type: 'error', title: '删除失败', message: '无法删除人物' })
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{characters.length} 个人物</p>
        {!readOnly && (
          <button
            onClick={() => {
              setEditing(null)
              setModalOpen(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors text-sm shadow-sm"
          >
            <IconPlus size={16} />
            新增人物
          </button>
        )}
      </div>

      <PanelStatus
        loading={loading}
        error={error}
        empty={characters.length === 0}
        icon={<IconUser size={48} className="opacity-30" />}
        emptyText={readOnly ? '该提案暂无人物设定。' : '还没有人物，点击右上角“新增人物”开始构建。'}
      >
        <div className="overflow-hidden border border-gray-200 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left font-medium px-4 py-2.5">名称</th>
                <th className="text-left font-medium px-4 py-2.5">角色定位</th>
                <th className="text-left font-medium px-4 py-2.5">性别</th>
                <th className="text-left font-medium px-4 py-2.5">身份</th>
                {!readOnly && <th className="text-right font-medium px-4 py-2.5">操作</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {characters.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-2.5 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-2.5 text-gray-600">{c.roleType || '—'}</td>
                  <td className="px-4 py-2.5 text-gray-600">{c.gender || '—'}</td>
                  <td className="px-4 py-2.5 text-gray-600">{c.identity || '—'}</td>
                  {!readOnly && (
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditing(c)
                            setModalOpen(true)
                          }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="编辑"
                        >
                          <IconEdit size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteId(c.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="删除"
                        >
                          <IconDelete size={15} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PanelStatus>

      {!readOnly && (
        <>
          <CharacterFormModal
            open={modalOpen}
            character={editing}
            onClose={() => {
              setModalOpen(false)
              setEditing(null)
            }}
            onSubmit={handleSubmit}
          />
          <ConfirmDialog
            open={deleteId !== null}
            message="确定要删除这个人物吗？此操作不可恢复。"
            onConfirm={handleDelete}
            onCancel={() => setDeleteId(null)}
          />
        </>
      )}
    </div>
  )
}
