import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MarkdownEditor from '../components/editor/MarkdownEditor'
import { projectsApi, Project } from '../services/api'
import { ArrowLeft, BookOpen } from 'lucide-react'

const EditorPage: React.FC = () => {
  const { projectId, chapterId } = useParams<{ projectId?: string; chapterId?: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (projectId) {
      loadProject()
    } else {
      setLoading(false)
    }
  }, [projectId])

  const loadProject = async () => {
    if (!projectId) return

    try {
      setLoading(true)
      const projectData = await projectsApi.getById(projectId)
      setProject(projectData)
      
      // TODO: 加载章节内容
      if (chapterId) {
        // 这里应该加载具体章节内容
        setContent('# 章节标题\n\n开始你的创作...')
      } else {
        setContent('# 新的创作\n\n开始你的创作...')
      }
    } catch (err) {
      setError('加载项目失败')
      console.error('Error loading project:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (content: string) => {
    // TODO: 实现保存逻辑
    console.log('保存内容:', content)
    // 这里应该调用 API 保存章节内容
  }

  const handleContentChange = (content: string) => {
    setContent(content)
  }

  const handleGoBack = () => {
    if (projectId) {
      navigate(`/projects/${projectId}`)
    } else {
      navigate('/projects')
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
        <button
          onClick={handleGoBack}
          className="ml-4 text-blue-600 hover:underline"
        >
          返回
        </button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* 顶部导航 */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleGoBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
              <span>返回</span>
            </button>
            
            <div className="flex items-center space-x-2">
              <BookOpen size={20} className="text-gray-400" />
              <div>
                <h1 className="font-semibold">
                  {project ? project.title : '写作编辑器'}
                </h1>
                {project && (
                  <p className="text-sm text-gray-500">
                    {project.author} · {project.status}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {project && (
              <div className="text-sm text-gray-500">
                字数: {project.wordCount.toLocaleString()} · 章节: {project.chapterCount}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 编辑器区域 */}
      <div className="flex-1 overflow-hidden">
        <MarkdownEditor
          initialContent={content}
          onSave={handleSave}
          onContentChange={handleContentChange}
          autoSave={true}
          autoSaveDelay={3000}
        />
      </div>
    </div>
  )
}

export default EditorPage