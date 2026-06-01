import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  IconCreative,
  IconPlanning,
  IconWriting,
  IconReview,
  IconLibrary,
  IconArrowRight,
  type IconComponent,
} from '../components/ui/icons'
import {
  chaptersApi,
  projectsApi,
  type Chapter,
  type Project,
  type ProjectStatus,
} from '../services/api'
import ProjectStatusBadge from '../components/projects/ProjectStatusBadge'

type StageId = 'ideation' | 'planning' | 'writing' | 'review' | 'library'

interface StageConfig {
  id: StageId
  label: string
  icon: IconComponent
  to: string
  statuses: ProjectStatus[]
  accent: string
}

const STAGES: StageConfig[] = [
  {
    id: 'ideation',
    label: '创意组',
    icon: IconCreative,
    to: '/creative/references',
    statuses: ['draft'],
    accent: 'text-amber-600 bg-amber-50',
  },
  {
    id: 'planning',
    label: '企划课',
    icon: IconPlanning,
    to: '/planning/proposals',
    statuses: ['planning'],
    accent: 'text-blue-600 bg-blue-50',
  },
  {
    id: 'writing',
    label: '创作室',
    icon: IconWriting,
    to: '/writing/projects',
    statuses: ['writing'],
    accent: 'text-indigo-600 bg-indigo-50',
  },
  {
    id: 'review',
    label: '编审部',
    icon: IconReview,
    to: '/review',
    statuses: ['reviewing'],
    accent: 'text-violet-600 bg-violet-50',
  },
  {
    id: 'library',
    label: '文集库',
    icon: IconLibrary,
    to: '/library',
    statuses: ['completed', 'archived'],
    accent: 'text-emerald-600 bg-emerald-50',
  },
]

interface ContinueTarget {
  project: Project
  chapter: Chapter
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} 天前`
  return new Date(iso).toLocaleDateString('zh-CN')
}

function countByStage(projects: Project[]): Record<StageId, number> {
  const counts: Record<StageId, number> = {
    ideation: 0,
    planning: 0,
    writing: 0,
    review: 0,
    library: 0,
  }
  for (const p of projects) {
    if (p.status === 'shelved') continue
    const stage = STAGES.find(s => s.statuses.includes(p.status))
    if (stage) counts[stage.id] += 1
  }
  return counts
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
}

const HomePage: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [continueTarget, setContinueTarget] = useState<ContinueTarget | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const all = await projectsApi.getAll()
        if (cancelled) return
        setProjects(all)

        const sorted = [...all].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )

        const writingProjects = sorted.filter(p => p.status === 'writing')
        for (const p of writingProjects.slice(0, 5)) {
          const chapters = await chaptersApi.getByProjectId(p.id)
          if (cancelled) return
          if (chapters.length === 0) continue
          const sortedCh = [...chapters].sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
          const withContent = sortedCh.find(c => c.content?.trim())
          if (withContent) {
            setContinueTarget({ project: p, chapter: withContent })
            break
          }
        }
      } catch (e) {
        if (!cancelled) {
          console.error(e)
          setError('加载作品数据失败')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const stageCounts = useMemo(() => countByStage(projects), [projects])

  const recentProjects = useMemo(
    () =>
      [...projects]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5),
    [projects]
  )

  const greetingName = useMemo(() => {
    const fromContinue = continueTarget?.project.author
    const fromRecent = recentProjects[0]?.author
    return fromContinue || fromRecent || '创作者'
  }, [continueTarget, recentProjects])

  const lastEditedLabel = useMemo(() => {
    if (continueTarget) return formatRelativeTime(continueTarget.chapter.updatedAt)
    if (recentProjects[0]) return formatRelativeTime(recentProjects[0].updatedAt)
    return null
  }, [continueTarget, recentProjects])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-36 w-full" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {STAGES.map(s => (
            <Skeleton key={s.id} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-52 w-full" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">欢迎回来，{greetingName}</h1>
          <p className="text-sm text-gray-500 mt-1">小说创作管道一览</p>
        </div>
        {lastEditedLabel && (
          <span className="text-sm text-gray-400">上次编辑 · {lastEditedLabel}</span>
        )}
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* 继续创作 */}
      {continueTarget ? (
        <Link
          to={`/writing/${continueTarget.project.id}/${continueTarget.chapter.id}`}
          className="block rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide mb-1">
                继续创作
              </p>
              <h2 className="text-xl font-semibold text-gray-900 truncate">
                {continueTarget.chapter.title}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {continueTarget.project.title} · 第 {continueTarget.chapter.order} 章
              </p>
              <p className="text-xs text-gray-400 mt-2">
                {formatRelativeTime(continueTarget.chapter.updatedAt)}
              </p>
            </div>
            <span className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg">
              进入创作室
              <IconArrowRight size={16} />
            </span>
          </div>
        </Link>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <p className="text-gray-600 mb-4">还没有创作中的作品</p>
          <Link
            to="/creative/references"
            className="inline-flex items-center gap-1.5 text-indigo-600 font-medium hover:text-indigo-800"
          >
            开始新作品
            <IconArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* 五阶段卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {STAGES.map(stage => {
          const Icon = stage.icon
          const count = stageCounts[stage.id]
          return (
            <Link
              key={stage.id}
              to={stage.to}
              className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-gray-300"
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${stage.accent}`}
              >
                <Icon size={20} />
              </div>
              <div className="text-sm font-semibold text-gray-900">{stage.label}</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900">{count}</span>
                <span className="text-xs text-gray-500">个作品</span>
              </div>
            </Link>
          )
        })}
      </div>

      {/* 最近作品 */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">最近作品</h2>
        </div>
        {recentProjects.length === 0 ? (
          <p className="px-5 py-8 text-sm text-gray-500 text-center">暂无作品</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recentProjects.map(p => (
              <li key={p.id}>
                <Link
                  to={`/work/${p.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0 flex items-center gap-3">
                    <span className="font-medium text-gray-900 truncate">{p.title}</span>
                    <ProjectStatusBadge status={p.status} />
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">
                    {formatRelativeTime(p.updatedAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default HomePage
