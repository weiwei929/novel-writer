import React, { useEffect, useState } from 'react'
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
  getDashboardOverview,
  type DashboardOverview,
  type DashboardStageId,
} from '../services/dashboard'

const STAGE_META: {
  id: DashboardStageId
  label: string
  icon: IconComponent
  to: string
  countSuffix: string
  disabled?: boolean
  accent: string
}[] = [
  {
    id: 'creative',
    label: '创意组',
    icon: IconCreative,
    to: '/creative/chat',
    countSuffix: '部创意作品',
    accent: 'text-amber-600 bg-amber-50',
  },
  {
    id: 'planning',
    label: '企划课',
    icon: IconPlanning,
    to: '/planning/projects',
    countSuffix: '个立项',
    accent: 'text-blue-600 bg-blue-50',
  },
  {
    id: 'writing',
    label: '创作室',
    icon: IconWriting,
    to: '/writing/projects',
    countSuffix: '部创作中',
    accent: 'text-indigo-600 bg-indigo-50',
  },
  {
    id: 'review',
    label: '编审部',
    icon: IconReview,
    to: '/editorial',
    countSuffix: '待审',
    accent: 'text-amber-600 bg-amber-50',
  },
  {
    id: 'library',
    label: '文集库',
    icon: IconLibrary,
    to: '/library',
    countSuffix: '部作品',
    accent: 'text-emerald-600 bg-emerald-50',
  },
]

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  return new Date(iso).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const HomePage: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [selectedStage, setSelectedStage] = useState<DashboardStageId>('creative')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const data = await getDashboardOverview()
        if (!cancelled) {
          setOverview(data)
          const firstWithData = STAGE_META.find(s => {
            if (s.disabled) return false
            return data[s.id].count > 0
          })
          if (firstWithData) setSelectedStage(firstWithData.id)
        }
      } catch {
        if (!cancelled) setError('加载仪表盘数据失败')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-16 text-center text-gray-400 text-sm">
        加载中…
      </div>
    )
  }

  const stage = STAGE_META.find(s => s.id === selectedStage)!
  const slice = overview?.[selectedStage]

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">我的创作台</h1>
        <p className="text-sm text-gray-500 mt-1">五段管线一览</p>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {STAGE_META.map(s => {
          const Icon = s.icon
          const count = overview?.[s.id].count ?? 0
          const isSelected = selectedStage === s.id
          const inner = (
            <div
              className={`rounded-xl border p-4 shadow-sm transition-all h-full ${
                s.disabled
                  ? 'border-gray-200 bg-gray-50 opacity-70 cursor-not-allowed'
                  : isSelected
                    ? 'border-amber-400 bg-amber-50/50 ring-2 ring-amber-200'
                    : 'border-gray-200 bg-white hover:shadow-md cursor-pointer'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${s.accent}`}>
                <Icon size={20} />
              </div>
              <div className="text-sm font-semibold text-gray-900">{s.label}</div>
              <div className="mt-2 text-lg font-bold text-gray-900">
                {s.disabled ? '即将推出' : count}
              </div>
              {!s.disabled && (
                <div className="text-xs text-gray-500">{s.countSuffix}</div>
              )}
            </div>
          )
          if (s.disabled) {
            return <div key={s.id}>{inner}</div>
          }
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedStage(s.id)}
              className="text-left w-full"
            >
              {inner}
            </button>
          )
        })}
      </div>

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">{stage.label}</h2>
          <Link
            to={stage.to}
            className="text-sm text-amber-700 hover:underline inline-flex items-center gap-1"
          >
            查看更多
            <IconArrowRight size={14} />
          </Link>
        </div>
        {!slice || slice.items.length === 0 ? (
          <p className="px-5 py-10 text-sm text-gray-400 text-center">暂无内容</p>
        ) : (
          <ul className="divide-y">
            {slice.items.map(item => (
              <li key={item.id}>
                <Link
                  to={item.href}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <span className="font-medium text-gray-900">{item.title}</span>
                    {item.statusLabel && (
                      <span className="ml-2 text-xs text-gray-500">{item.statusLabel}</span>
                    )}
                  </div>
                  {item.updatedAt && (
                    <span className="text-xs text-gray-400 shrink-0">
                      {formatRelativeTime(item.updatedAt)}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {overview && overview.activity.length > 0 && (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="text-base font-semibold text-gray-900">最近动态</h2>
          </div>
          <ul className="divide-y">
            {overview.activity.map((a, i) => (
              <li key={i} className="px-5 py-3 text-sm">
                {a.href ? (
                  <Link to={a.href} className="text-gray-700 hover:text-blue-600">
                    <span className="text-gray-400 mr-2">{formatRelativeTime(a.time)}</span>
                    {a.text}
                  </Link>
                ) : (
                  <>
                    <span className="text-gray-400 mr-2">{formatRelativeTime(a.time)}</span>
                    {a.text}
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

export default HomePage
