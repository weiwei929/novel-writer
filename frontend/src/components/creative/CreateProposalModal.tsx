import { useEffect, useRef, useState } from 'react'
import { IconClose } from '../ui/icons'

interface CreateProposalModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (title: string) => Promise<void> | void
  defaultTitle?: string
}

export default function CreateProposalModal({
  open,
  onClose,
  onSubmit,
  defaultTitle = '新创意作品',
}: CreateProposalModalProps) {
  const [title, setTitle] = useState(defaultTitle)
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTitle(defaultTitle)
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 50)
    }
  }, [open, defaultTitle])

  if (!open) return null

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    setSubmitting(true)
    try {
      await onSubmit(trimmed)
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* 遮罩背景 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* 对话框主卡片 */}
      <div className="relative bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-md overflow-hidden z-10 animate-scale-up">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h3 className="text-base font-bold text-gray-900">新作品创意构思</h3>
            <p className="text-xs text-gray-400 mt-0.5">开启作品生命周期的最初阶段</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <IconClose size={16} />
          </button>
        </div>

        <form onSubmit={e => void handleFormSubmit(e)} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              作品标题 <span className="text-amber-600">*</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="请输入作品标题（如：飞芸之上）"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-sans"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="px-5 py-2 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-40 rounded-xl shadow-sm transition-all"
            >
              {submitting ? '创建中…' : '确认创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
