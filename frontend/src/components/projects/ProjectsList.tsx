import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { projectsApi, collectionsApi, chaptersApi, Project, Collection, CreateProjectData } from '../../services/api'
import { Plus, Edit, Trash2, FileText, User, Calendar, BarChart3, Eye } from 'lucide-react'

const ProjectsList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState<string>('')
  const [previewProject, setPreviewProject] = useState<Project | null>(null)
  const [previewChapters, setPreviewChapters] = useState<any[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)

  useEffect(() => {
    (async () => {
      if (!previewProject) return
      try {
        setPreviewLoading(true)
        const chs = await chaptersApi.getByProjectId(previewProject.id)
        setPreviewChapters(chs.sort((a,b)=>a.order-b.order))
      } catch {
        setPreviewChapters([])
      } finally {
        setPreviewLoading(false)
      }
    })()
  }, [previewProject])
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const fromUrl = searchParams.get('collectionId') || ''
    if (fromUrl && fromUrl !== selectedCollection) {
      setSelectedCollection(fromUrl)
    } else {
      loadData()
    }
  }, [selectedCollection, searchParams])

  const loadData = async () => {
    try {
      setLoading(true)
      const [projectsData, collectionsData] = await Promise.all([
        projectsApi.getAll(selectedCollection || undefined),
        collectionsApi.getAll()
      ])
      setProjects(projectsData)
      setCollections(collectionsData)
    } catch (err) {
      setError('加载数据失败')
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个项目吗？')) return
    
    try {
      await projectsApi.delete(id)
      setProjects(projects.filter(p => p.id !== id))
    } catch (err) {
      setError('删除项目失败')
      console.error('Error deleting project:', err)
    }
  }

  const getCollectionName = (collectionId: string) => {
    const collection = collections.find(c => c.id === collectionId)
    return collection?.name || '未分类'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700'
      case 'writing': return 'bg-blue-100 text-blue-700'
      case 'completed': return 'bg-green-100 text-green-700'
      case 'published': return 'bg-purple-100 text-purple-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return '草稿'
      case 'writing': return '创作中'
      case 'completed': return '已完成'
      case 'published': return '已发布'
      default: return '未知'
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
        <div>
          <h1 className="text-2xl font-bold">项目管理</h1>
          <p className="text-gray-600 mt-1">管理你的小说创作项目</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-600"
        >
          <Plus size={20} />
          创建项目
        </button>
      </div>

      {/* 筛选器 */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">筛选文集：</label>
          <select
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">所有文集</option>
            {collections.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <FileText size={64} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg mb-4">
            {selectedCollection ? '该文集中还没有项目' : '还没有项目'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600"
          >
            创建第一个项目
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              collectionName={getCollectionName(project.collectionId || '')}
              onDelete={handleDelete}
              onUpdate={loadData}
              getStatusColor={getStatusColor}
              getStatusText={getStatusText}
              onPreview={(p)=>setPreviewProject(p)}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateProjectModal
          collections={collections}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            loadData()
          }}
        />
      )}

      {/* 预览弹窗 */}
      {previewProject && (
        <div className="fixed inset-0 bg-black/40 z-50 flex">
          <div className="absolute inset-0" onClick={()=>setPreviewProject(null)}></div>
          <div className="relative ml-auto h-full w-[36rem] bg-white shadow-2xl border flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">项目预览</h3>
                <div className="text-xs text-gray-500 truncate">{previewProject.title}</div>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded" onClick={()=>setPreviewProject(null)}>关闭</button>
            </div>
            <div className="p-4 space-y-3 overflow-auto">
              <div className="text-sm text-gray-700">
                <div className="font-medium mb-1">项目梗概</div>
                <div className="p-3 bg-gray-50 border rounded whitespace-pre-wrap min-h-[80px]">{(previewProject as any)?.metadata?.synopsis?.current || '暂无梗概'}</div>
              </div>
              <div className="text-sm text-gray-700">
                <div className="font-medium mb-1">全文预览</div>
                <div className="p-3 bg-gray-50 border rounded whitespace-pre-wrap min-h-[160px] max-h-[480px] overflow-auto">
                  {previewLoading ? (
                    <div className="text-gray-500">加载章节中...</div>
                  ) : previewChapters.length === 0 ? (
                    <div className="text-gray-500">暂无章节内容</div>
                  ) : (
                    previewChapters.map((c)=> (
                      <div key={c.id} className="mb-4">
                        <div className="font-medium text-gray-900">第 {c.order} 章：{c.title}</div>
                        {c.summary && <div className="text-xs text-gray-500 mt-0.5">{c.summary}</div>}
                        <div className="text-sm text-gray-800 whitespace-pre-wrap mt-1">{c.content || '（空）'}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-500">字数：{previewProject.wordCount.toLocaleString()} · 章节：{previewProject.chapterCount}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface ProjectCardProps {
  project: Project
  collectionName: string
  onDelete: (id: string) => void
  onUpdate: () => void
  getStatusColor: (status: string) => string
  getStatusText: (status: string) => string
  onPreview: (project: Project) => void
}

const ProjectCard: React.FC<ProjectCardProps> = ({ 
  project, 
  collectionName, 
  onDelete,
  getStatusColor,
  getStatusText,
  onPreview
}) => {
  const navigate = useNavigate()
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xl font-semibold line-clamp-2">{project.title}</h3>
        <div className="flex gap-2">
          <button 
            className="text-blue-500 hover:text-blue-700"
            onClick={async () => {
              try {
                const chapters = await chaptersApi.getByProjectId(project.id)
                if (chapters && chapters.length > 0) {
                  navigate(`/editor/${chapters[0].id}`)
                } else {
                  // 无章节时改为进入项目详情页，统一通过“章节规划”新增
                  navigate(`/projects/${project.id}`)
                }
              } catch {
                navigate(`/projects/${project.id}`)
              }
            }}
            title="进入编辑器"
          >
            <Edit size={18} />
          </button>
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={() => onPreview(project)}
            title="预览项目"
          >
            <Eye size={18} />
          </button>
          <button 
            onClick={() => onDelete(project.id)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {project.description && (
        <p className="text-gray-600 mb-4 line-clamp-3">{project.description}</p>
      )}

      <div className="mb-4">
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <span className="inline-flex items-center gap-2"><User size={16} className="text-gray-400" />{project.author}</span>
          <span className="inline-flex items-center gap-2"><FileText size={16} className="text-gray-400" />{collectionName}</span>
          <span className="inline-flex items-center gap-2"><Calendar size={16} className="text-gray-400" />{new Date(project.createdAt).toLocaleDateString()}</span>
          <span className="inline-flex items-center gap-2"><BarChart3 size={16} className="text-gray-400" />{project.wordCount.toLocaleString()} 字 · {project.chapterCount} 章</span>
        </div>
      </div>

      {/* 大纲预览（只显示章节序号与标题；梗概小号置于下一行） */}
      <div className="mb-4">
        <div className="text-sm font-medium text-gray-800 mb-1">大纲</div>
        <div className="p-3 bg-gray-50 border rounded text-sm text-gray-700 min-h-[60px]">
          {(() => {
            const outlineText = (project as any)?.metadata?.plotStructure?.current || ''
            const lines = outlineText.split('\n').filter(Boolean)
            if (lines.length === 0) return <div className="text-gray-500">暂无大纲</div>
            return (
              <div className="space-y-1">
                {lines.slice(0, 5).map((line: string, idx: number) => {
                  const parts = line.split(' — ')
                  const main = parts[0]
                  const synopsis = parts[1] || ''
                  return (
                    <div key={idx} className="leading-tight">
                      <div className="text-gray-800">{main}</div>
                      {synopsis && <div className="text-xs text-gray-500 mt-0.5">{synopsis}</div>}
                    </div>
                  )
                })}
                {lines.length > 5 && <div className="text-xs text-gray-400">… 更多章节</div>}
              </div>
            )
          })()}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
          {getStatusText(project.status)}
        </span>
        
        {project.genre.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {project.genre.slice(0, 2).map((genre, index) => (
              <span
                key={index}
                className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs"
              >
                {genre}
              </span>
            ))}
            {project.genre.length > 2 && (
              <span className="text-gray-400 text-xs">+{project.genre.length - 2}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

interface CreateProjectModalProps {
  collections: Collection[]
  onClose: () => void
  onSuccess: () => void
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ collections, onClose, onSuccess }) => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<CreateProjectData & { genre: string[], tags: string[] }>({
    title: '',
    description: '',
    author: '',
    genre: [],
    tags: [],
    status: 'draft',
    collectionId: ''
  })
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
      const newProject = await projectsApi.create({
        ...formData,
        title: formData.title.trim(),
        description: formData.description?.trim(),
        author: formData.author.trim(),
      })

      if (newProject?.id) {
        // 2. 写入初始项目元数据（梗概）
        try {
          await projectsApi.updateMetadata(newProject.id, 'synopsis', initialSynopsis.trim())
        } catch {}

        // 3. 默认生成第1章（可开关）
        if (autoCreateFirstChapter) {
          try {
            const created = await chaptersApi.createForProject(newProject.id, {
              title: '第1章',
              content: '',
              order: 1
            })
            await chaptersApi.update(created.id, { summary: initialSynopsis.trim() })
            await chaptersApi.updateMetadata(created.id, 'synopsis', initialSynopsis.trim())
          } catch {}
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
        genre: [...formData.genre, genre]
      })
      setGenreInput('')
    }
  }

  const removeGenre = (genreToRemove: string) => {
    setFormData({
      ...formData,
      genre: formData.genre.filter(genre => genre !== genreToRemove)
    })
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
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">创建新项目</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                项目标题 *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入项目标题"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                作者 *
              </label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入作者名称"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                所属文集
              </label>
              <select
                value={formData.collectionId}
                onChange={(e) => setFormData({ ...formData, collectionId: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">选择文集</option>
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                状态
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              项目描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入项目描述"
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
                onChange={(e) => setInitialSynopsis(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="简要描述作品的核心构思与目标"
                rows={4}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">初始化选项</label>
              <div className="flex items-center gap-2">
                <input id="autoCreateFirstChapter" type="checkbox" checked={autoCreateFirstChapter} onChange={(e)=>setAutoCreateFirstChapter(e.target.checked)} />
                <label htmlFor="autoCreateFirstChapter" className="text-sm text-gray-700">创建后默认生成第 1 章，并写入梗概</label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                类型标签
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={genreInput}
                  onChange={(e) => setGenreInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGenre())}
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
              disabled={loading || !formData.title.trim() || !formData.author.trim() || !initialSynopsis.trim()}
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

export default ProjectsList
