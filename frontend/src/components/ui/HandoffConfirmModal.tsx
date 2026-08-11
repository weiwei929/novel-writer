import { IconCheckCircle, IconClose } from './icons'

export interface HandoffConfirmModalProps {
  open: boolean
  title?: string
  targetDepartmentName: string
  workTitle: string
  confirmText?: string
  cancelText?: string
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function HandoffConfirmModal({
  open,
  title = '跨部门提交确认',
  targetDepartmentName,
  workTitle,
  confirmText = '确认提交',
  cancelText = '取消',
  loading = false,
  onConfirm,
  onCancel,
}: HandoffConfirmModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-[70] p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-100 text-emerald-700 p-1.5 rounded-lg">
              <IconCheckCircle size={18} />
            </div>
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <IconClose size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-4 text-sm text-emerald-900 leading-relaxed">
            <p className="font-medium text-emerald-950 mb-1">
              作品《{workTitle}》
            </p>
            <p className="text-xs text-emerald-800">
              此作品将提交至<strong className="mx-1 underline decoration-emerald-400">{targetDepartmentName}</strong>，请在后续阶段进行处理。
            </p>
          </div>

          <p className="text-xs text-gray-500">
            确认后，该作品将在本部门转为只读业绩留档，并进入【{targetDepartmentName}】的待处理列表中。
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-5 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <IconCheckCircle size={14} />
            {loading ? '提交中…' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
