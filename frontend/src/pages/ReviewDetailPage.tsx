import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  chaptersApi,
  projectsApi,
  type Chapter,
  type Project,
} from '../services/api'
import { useNotifications } from '../hooks/useNotifications'
import ProjectStatusBadge from '../components/projects/ProjectStatusBadge'
import FileStagingConfirmModal from '../components/projects/FileStagingConfirmModal'
import { AI_FROZEN_HINT, AI_FROZEN_LABEL, AI_UI_FROZEN } from '../config/aiFreeze'
import ThreeColumnLayout from '../components/creative/ThreeColumnLayout'
import { IconArrowLeft, IconSparkles } from '../components/ui/icons'

const EDITORIAL_QUEUE_STATUSES = ['written', 'reviewing'] as const

const REVIEW_DIMENSIONS = [
  { key: 'plot', label: '情节', hint: '故事架构、节奏、张力' },
  { key: 'character', label: '人物', hint: '塑造、动机、关系' },
  { key: 'dialogue', label: '对话', hint: '性格化、推进剧情' },
  { key: 'logic', label: '逻辑', hint: '因果链、设定一致性' },
  { key: 'style', label: '写作风格', hint: '文笔、调性统一' },
] as const

export default function ReviewDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { info: notifyInfo, success: notifySuccess, error: notifyError } = useNotifications()

  const [project, setProject] = useState<Project | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showFileStaging, setShowFileStaging] = useState(false)
  const [stagingLoading, setStagingLoading] = useState(false)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setLoadError(null)
    try {
      const [p, ch] = await Promise.all([
        projectsApi.getById(projectId),
        chaptersApi.getByProjectId(projectId),
      ])
      setProject(p)
      const sorted = [...ch].sort((a, b) => a.order - b.order)
      setChapters(sorted)
      setSelectedChapterId(prev => {
        if (prev && sorted.some(c => c.id === prev)) return prev
        return sorted[0]?.id ?? null
      })
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '无法加载作品信息'
      setLoadError(message)
      setProject(null)
      setChapters([])
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  const selectedChapter = useMemo(
    () => chapters.find(c => c.id === selectedChapterId) ?? null,
    [chapters, selectedChapterId]
  )

  const isInQueue =
    project != null &&
    EDITORIAL_QUEUE_STATUSES.includes(
      project.status as (typeof EDITORIAL_QUEUE_STATUSES)[number]
    )

  const handleMarkReviewed = () => {
    notifyInfo('标记已审', '审阅状态流转将在后续版本接入。')
  }

  const handleGenerateReport = () => {
    if (AI_UI_FROZEN) return
    notifyInfo('生成报告', AI_FROZEN_LABEL)
  }

  const handleConfirmFileStaging = async () => {
    if (!project) return
    setStagingLoading(true)
    try {
      await projectsApi.softDelete(project.id)
      setShowFileStaging(false)
      notifySuccess('已放入文件暂存')
      navigate('/editorial')
    } catch (e: unknown) {
      setShowFileStaging(false)
      notifyError(
        '放入文件暂存失败',
        e instanceof Error ? e.message : undefined
      )
    } finally {
      setStagingLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-amber-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (loadError || !project) {
    return (
      <div className="text-center py-20 text-gray-500 space-y-3">
        <p className="text-sm">{loadError || '未找到该作品。'}</p>
        <button
          type="button"
          onClick={() => navigate('/editorial')}
          className="text-sm text-amber-700 hover:underline"
        >
          返回审阅任务
        </button>
      </div>
    )
  }

  if (!isInQueue) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-sm text-gray-600">该作品不在编审队列。</p>
        <ProjectStatusBadge status={project.status} phase="editorial" />
        <button
          type="button"
          onClick={() => navigate('/editorial')}
          className="block mx-auto text-sm text-amber-700 hover:underline"
        >
          返回审阅任务
        </button>
      </div>
    )
  }

  const leftPanel = (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b bg-gray-50 shrink-0">
        章节 ({chapters.length})
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {chapters.length === 0 ? (
          <p className="text-xs text-gray-400 px-2 py-4">暂无章节</p>
        ) : (
          chapters.map(c => {
            const active = c.id === selectedChapterId
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedChapterId(c.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-amber-50 text-amber-900 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="line-clamp-2">{c.title || `第 ${c.order} 章`}</span>
              </button>
            )
          })
        )}
      </div>
    </div>
  )

  const middlePanel = (
    <div className="flex flex-col h-full min-h-0">
      {selectedChapter ? (
        <>
          <div className="px-4 py-3 border-b shrink-0">
            <h2 className="font-semibold text-gray-900">{selectedChapter.title}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {selectedChapter.wordCount.toLocaleString()} 字
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {selectedChapter.content?.trim() ? (
              <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap">
                {selectedChapter.content}
              </div>
            ) : (
              <p className="text-sm text-gray-400">本章暂无正文。</p>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400 p-6">
          {chapters.length === 0 ? '暂无章节' : '请选择章节'}
        </div>
      )}
    </div>
  )

  const rightPanel = (
    <div className="flex flex-col h-full">
      <div className="px-3 py-3 border-b shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <IconSparkles className="w-4 h-4 text-amber-600" />
          <h3 className="text-sm font-semibold text-gray-900">AI 审阅报告</h3>
        </div>
        <p className="text-xs text-amber-700">{AI_FROZEN_LABEL}</p>
        <p className="text-xs text-gray-500 mt-1">{AI_FROZEN_HINT}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {REVIEW_DIMENSIONS.map(dim => (
          <div
            key={dim.key}
            className="rounded-lg border border-dashed border-gray-200 bg-gray-50/80 p-3"
          >
            <div className="text-sm font-medium text-gray-800">{dim.label}</div>
            <div className="text-xs text-gray-500 mt-0.5">{dim.hint}</div>
            <div className="text-xs text-gray-400 mt-2">{AI_FROZEN_LABEL}</div>
          </div>
        ))}
      </div>
    </div>
  )

  const header = (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/editorial')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 shrink-0"
          >
            <IconArrowLeft size={16} />
            返回审阅任务
          </button>
          <h1 className="text-xl font-bold text-gray-900 truncate">{project.title}</h1>
          <ProjectStatusBadge status={project.status} phase="editorial" />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <p className="text-sm text-gray-500">{project.author?.trim() || '—'}</p>
          <button
            type="button"
            onClick={() => setShowFileStaging(true)}
            className="px-3 py-1.5 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
          >
            放入文件暂存
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleMarkReviewed}
          className="px-3 py-1.5 text-sm border border-amber-200 text-amber-800 rounded-lg hover:bg-amber-50"
        >
          标记已审
        </button>
        <button
          type="button"
          onClick={handleGenerateReport}
          disabled={AI_UI_FROZEN}
          className="px-3 py-1.5 text-sm border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          生成报告
        </button>
      </div>
    </div>
  )

  return (
    <div className="animate-fade-in">
      <ThreeColumnLayout
        header={header}
        left={leftPanel}
        middle={middlePanel}
        right={rightPanel}
        leftWidth="220px"
        rightWidth="260px"
      />
      <FileStagingConfirmModal
        open={showFileStaging}
        loading={stagingLoading}
        onConfirm={() => void handleConfirmFileStaging()}
        onCancel={() => {
          if (!stagingLoading) setShowFileStaging(false)
        }}
      />
    </div>
  )
}
