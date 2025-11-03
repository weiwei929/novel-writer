import React, { useState, useEffect } from 'react'
import { statsApi } from '../services/api'
import { BarChart3, FileText, FolderOpen, TrendingUp, Calendar } from 'lucide-react'

interface Stats {
  collections: number
  projects: number
  chapters: number
  totalWords: number
  lastUpdated: string
}

const StatsPage: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const data = await statsApi.get()
      setStats(data)
    } catch (err) {
      setError('加载统计数据失败')
      console.error('Error loading stats:', err)
    } finally {
      setLoading(false)
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

  if (!stats) {
    return <div>没有数据</div>
  }

  const statCards = [
    {
      title: '文集总数',
      value: stats.collections,
      icon: FolderOpen,
      color: 'blue',
      description: '已创建的文集数量'
    },
    {
      title: '项目总数',
      value: stats.projects,
      icon: FileText,
      color: 'green',
      description: '正在进行的创作项目'
    },
    {
      title: '章节总数',
      value: stats.chapters,
      icon: BarChart3,
      color: 'purple',
      description: '已创作的章节数量'
    },
    {
      title: '总字数',
      value: stats.totalWords.toLocaleString(),
      icon: TrendingUp,
      color: 'orange',
      description: '累计创作字数'
    }
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        bg: 'bg-blue-100',
        text: 'text-blue-600',
        border: 'border-blue-200'
      },
      green: {
        bg: 'bg-green-100',
        text: 'text-green-600',
        border: 'border-green-200'
      },
      purple: {
        bg: 'bg-purple-100',
        text: 'text-purple-600',
        border: 'border-purple-200'
      },
      orange: {
        bg: 'bg-orange-100',
        text: 'text-orange-600',
        border: 'border-orange-200'
      }
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">统计信息</h1>
        <p className="text-gray-600">查看你的创作统计和进度</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon
          const colors = getColorClasses(card.color)
          
          return (
            <div
              key={card.title}
              className={`bg-white rounded-lg border ${colors.border} p-6 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${colors.text}`} />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-500">{card.description}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* 详细信息 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">详细统计</h2>
        
        <div className="space-y-6">
          {/* 创作进度 */}
          <div>
            <h3 className="text-lg font-medium mb-3">创作成就</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {stats.totalWords >= 10000 ? '✓' : Math.round((stats.totalWords / 10000) * 100)}
                </div>
                <div className="text-sm text-gray-600">
                  {stats.totalWords >= 10000 ? '已达成' : `${Math.round((stats.totalWords / 10000) * 100)}%`}
                </div>
                <div className="text-xs text-gray-500 mt-1">万字作家</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {stats.projects >= 5 ? '✓' : `${stats.projects}/5`}
                </div>
                <div className="text-sm text-gray-600">
                  {stats.projects >= 5 ? '已达成' : '进行中'}
                </div>
                <div className="text-xs text-gray-500 mt-1">多产作家</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {stats.chapters >= 50 ? '✓' : `${stats.chapters}/50`}
                </div>
                <div className="text-sm text-gray-600">
                  {stats.chapters >= 50 ? '已达成' : '进行中'}
                </div>
                <div className="text-xs text-gray-500 mt-1">章节大师</div>
              </div>
            </div>
          </div>

          {/* 平均数据 */}
          <div>
            <h3 className="text-lg font-medium mb-3">平均数据</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-lg font-semibold text-blue-900 mb-1">
                  {stats.projects > 0 ? Math.round(stats.totalWords / stats.projects).toLocaleString() : '0'}
                </div>
                <div className="text-sm text-blue-700">每项目平均字数</div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-lg font-semibold text-green-900 mb-1">
                  {stats.projects > 0 ? Math.round(stats.chapters / stats.projects * 10) / 10 : '0'}
                </div>
                <div className="text-sm text-green-700">每项目平均章节</div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-lg font-semibold text-purple-900 mb-1">
                  {stats.chapters > 0 ? Math.round(stats.totalWords / stats.chapters).toLocaleString() : '0'}
                </div>
                <div className="text-sm text-purple-700">每章平均字数</div>
              </div>
            </div>
          </div>

          {/* 更新时间 */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Calendar size={16} />
              <span>最后更新: {new Date(stats.lastUpdated).toLocaleString()}</span>
            </div>
            <button
              onClick={loadStats}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              刷新数据
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StatsPage