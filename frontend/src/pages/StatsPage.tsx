import React, { useEffect, useMemo, useState } from 'react'
import {
  collectionsApi,
  projectsApi,
  PROJECT_STATUS_LABEL,
} from '../services/api'
import { IconCalendar, IconFile, IconFolder, IconStats } from '../components/ui/icons'

interface StatsData {
  totalProjects: number
  totalChapters: number
  totalWords: number
  collectionsCount: number
  statusDist: { label: string; count: number; status: string }[]
  todayProjects: number
  weekProjects: number
  lastEditedLabel: string | null
}

function formatWordCount(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}w`
  return n.toLocaleString()
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  return `${days} 天前`
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
}

const STATUS_BAR_COLORS: Record<string, string> = {
  draft: 'bg-gray-500',
  planning: 'bg-blue-500',
  writing: 'bg-indigo-500',
  reviewing: 'bg-amber-500',
  completed: 'bg-green-500',
  archived: 'bg-gray-400',
  shelved: 'bg-red-400',
}

const StatsPage: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<StatsData | null>(null)

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true)
      setError(null)
      try {
        const [projects, collections] = await Promise.all([
          projectsApi.getAll(),
          collectionsApi.getAll(),
        ])

        const totalProjects = projects.length
        const totalChapters = projects.reduce((sum, p) => sum + (p.chapterCount || 0), 0)
        const totalWords = projects.reduce((sum, p) => sum + (p.wordCount || 0), 0)
        const collectionsCount = collections.length

        const distMap: Record<string, number> = {}
        for (const p of projects) {
          if (p.status === 'shelved') continue
          const label = PROJECT_STATUS_LABEL[p.status] || p.status
          distMap[label] = (distMap[label] || 0) + 1
        }

        const statusDist = Object.entries(distMap)
          .map(([label, count]) => {
            const status =
              Object.entries(PROJECT_STATUS_LABEL).find(([, l]) => l === label)?.[0] || label
            return { label, count, status }
          })
          .sort((a, b) => b.count - a.count)

        const now = Date.now()
        const todayProjects = projects.filter(
          p => now - new Date(p.updatedAt).getTime() < 86400000
        ).length
        const weekProjects = projects.filter(
          p => now - new Date(p.updatedAt).getTime() < 604800000
        ).length

        const newest = [...projects].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )[0]

        setStats({
          totalProjects,
          totalChapters,
          totalWords,
          collectionsCount,
          statusDist,
          todayProjects,
          weekProjects,
          lastEditedLabel: newest ? formatRelativeTime(newest.updatedAt) : null,
        })
      } catch (e) {
        console.error(e)
        setError('加载统计数据失败')
      } finally {
        setLoading(false)
      }
    }
    void loadStats()
  }, [])

  const maxStatusCount = useMemo(
    () => Math.max(1, ...(stats?.statusDist.map(s => s.count) || [1])),
    [stats]
  )

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-9 w-40" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-48" />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="max-w-4xl mx-auto rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
        {error || '暂无数据'}
      </div>
    )
  }

  const cards = [
    { title: '作品数', value: stats.totalProjects, icon: IconFile, accent: 'text-green-600 bg-green-50' },
    { title: '章节数', value: stats.totalChapters, icon: IconStats, accent: 'text-purple-600 bg-purple-50' },
    { title: '总字数', value: formatWordCount(stats.totalWords), icon: IconStats, accent: 'text-orange-600 bg-orange-50' },
    { title: '文集数', value: stats.collectionsCount, icon: IconFolder, accent: 'text-blue-600 bg-blue-50' },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">数据统计</h1>
        <p className="text-sm text-gray-500 mt-1">创作管道概览</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(card => {
          const Icon = card.icon
          return (
            <div
              key={card.title}
              className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${card.accent}`}>
                <Icon size={20} />
              </div>
              <div className="text-xs text-gray-500">{card.title}</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">{card.value}</div>
            </div>
          )
        })}
      </div>

      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">作品状态分布</h2>
        </div>
        <div className="p-5 space-y-4">
          {stats.statusDist.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">暂无作品数据</p>
          ) : (
            stats.statusDist.map(row => {
              const pct = Math.round((row.count / stats.totalProjects) * 100) || 0
              const barColor = STATUS_BAR_COLORS[row.status] || 'bg-gray-400'
              return (
                <div key={row.label}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700">{row.label}</span>
                    <span className="text-gray-500 tabular-nums">
                      {row.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColor}`}
                      style={{ width: `${(row.count / maxStatusCount) * 100}%` }}
                    />
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>

      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <IconCalendar size={18} className="text-gray-500" />
          近期活跃
        </h2>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>今日编辑 {stats.todayProjects} 个作品</li>
          <li>本周活跃 {stats.weekProjects} 个作品</li>
          <li>
            最近编辑：
            {stats.lastEditedLabel ?? '暂无记录'}
          </li>
        </ul>
      </section>
    </div>
  )
}

export default StatsPage
