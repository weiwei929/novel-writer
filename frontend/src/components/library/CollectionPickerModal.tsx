import { useEffect, useState } from 'react'
import { IconClose, IconPlus } from '../ui/icons'
import type { Collection } from '../../services/api'

export interface CollectionPickerModalProps {
  open: boolean
  collections: Collection[]
  currentCollectionId?: string | null
  onConfirm: (collectionId: string | null) => void
  onCancel: () => void
  onCreateNew: () => void
}

export default function CollectionPickerModal({
  open,
  collections,
  currentCollectionId,
  onConfirm,
  onCancel,
  onCreateNew,
}: CollectionPickerModalProps) {
  const [selected, setSelected] = useState<string>('none')

  useEffect(() => {
    if (open) {
      setSelected(currentCollectionId ?? 'none')
    }
  }, [open, currentCollectionId])

  if (!open) return null

  const handleConfirm = () => {
    onConfirm(selected === 'none' ? null : selected)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-sm border border-gray-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">归入文集</h2>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 hover:bg-gray-100 rounded text-gray-400"
          >
            <IconClose size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-2 max-h-72 overflow-y-auto">
          <label
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm ${
              selected === 'none'
                ? 'border-blue-300 bg-blue-50 text-blue-900'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <input
              type="radio"
              name="collection-pick"
              checked={selected === 'none'}
              onChange={() => setSelected('none')}
            />
            全部作品（不归入文集）
          </label>

          {collections.map(c => (
            <label
              key={c.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm ${
                selected === c.id
                  ? 'border-blue-300 bg-blue-50 text-blue-900'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="collection-pick"
                checked={selected === c.id}
                onChange={() => setSelected(c.id)}
              />
              {c.name}
            </label>
          ))}

          <button
            type="button"
            onClick={onCreateNew}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-blue-600 border border-dashed border-blue-200 rounded-lg hover:bg-blue-50"
          >
            <IconPlus size={14} />
            新建文集
          </button>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  )
}
