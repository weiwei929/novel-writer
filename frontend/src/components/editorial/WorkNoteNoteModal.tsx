import { useEffect, useState } from 'react'
import { IconClose } from '../ui/icons'
import type { WorkNote } from '../../services/api'

export interface WorkNoteNoteModalProps {
  open: boolean
  entry: WorkNote | null
  fieldLabel: string
  loading?: boolean
  onSave: (note: string | null) => void
  onClose: () => void
}

export default function WorkNoteNoteModal({
  open,
  entry,
  fieldLabel,
  loading = false,
  onSave,
  onClose,
}: WorkNoteNoteModalProps) {
  const [draft, setDraft] = useState('')

  useEffect(() => {
    if (open && entry) setDraft(entry.note ?? '')
  }, [open, entry])

  if (!open || !entry) return null

  const trimmed = draft.trim()
  const payload = trimmed.length === 0 ? null : trimmed

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900">当时为什么这么改</h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{fieldLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 hover:bg-gray-100 rounded text-gray-400 disabled:opacity-50"
          >
            <IconClose size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-2">
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            rows={5}
            disabled={loading}
            placeholder="写下改动的理由（可留空）"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-y min-h-[120px] focus:outline-none focus:ring-2 focus:ring-amber-200"
          />
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => onSave(payload)}
            disabled={loading}
            className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
          >
            {loading ? '保存中…' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
