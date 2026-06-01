import { IconClose } from '../ui/icons'
import React, { useEffect } from 'react'

interface ChapterContentModalProps {
  open: boolean
  order: number
  title: string
  content: string
  wordCount: number
  onClose: () => void
}

const ChapterContentModal: React.FC<ChapterContentModalProps> = ({
  open,
  order,
  title,
  content,
  wordCount,
  onClose,
}) => {
  // Esc 关闭
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/40" />
      {/* 弹窗 */}
      <div
        className="relative bg-white rounded-lg shadow-2xl w-[720px] max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-3 border-b shrink-0">
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              第 {order} 章 · {title}
            </h3>
            <span className="text-xs text-gray-400 mt-0.5">
              {wordCount.toLocaleString()} 字
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
          >
            <IconClose size={18} />
          </button>
        </div>
        {/* 内容（只读） */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <pre className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">
            {content || '（暂无内容）'}
          </pre>
        </div>
      </div>
    </div>
  )
}

export default ChapterContentModal
