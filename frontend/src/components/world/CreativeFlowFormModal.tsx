import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { CreativeFlow, CreativeFlowInput } from '../../services/api'

interface CreativeFlowFormModalProps {
  open: boolean
  flow: CreativeFlow | null
  onClose: () => void
  onSubmit: (data: Omit<CreativeFlowInput, 'projectId'>) => Promise<void>
}

const tagsToText = (tags?: string[] | null) => (Array.isArray(tags) ? tags.join(', ') : '')
const textToTags = (text: string) =>
  text
    .split(',')
    .map(t => t.trim())
    .filter(Boolean)

export default function CreativeFlowFormModal({
  open,
  flow,
  onClose,
  onSubmit,
}: CreativeFlowFormModalProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tagsText, setTagsText] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setTitle(flow?.title ?? '')
    setContent(flow?.content ?? '')
    setTagsText(tagsToText(flow?.tags))
  }, [open, flow])

  if (!open) return null

  const handleSubmit = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      await onSubmit({
        title: title.trim(),
        content,
        tags: textToTags(tagsText),
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const inputCls =
    'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white'

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{flow ? '编辑创作心流' : '新增创作心流'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              标题 <span className="text-red-500">*</span>
            </label>
            <input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} placeholder="心流标题" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">正文（Markdown）</label>
            <textarea
              className={`${inputCls} font-mono`}
              rows={12}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="# 标题&#10;支持 Markdown 语法..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">标签（逗号分隔）</label>
            <input className={inputCls} value={tagsText} onChange={e => setTagsText(e.target.value)} placeholder="如：开篇, 转折, 灵感" />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !title.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
