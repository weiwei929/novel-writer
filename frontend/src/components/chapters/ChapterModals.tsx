import React, { useState } from 'react'
import { X } from 'lucide-react'
import { Chapter, CreateChapterData } from '../../services/api'

interface CreateChapterModalProps {
  onClose: () => void
  onSubmit: (
    data: Omit<CreateChapterData, 'projectId'> & { summary?: string; mdSynopsis?: string }
  ) => void
  nextOrder: number
}

export const CreateChapterModal: React.FC<CreateChapterModalProps> = ({
  onClose,
  onSubmit,
  nextOrder,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    notes: '',
    summary: '',
    mdSynopsis: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    onSubmit({
      title: formData.title.trim(),
      content: formData.content,
      notes: formData.notes,
      order: nextOrder,
      summary: formData.summary?.trim() || '',
      mdSynopsis: formData.mdSynopsis?.trim() || '',
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">创建新章节</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">章节标题 *</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={`第 ${nextOrder} 章`}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">章节大纲</label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-20"
              placeholder="简要描述这一章的内容要点..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">章节梗概（必填）</label>
            <textarea
              value={formData.summary}
              onChange={e => setFormData({ ...formData, summary: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-20"
              placeholder="本章的核心推进与要点"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              初始元数据：章节梗概（synopsis）
            </label>
            <textarea
              value={formData.mdSynopsis}
              onChange={e => setFormData({ ...formData, mdSynopsis: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-20"
              placeholder="元数据中的章节梗概，可与上方梗概一致或更详细"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">初始内容</label>
            <textarea
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32"
              placeholder="可以预先输入一些内容，也可以留空稍后编辑..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!formData.title.trim()}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              创建章节
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface EditChapterModalProps {
  chapter: Chapter
  onClose: () => void
  onSubmit: (updates: Partial<Chapter>) => void
}

export const EditChapterModal: React.FC<EditChapterModalProps> = ({
  chapter,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    title: chapter.title,
    notes: chapter.notes || '',
    status: chapter.status,
    order: chapter.order,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    onSubmit({
      title: formData.title.trim(),
      notes: formData.notes,
      status: formData.status,
      order: formData.order,
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">编辑章节设置</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">章节标题 *</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">章节顺序</label>
            <input
              type="number"
              min="1"
              value={formData.order}
              onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">章节状态</label>
            <select
              value={formData.status}
              onChange={e =>
                setFormData({ ...formData, status: e.target.value as Chapter['status'] })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="draft">草稿</option>
              <option value="writing">写作中</option>
              <option value="completed">已完成</option>
              <option value="published">已发布</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">章节大纲</label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24"
              placeholder="章节大纲和要点..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!formData.title.trim()}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              保存更改
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
