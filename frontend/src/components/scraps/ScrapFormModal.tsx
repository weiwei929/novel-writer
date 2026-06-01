import { useEffect, useRef, useState } from 'react'
import type { Scrap, Project } from '../../services/api'
import { projectsApi } from '../../services/api'
import { IconClose, IconPlus } from '../ui/icons'

interface ScrapFormModalProps {
  isOpen: boolean
  scrap?: Scrap | null
  onClose: () => void
  onSave: (data: { content: string; note?: string; tags?: string[]; projectId?: string }) => Promise<void>
}

export default function ScrapFormModal({ isOpen, scrap, onClose, onSave }: ScrapFormModalProps) {
  const [content, setContent] = useState('')
  const [note, setNote] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [projectId, setProjectId] = useState('')
  const [projects, setProjects] = useState<Project[]>([])
  const [saving, setSaving] = useState(false)
  const contentRef = useRef<HTMLTextAreaElement>(null)

  const isEdit = !!scrap

  // 加载项目列表
  useEffect(() => {
    if (isOpen) {
      projectsApi.getAll().then(setProjects).catch(() => setProjects([]))
    }
  }, [isOpen])

  // 编辑时回填表单
  useEffect(() => {
    if (scrap && isOpen) {
      setContent(scrap.content)
      setNote(scrap.note || '')
      setTags(Array.isArray(scrap.tags) ? scrap.tags : [])
      setProjectId(scrap.projectId || '')
    } else if (!isOpen) {
      // 关闭时重置
      setContent('')
      setNote('')
      setTags([])
      setTagInput('')
      setProjectId('')
    }
  }, [scrap, isOpen])

  // 自动聚焦
  useEffect(() => {
    if (isOpen && contentRef.current) {
      setTimeout(() => contentRef.current?.focus(), 100)
    }
  }, [isOpen])

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) {
      setTags([...tags, t])
    }
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    }
  }

  const handleSave = async () => {
    if (!content.trim()) return
    setSaving(true)
    try {
      await onSave({
        content: content.trim(),
        note: note.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        projectId: projectId || undefined,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? '✏ 编辑碎片' : '✨ 新建灵感碎片'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <IconClose size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* 内容 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              ref={contentRef}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="手写输入，或 Ctrl+V 粘贴内容..."
              rows={6}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 
                         placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 
                         focus:border-transparent resize-vertical transition-shadow"
            />
          </div>

          {/* 备注 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              备注 <span className="text-gray-400 font-normal">(可选)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="为什么要保存这段内容..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 
                         placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 
                         focus:border-transparent transition-shadow"
            />
          </div>

          {/* 标签 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">标签</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium 
                             bg-blue-50 text-blue-700 border border-blue-100"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:text-blue-900 ml-0.5"
                  >
                    <IconClose size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="输入标签后按回车..."
                className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm 
                           placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 
                           focus:border-transparent"
              />
              <button
                onClick={addTag}
                disabled={!tagInput.trim()}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 
                           hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed 
                           transition-colors flex items-center gap-1"
              >
                <IconPlus size={14} />
                添加
              </button>
            </div>
          </div>

          {/* 所属作品 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              所属作品 <span className="text-gray-400 font-normal">(可选)</span>
            </label>
            <select
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 
                         bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 
                         focus:border-transparent transition-shadow"
            >
              <option value="">不归属任何作品</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-800 
                       hover:bg-gray-100 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!content.trim() || saving}
            className="px-5 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white 
                       hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed 
                       transition-colors"
          >
            {saving ? '保存中...' : isEdit ? '保存修改' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
