import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreateProjectData, Project, ProjectStatus, projectsApi, chaptersApi } from '../../services/api'
import { IconClose } from '../ui/icons'

export interface CreateProjectModalProps {
  onClose: () => void
  onSuccess: () => void
  /** quick：HomePage「快速开始写作」入口，仅要求作品名称，创建后直接进写作页 */
  variant?: 'full' | 'quick'
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  onClose,
  onSuccess,
  variant = 'full',
}) => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<CreateProjectData & { tags: string[] }>(
    {
      title: '',
      description: '',
      author: '',
      tags: [],
      status: 'draft' as ProjectStatus,
    }
  )
  const [initialSynopsis, setInitialSynopsis] = useState('')
  const [autoCreateFirstChapter, setAutoCreateFirstChapter] = useState(true)
  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** 快速创建的部分成功场景：作品已建好但第一章失败时缓存，重试不重复建作品 */
  const [createdProject, setCreatedProject] = useState<Project | null>(null)

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createdProject && !formData.title.trim()) return

    setLoading(true)
    setError(null)
    try {
      const project =
        createdProject ??
        (await projectsApi.create({
          title: formData.title.trim(),
          author: '',
          status: 'draft' as ProjectStatus,
        }))
      if (!createdProject) setCreatedProject(project)

      const chapter = await chaptersApi.create({
        projectId: project.id,
        title: '第1章',
        content: '',
        order: 1,
      })

      onSuccess()
      navigate(`/writing/${project.id}/${chapter.id}?from=writing`)
    } catch (err) {
      setError(
        createdProject
          ? `《${createdProject.title}》已创建，但第一章创建失败，请重试`
          : '创建作品失败，请重试'
      )
      console.error('Quick create failed:', err)
    } finally {
      setLoading(false)
    }
  }

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
        status: formData.status,
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

        navigate(`/work/${newProject.id}`)
      }

      onSuccess()
    } catch (err) {
      setError('创建项目失败')
      console.error('Error creating project:', err)
    } finally {
      setLoading(false)
    }
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

  if (variant === 'quick') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">开始一部新作品</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1 -mr-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
            >
              <IconClose size={18} />
            </button>
          </div>

          {error && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              {error}
            </div>
          )}

          <form onSubmit={handleQuickSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">作品名称</label>
              <input
                autoFocus
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="输入作品名称"
                disabled={!!createdProject}
              />
            </div>
            <p className="text-xs text-gray-400">创建后将自动生成「第 1 章」，直接进入写作页。</p>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading || (!createdProject && !formData.title.trim())}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '创建中…' : createdProject ? '重试创建第一章 →' : '开始写作 →'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
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

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
            <select
              value={formData.status}
              onChange={e =>
                setFormData({ ...formData, status: e.target.value as ProjectStatus })
              }
              className="w-full max-w-xs border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="draft">草稿</option>
              <option value="planning">企划中</option>
              <option value="writing">创作中</option>
              <option value="completed">已完成</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">作品描述（补充说明）</label>
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
                作品梗概（必填）
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

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">标签</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="如：玄幻、言情、大女主"
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
