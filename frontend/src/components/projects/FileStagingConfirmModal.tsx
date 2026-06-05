import { IconClose } from '../ui/icons'

export interface FileStagingConfirmModalProps {
  open: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function FileStagingConfirmModal({
  open,
  loading = false,
  onConfirm,
  onCancel,
}: FileStagingConfirmModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-amber-50/40 rounded-t-xl">
          <h2 className="text-lg font-semibold text-gray-900">放入文件暂存？</h2>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="p-1.5 hover:bg-gray-100 rounded text-gray-400 disabled:opacity-50"
          >
            <IconClose size={18} />
          </button>
        </div>

        <div className="px-5 py-5">
          <p className="text-sm text-gray-700 leading-relaxed">
            此作品将进入文件暂存，可随时恢复。
          </p>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
          >
            {loading ? '处理中…' : '放入文件暂存'}
          </button>
        </div>
      </div>
    </div>
  )
}
