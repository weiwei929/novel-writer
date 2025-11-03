import React, { useState, useEffect } from 'react'
import { collectionsApi, Collection, CreateCollectionData } from '../../services/api'
import { Plus, Edit, Trash2, FolderOpen, Tag } from 'lucide-react'

const CollectionsList: React.FC = () => {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // 加载文集数据
  useEffect(() => {
    loadCollections()
  }, [])

  const loadCollections = async () => {
    try {
      setLoading(true)
      const data = await collectionsApi.getAll()
      setCollections(data)
    } catch (err) {
      setError('加载文集失败')
      console.error('Error loading collections:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个文集吗？')) return
    
    try {
      await collectionsApi.delete(id)
      setCollections(collections.filter(c => c.id !== id))
    } catch (err) {
      setError('删除文集失败')
      console.error('Error deleting collection:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">加载中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">文集管理</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-600"
        >
          <Plus size={20} />
          创建文集
        </button>
      </div>

      {collections.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen size={64} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg mb-4">还没有文集</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600"
          >
            创建第一个文集
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              onDelete={handleDelete}
              onUpdate={loadCollections}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateCollectionModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            loadCollections()
          }}
        />
      )}
    </div>
  )
}

interface CollectionCardProps {
  collection: Collection
  onDelete: (id: string) => void
  onUpdate: () => void
}

const CollectionCard: React.FC<CollectionCardProps> = ({ collection, onDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold">{collection.name}</h3>
        <div className="flex gap-2">
          <button className="text-blue-500 hover:text-blue-700">
            <Edit size={18} />
          </button>
          <button 
            onClick={() => onDelete(collection.id)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {collection.description && (
        <p className="text-gray-600 mb-4">{collection.description}</p>
      )}

      <div className="flex items-center gap-4 mb-4">
        <span className="text-sm text-gray-500">
          {collection.projectCount} 个项目
        </span>
        <span className="text-sm text-gray-500">
          {new Date(collection.createdAt).toLocaleDateString()}
        </span>
      </div>

      {collection.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {collection.tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm"
            >
              <Tag size={14} />
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

interface CreateCollectionModalProps {
  onClose: () => void
  onSuccess: () => void
}

const CreateCollectionModal: React.FC<CreateCollectionModalProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState<CreateCollectionData & { tags: string[] }>({
    name: '',
    description: '',
    tags: []
  })
  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    try {
      setLoading(true)
      await collectionsApi.create({
        ...formData,
        name: formData.name.trim(),
        description: formData.description?.trim(),
      })
      onSuccess()
    } catch (err) {
      setError('创建文集失败')
      console.error('Error creating collection:', err)
    } finally {
      setLoading(false)
    }
  }

  const addTag = () => {
    const tag = tagInput.trim()
    if (tag && !formData.tags.includes(tag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tag]
      })
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">创建新文集</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              文集名称 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入文集名称"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入文集描述"
              rows={3}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              标签
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
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
              disabled={loading || !formData.name.trim()}
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

export default CollectionsList