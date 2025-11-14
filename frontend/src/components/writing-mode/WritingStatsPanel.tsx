import React, { useState, useEffect } from 'react'
import { BarChart3, Target, TrendingUp, Award, Zap } from 'lucide-react'

interface WritingStatsProps {
  content: string
  wordTarget?: number
  timeTarget?: number // 分钟
  className?: string
}

const WritingStatsPanel: React.FC<WritingStatsProps> = ({
  content,
  wordTarget = 1000,
  timeTarget = 60,
  className = ''
}) => {
  const [writingTime, setWritingTime] = useState(0) // 秒
  const [isWriting, setIsWriting] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)

  // 计算统计数据
  const currentWords = content.length
  const wordsProgress = Math.min((currentWords / wordTarget) * 100, 100)
  const timeProgress = Math.min((writingTime / (timeTarget * 60)) * 100, 100)
  const estimatedReadingTime = Math.ceil(currentWords / 300) // 300字/分钟
  const writingSpeed = writingTime > 0 ? Math.round((currentWords / writingTime) * 60) : 0 // 字/分钟

  // 写作计时器
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (isWriting) {
      interval = setInterval(() => {
        setWritingTime(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isWriting])

  // 检测写作状态
  useEffect(() => {
    if (content && !startTime) {
      setStartTime(new Date())
      setIsWriting(true)
    }
  }, [content, startTime])

  const toggleWriting = () => {
    setIsWriting(!isWriting)
  }

  const resetStats = () => {
    setWritingTime(0)
    setIsWriting(false)
    setStartTime(null)
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={`bg-green-50 border-l border-green-200 shadow-lg ${className}`}>
      <div className="p-4 border-b border-green-200 bg-green-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 size={18} className="text-green-600" />
            <h3 className="font-medium text-green-900">写作专注</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleWriting}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                isWriting 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                  : 'bg-green-200 text-green-700 hover:bg-green-300'
              }`}
            >
              {isWriting ? '暂停' : '开始'}
            </button>
            <button
              onClick={resetStats}
              className="px-2 py-1 rounded text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              重置
            </button>
          </div>
        </div>
        <p className="text-xs text-green-600 mt-1">统计、目标、进度追踪</p>
      </div>
      
      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {/* 今日写作目标 */}
        <div className="bg-white rounded-lg p-3 border border-green-200 shadow-sm">
          <div className="flex items-center space-x-2 mb-3">
            <Target size={14} className="text-green-600" />
            <h4 className="font-medium text-sm text-green-900">今日目标</h4>
          </div>
          
          <div className="space-y-3">
            {/* 字数目标 */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-green-700">字数目标</span>
                <span className="text-green-600">{currentWords}/{wordTarget} 字</span>
              </div>
              <div className="w-full bg-green-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${wordsProgress}%` }}
                ></div>
              </div>
              <div className="text-xs text-green-600 mt-1">
                已完成 {wordsProgress.toFixed(0)}%
              </div>
            </div>

            {/* 时间目标 */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-green-700">时间目标</span>
                <span className="text-green-600">{formatTime(writingTime)}/{timeTarget}分钟</span>
              </div>
              <div className="w-full bg-green-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${timeProgress}%` }}
                ></div>
              </div>
              <div className="text-xs text-green-600 mt-1">
                已完成 {timeProgress.toFixed(0)}%
              </div>
            </div>
          </div>
        </div>

        {/* 实时统计 */}
        <div className="bg-white rounded-lg p-3 border border-green-200 shadow-sm">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp size={14} className="text-green-600" />
            <h4 className="font-medium text-sm text-green-900">实时统计</h4>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">{currentWords}</div>
              <div className="text-xs text-green-700">当前字数</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">{estimatedReadingTime}</div>
              <div className="text-xs text-green-700">预计阅读(分)</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">{writingSpeed}</div>
              <div className="text-xs text-green-700">写作速度(字/分)</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">{Math.floor(writingTime / 60)}</div>
              <div className="text-xs text-green-700">专注时间(分)</div>
            </div>
          </div>
        </div>

        {/* 写作状态 */}
        <div className="bg-white rounded-lg p-3 border border-green-200 shadow-sm">
          <div className="flex items-center space-x-2 mb-2">
            <Zap size={14} className={isWriting ? "text-green-500" : "text-gray-400"} />
            <h4 className="font-medium text-sm text-green-900">写作状态</h4>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${isWriting ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
            <span className="text-sm text-green-700">
              {isWriting ? '正在写作' : '已暂停'}
            </span>
            {startTime && (
              <span className="text-xs text-green-600">
                开始于 {startTime.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* 成就徽章 */}
        <div className="bg-white rounded-lg p-3 border border-green-200 shadow-sm">
          <div className="flex items-center space-x-2 mb-2">
            <Award size={14} className="text-green-600" />
            <h4 className="font-medium text-sm text-green-900">今日成就</h4>
          </div>
          <div className="flex flex-wrap gap-1">
            {wordsProgress >= 100 && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                🎯 目标达成
              </span>
            )}
            {writingSpeed > 50 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                ⚡ 快速写作
              </span>
            )}
            {writingTime > 1800 && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                🔥 专注达人
              </span>
            )}
            {currentWords > 500 && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                📝 高产作家
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default WritingStatsPanel
