import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { projectsApi, chaptersApi, Project, Chapter } from '../services/api'
import { useNotifications } from '../hooks/useNotifications'
import { readMetadataFieldValue } from '../utils/metadataField'
import { ArrowLeft, FileText, Play, Bot, X, List } from 'lucide-react'
import { ChapterOutlineGenerator } from '../components/ai/ChapterOutlineGenerator'
import ContentMetadataCard from '../components/metadata/ContentMetadataCard'
import ChapterContentModal from '../components/editor/ChapterContentModal'
import ChapterPlanningEditor from '../components/editor/ChapterPlanningEditor'
import ProjectMetadataPanel from '../components/editor/ProjectMetadataPanel'

const ProjectDetailPage: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { success: notifySuccess } = useNotifications()

  const [project, setProject] = useState<Project | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // AI 章节大纲生成器
  const [showOutlineGenerator, setShowOutlineGenerator] = useState(false)
  // 章节规划
  const [showPlanning, setShowPlanning] = useState(false)
  // 内容元数据编辑
  const [showMetadataEditor, setShowMetadataEditor] = useState(false)

  // 梗概弹窗
  const [synopsisModal, setSynopsisModal] = useState<{
    order: number
    title: string
    synopsis: string
  } | null>(null)

  // 正文弹窗
  const [contentModal, setContentModal] = useState<{
    order: number
    title: string
    content: string
    wordCount: number
  } | null>(null)

  const load = async () => {
    if (!id) return
    try {
      setLoading(true)
      setError(null)
      const [p, list] = await Promise.all([
        projectsApi.getById(id),
        chaptersApi.getByProjectId(id),
      ])
      setProject(p)
      setChapters(list.sort((a, b) => a.order - b.order))
    } catch (e) {
      console.error('加载项目或章节失败:', e)
      setError('加载项目或章节失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      draft: '草稿',
      writing: '创作中',
      completed: '已完成',
    }
    return map[status] || status
  }

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-700">
          {error || '作品不存在'}
        </div>
        <button
          onClick={() => navigate('/projects')}
          className="px-4 py-2 bg-gray-600 text-white rounded"
        >
          返回作品列表
        </button>
      </div>
    )
  }

  const synopsis = readMetadataFieldValue(project.metadata?.synopsis)
  const hasContentMetadata = project.metadata

  return (
    <div className="p-6 h-[calc(100vh-64px)] flex flex-col overflow-hidden">
      {/* ── 顶部栏 ── */}
      <div className="flex items-center justify-between flex-shrink-0 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 shrink-0"
            title="返回作品列表"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-800 truncate">{project.title}</h1>
          {/* 作品状态 */}
          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded shrink-0">
            {getStatusText(project.status)}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-4">
          <button
            onClick={() => setShowPlanning(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-all text-sm"
          >
            <List size={14} />
            管理章节规划
          </button>
          <button
            onClick={() => navigate(`/editor/${project.id}`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Play size={14} />
            进入编辑器
          </button>
          <button
            onClick={() => setShowOutlineGenerator(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-all text-sm"
          >
            <Bot size={14} />
            AI 生成大纲
          </button>
        </div>
      </div>

      {/* ── 双栏内容 ── */}
      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* 左侧：梗概 + 章节列表 */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* 作品梗概（可折叠） */}
          {synopsis && (
            <details className="bg-white rounded-lg border shadow-sm mb-4 flex-shrink-0 group">
              <summary className="px-4 py-3 cursor-pointer select-none flex items-center gap-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-t-lg">
                <FileText size={14} className="text-gray-400" />
                作品梗概
              </summary>
              <div className="px-4 pb-4">
                <pre className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-sans max-h-40 overflow-y-auto">
                  {synopsis}
                </pre>
              </div>
            </details>
          )}

          {/* 章节列表 */}
          <div className="bg-white rounded-lg border shadow-sm flex-1 flex flex-col overflow-hidden">
            {/* 章节列表标题 */}
            <div className="px-4 py-3 border-b flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900">
                  章节列表
                  <span className="text-gray-400 font-normal ml-1">({chapters.length})</span>
                </h3>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span>总 {project.wordCount.toLocaleString()} 字</span>
              </div>
            </div>

            {/* 章节内容 */}
            {chapters.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-10 text-gray-500">
                <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <div className="mb-1 text-sm">暂无章节</div>
                <div className="text-xs text-gray-400 mb-4">
                  进入编辑器，使用"管理章节规划"创建章节
                </div>
                <button
                  onClick={() => navigate(`/editor/${project.id}`)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  <Play size={14} />
                  进入编辑器
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto divide-y">
                {chapters.map((c) => {
                  const hasSynopsis = !!(c.summary && c.summary.trim())
                  const hasContent = !!(c.content && c.content.trim())
                  return (
                    <div
                      key={c.id}
                      className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      {/* 章节信息 */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600 shrink-0">
                          第 {c.order} 章
                        </span>
                        <span className="font-medium text-sm text-gray-800 truncate">
                          {c.title || `第 ${c.order} 章`}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-gray-400 shrink-0">
                          <span>{c.wordCount.toLocaleString()} 字</span>
                          <span>·</span>
                          <span>{formatDate(c.updatedAt)}</span>
                          <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">
                            {getStatusText(c.status)}
                          </span>
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex items-center gap-1.5 shrink-0 ml-3">
                        {hasSynopsis && (
                          <button
                            onClick={() =>
                              setSynopsisModal({
                                order: c.order,
                                title: c.title,
                                synopsis: c.summary!,
                              })
                            }
                            className="text-xs px-2 py-1 rounded text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="查看章节梗概"
                          >
                            梗概
                          </button>
                        )}
                        {hasContent && (
                          <button
                            onClick={() =>
                              setContentModal({
                                order: c.order,
                                title: c.title,
                                content: c.content,
                                wordCount: c.wordCount,
                              })
                            }
                            className="text-xs px-2 py-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="查看章节正文"
                          >
                            正文
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/editor/${project.id}/${c.id}`)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 border border-blue-200 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors text-xs font-medium"
                          title="进入编辑器"
                        >
                          <Play size={12} />
                          写作
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* 右侧栏：内容元数据 */}
        {hasContentMetadata && (
          <div className="w-72 flex-shrink-0 hidden xl:block">
            <ContentMetadataCard
              metadata={project.metadata}
              className="h-full"
              onEdit={() => setShowMetadataEditor(true)}
            />
          </div>
        )}
      </div>

      {/* ── 弹窗 ── */}

      {/* 章节梗概弹窗 */}
      {synopsisModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setSynopsisModal(null)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white rounded-lg shadow-2xl w-[520px] max-h-[70vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <h3 className="text-sm font-medium text-gray-900">
                第 {synopsisModal.order} 章 · {synopsisModal.title}
                <span className="text-gray-400 font-normal ml-2">— 章节梗概</span>
              </h3>
              <button
                onClick={() => setSynopsisModal(null)}
                className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-5 py-4 overflow-y-auto text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {synopsisModal.synopsis}
            </div>
          </div>
        </div>
      )}

      {/* 章节正文弹窗 */}
      <ChapterContentModal
        open={!!contentModal}
        order={contentModal?.order ?? 0}
        title={contentModal?.title ?? ''}
        content={contentModal?.content ?? ''}
        wordCount={contentModal?.wordCount ?? 0}
        onClose={() => setContentModal(null)}
      />

      {/* AI 章节大纲生成器 */}
      {project && (
        <ChapterOutlineGenerator
          isOpen={showOutlineGenerator}
          onClose={() => setShowOutlineGenerator(false)}
          projectId={project.id}
          onSuccess={() => {
            load()
            notifySuccess('章节大纲已成功导入！')
          }}
        />
      )}

      {/* 章节规划编辑器 */}
      {showPlanning && project && (
        <ChapterPlanningEditor
          projectId={project.id}
          initialPlans={(project.metadata as any)?.chapterPlanning || []}
          onClose={() => setShowPlanning(false)}
          onSaved={() => {
            setShowPlanning(false)
            notifySuccess('章节规划已更新')
            load()
          }}
        />
      )}

      {/* 内容元数据编辑弹窗 */}
      {showMetadataEditor && project && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowMetadataEditor(false)} />
          <div className="absolute inset-4 md:inset-8 bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden">
            <ProjectMetadataPanel
              project={project}
              onClose={async () => {
                setShowMetadataEditor(false)
                // 重新加载项目以刷新元数据
                await load()
              }}
              initialField="synopsis"
              initialMode="view_all"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectDetailPage
