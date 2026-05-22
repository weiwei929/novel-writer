import React, { useState } from 'react'
import { Target, FileText, TrendingUp, Calendar, Award, BarChart3, Eye, Edit3 } from 'lucide-react'
import { Project, Chapter } from '../../services/api'

interface WritingAssistantProps {
  project: Project
  chapters: Chapter[]
  currentChapter?: Chapter | null
  currentContent?: string
  className?: string
}

interface WritingGoals {
  dailyWords: number
  weeklyWords: number
  totalWords: number
  dailyTime: number // 分钟
  targetDate?: string
}

interface WritingStats {
  todayWords: number
  weekWords: number
  monthWords: number
  averageWordsPerDay: number
  averageWordsPerChapter: number
  estimatedReadingTime: number
  completionProgress: number
}

const WritingAssistant: React.FC<WritingAssistantProps> = ({
  project,
  chapters,
  currentChapter,
  currentContent = '',
  className = '',
}) => {
  const [goals, setGoals] = useState<WritingGoals>({
    dailyWords: 1000,
    weeklyWords: 7000,
    totalWords: 80000,
    dailyTime: 60,
    targetDate: '',
  })

  const [isEditingGoals, setIsEditingGoals] = useState(false)

  // 计算写作统计
  const stats: WritingStats = React.useMemo(() => {
    const totalWords = chapters.reduce((sum, chapter) => sum + (chapter.wordCount || 0), 0)
    const currentContentWords = currentContent ? calculateWordCount(currentContent) : 0
    const totalWordsWithCurrent =
      totalWords + currentContentWords - (currentChapter?.wordCount || 0)

    // 模拟今日/本周/本月数据（实际项目中需要从后端获取）
    const todayWords = currentContentWords // 简化：当前章节的字数作为今日字数
    const weekWords = totalWords * 0.3 // 简化：总字数的30%作为本周字数
    const monthWords = totalWords * 0.8 // 简化：总字数的80%作为本月字数

    const averageWordsPerDay = weekWords / 7
    const averageWordsPerChapter = chapters.length > 0 ? totalWords / chapters.length : 0
    const estimatedReadingTime = Math.ceil(totalWordsWithCurrent / 250) // 每分钟250字
    const completionProgress =
      goals.totalWords > 0 ? (totalWordsWithCurrent / goals.totalWords) * 100 : 0

    return {
      todayWords,
      weekWords,
      monthWords,
      averageWordsPerDay,
      averageWordsPerChapter,
      estimatedReadingTime,
      completionProgress,
    }
  }, [chapters, currentContent, currentChapter, goals.totalWords])

  const calculateWordCount = (text: string): number => {
    return text
      .replace(/[^\u4e00-\u9fa5\w]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0).length
  }

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}小时${mins}分钟`
    }
    return `${mins}分钟`
  }

  const getProgressColor = (progress: number): string => {
    if (progress < 30) return 'bg-red-500'
    if (progress < 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getDailyGoalProgress = (): number => {
    return goals.dailyWords > 0 ? (stats.todayWords / goals.dailyWords) * 100 : 0
  }

  const getWeeklyGoalProgress = (): number => {
    return goals.weeklyWords > 0 ? (stats.weekWords / goals.weeklyWords) * 100 : 0
  }

  const estimateDaysToComplete = (): number => {
    const remainingWords = goals.totalWords - (project.wordCount || 0)
    if (remainingWords <= 0 || stats.averageWordsPerDay <= 0) return 0
    return Math.ceil(remainingWords / stats.averageWordsPerDay)
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* 写作统计概览 */}
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 size={20} />
          写作统计
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <FileText size={16} />
              <span className="text-sm font-medium">今日字数</span>
            </div>
            <div className="text-2xl font-bold text-blue-700">
              {stats.todayWords.toLocaleString()}
            </div>
            <div className="text-xs text-blue-600 mt-1">
              目标：{goals.dailyWords.toLocaleString()}
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <TrendingUp size={16} />
              <span className="text-sm font-medium">本周字数</span>
            </div>
            <div className="text-2xl font-bold text-green-700">
              {stats.weekWords.toLocaleString()}
            </div>
            <div className="text-xs text-green-600 mt-1">
              目标：{goals.weeklyWords.toLocaleString()}
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-purple-600 mb-1">
              <Eye size={16} />
              <span className="text-sm font-medium">阅读时长</span>
            </div>
            <div className="text-2xl font-bold text-purple-700">
              {formatTime(stats.estimatedReadingTime)}
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-orange-600 mb-1">
              <Award size={16} />
              <span className="text-sm font-medium">平均日产</span>
            </div>
            <div className="text-2xl font-bold text-orange-700">
              {Math.round(stats.averageWordsPerDay).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* 目标进度 */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Target size={20} />
            目标进度
          </h3>
          <button
            onClick={() => setIsEditingGoals(!isEditingGoals)}
            className="text-gray-500 hover:text-gray-700"
          >
            <Edit3 size={16} />
          </button>
        </div>

        {isEditingGoals ? (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">每日目标字数</label>
              <input
                type="number"
                value={goals.dailyWords}
                onChange={e => setGoals({ ...goals, dailyWords: Number(e.target.value) })}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                min="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">每周目标字数</label>
              <input
                type="number"
                value={goals.weeklyWords}
                onChange={e => setGoals({ ...goals, weeklyWords: Number(e.target.value) })}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                min="500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">总目标字数</label>
              <input
                type="number"
                value={goals.totalWords}
                onChange={e => setGoals({ ...goals, totalWords: Number(e.target.value) })}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                min="10000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">目标完成日期</label>
              <input
                type="date"
                value={goals.targetDate || ''}
                onChange={e => setGoals({ ...goals, targetDate: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 每日进度 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">今日进度</span>
                <span className="text-sm text-gray-500">
                  {stats.todayWords} / {goals.dailyWords} 字
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(getDailyGoalProgress())}`}
                  style={{ width: `${Math.min(getDailyGoalProgress(), 100)}%` }}
                ></div>
              </div>
              <div className="text-right text-xs text-gray-500 mt-1">
                {getDailyGoalProgress().toFixed(1)}% 完成
              </div>
            </div>

            {/* 每周进度 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">本周进度</span>
                <span className="text-sm text-gray-500">
                  {stats.weekWords} / {goals.weeklyWords} 字
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(getWeeklyGoalProgress())}`}
                  style={{ width: `${Math.min(getWeeklyGoalProgress(), 100)}%` }}
                ></div>
              </div>
              <div className="text-right text-xs text-gray-500 mt-1">
                {getWeeklyGoalProgress().toFixed(1)}% 完成
              </div>
            </div>

            {/* 总进度 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">总进度</span>
                <span className="text-sm text-gray-500">
                  {project.wordCount?.toLocaleString()} / {goals.totalWords.toLocaleString()} 字
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(stats.completionProgress)}`}
                  style={{ width: `${Math.min(stats.completionProgress, 100)}%` }}
                ></div>
              </div>
              <div className="text-right text-xs text-gray-500 mt-1">
                {stats.completionProgress.toFixed(1)}% 完成
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 预测信息 */}
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar size={20} />
          预测信息
        </h3>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-gray-600 mb-1">预计完成时间</div>
            <div className="font-semibold">
              {estimateDaysToComplete() > 0 ? `${estimateDaysToComplete()} 天` : '已完成'}
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded">
            <div className="text-gray-600 mb-1">平均章节字数</div>
            <div className="font-semibold">
              {Math.round(stats.averageWordsPerChapter).toLocaleString()} 字
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded">
            <div className="text-gray-600 mb-1">本月产量</div>
            <div className="font-semibold">{stats.monthWords.toLocaleString()} 字</div>
          </div>

          <div className="bg-gray-50 p-3 rounded">
            <div className="text-gray-600 mb-1">预计总页数</div>
            <div className="font-semibold">{Math.ceil(goals.totalWords / 400)} 页</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WritingAssistant
