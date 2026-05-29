import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Collection, CreateProjectData, projectsApi, chaptersApi } from '../../services/api'

export interface CreateProjectModalProps {
  collections: Collection[]
  onClose: () => void
  onSuccess: () => void
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  collections,
  onClose,
  onSuccess,
}) => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<CreateProjectData & { genre: string[]; tags: string[] }>(
    {
      title: '',
      description: '',
      author: '',
      genre: [],
      tags: [],
      status: 'draft',
      collectionId: '',
    }
  )
  const [initialSynopsis, setInitialSynopsis] = useState('')
  const [autoCreateFirstChapter, setAutoCreateFirstChapter] = useState(true)
  const [genreInput, setGenreInput] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.author.trim() || !initialSynopsis.trim()) return

    try {
      setLoading(true)
      // 1. 创建项目
      // Use as any to bypass strict type check for now if statuses don't align perfectly
      const newProject = await projectsApi.create({
        ...formData,
        title: formData.title.trim(),
        description: formData.description?.trim(),
        author: formData.author.trim(),
        status: formData.status as any, 
      })

      if (newProject?.id) {
        // 2. 写入初始项目元数据（梗概）
        try {
          await projectsApi.updateMetadata(newProject.id, 'synopsis', initialSynopsis.trim())
        } catch (e) { console.error('Failed to save initial synopsis:', e) }

        // 3. 默认生成第1章（可开关）
        if (autoCreateFirstChapter) {
          try {
            const created = await chaptersApi.create({
              projectId: newProject.id,
              title: '第1章',
              content: '',
              order: 1,
            })
            await chaptersApi.update(created.id, { summary: initialSynopsis.trim() })
            await chaptersApi.updateMetadata(created.id, 'synopsis', initialSynopsis.trim())
          } catch (e) { console.error('Failed to save initial synopsis:', e) }
        }

        navigate(`/projects/${newProject.id}`)
      }

      onSuccess()
    } catch (err) {
      setError('创建项目失败')
      console.error('Error creating project:', err)
    } finally {
      setLoading(false)
    }
  }

  const addGenre = () => {
    const genre = genreInput.trim()
    if (genre && !formData.genre.includes(genre)) {
      setFormData({
        ...formData,
        genre: [...formData.genre, genre],
      })
      setGenreInput('')
    }
  }

  const removeGenre = (genreToRemove: string) => {
    setFormData({
      ...formData,
      genre: formData.genre.filter(genre => genre !== genreToRemove),
    })
  }

  const addTag = () => {
    const tag = tagInput.trim()
    if (tag && !formData.tags.includes(tag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tag],
      })
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove),
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">创建新作品</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">作品标题 *</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入作品标题"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">作者 *</label>
              <input
                type="text"
                value={formData.author}
                onChange={e => setFormData({ ...formData, author: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入作者名称"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">所属文集</label>
              <select
                value={formData.collectionId}
                onChange={e => setFormData({ ...formData, collectionId: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">选择文集</option>
                {collections.map(collection => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="draft">草稿</option>
                <option value="writing">创作中</option>
                <option value="completed">已完成</option>
                <option value="published">已发布</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">作品描述</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入作品描述"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                项目梗概（必填）
              </label>
              <textarea
                value={initialSynopsis}
                onChange={e => setInitialSynopsis(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="简要描述作品的核心构思与目标"
                rows={4}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">初始化选项</label>
              <div className="flex items-center gap-2">
                <input
                  id="autoCreateFirstChapter"
                  type="checkbox"
                  checked={autoCreateFirstChapter}
                  onChange={e => setAutoCreateFirstChapter(e.target.checked)}
                />
                <label htmlFor="autoCreateFirstChapter" className="text-sm text-gray-700">
                  创建后默认生成第 1 章，并写入梗概
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">类型标签</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={genreInput}
                  onChange={e => setGenreInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addGenre())}
                  className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="如：玄幻、言情"
                />
                <button
                  type="button"
                  onClick={addGenre}
                  className="bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600"
                >
                  添加
                </button>
              </div>
              {formData.genre.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.genre.map((genre, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-sm"
                    >
                      {genre}
                      <button
                        type="button"
                        onClick={() => removeGenre(genre)}
                        className="text-green-500 hover:text-green-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">标签</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入标签"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600"
                >
                  添加
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={
                loading ||
                !formData.title.trim() ||
                !formData.author.trim() ||
                !initialSynopsis.trim()
              }
              className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? '创建中...' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
