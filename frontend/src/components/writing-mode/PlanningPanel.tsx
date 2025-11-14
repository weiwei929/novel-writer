import React, { useState } from 'react'
import { Chapter } from '../../services/api'
import { FileText, Users, MapPin, Clock, Target } from 'lucide-react'

interface PlanningPanelProps {
  chapter?: Chapter | null
  onOutlineChange?: (outline: string) => void
  onCharactersChange?: (characters: string) => void
  className?: string
}

const PlanningPanel: React.FC<PlanningPanelProps> = ({
  chapter: _chapter, // 未来用于加载现有数据
  onOutlineChange,
  onCharactersChange,
  className = ''
}) => {
  const [outline, setOutline] = useState('')
  const [characters, setCharacters] = useState('')
  const [worldSetting, setWorldSetting] = useState('')
  const [plotPoints, setPlotPoints] = useState<string[]>([''])

  const handleOutlineChange = (value: string) => {
    setOutline(value)
    onOutlineChange?.(value)
  }

  const handleCharactersChange = (value: string) => {
    setCharacters(value)
    onCharactersChange?.(value)
  }

  const addPlotPoint = () => {
    setPlotPoints([...plotPoints, ''])
  }

  const updatePlotPoint = (index: number, value: string) => {
    const updated = [...plotPoints]
    updated[index] = value
    setPlotPoints(updated)
  }

  const removePlotPoint = (index: number) => {
    setPlotPoints(plotPoints.filter((_, i) => i !== index))
  }

  return (
    <div className={`bg-blue-50 border-l border-blue-200 shadow-lg ${className}`}>
      <div className="p-4 border-b border-blue-200 bg-blue-100">
        <div className="flex items-center space-x-2">
          <FileText size={18} className="text-blue-600" />
          <h3 className="font-medium text-blue-900">项目规划</h3>
        </div>
        <p className="text-xs text-blue-600 mt-1">构建故事架构与角色设定</p>
      </div>
      
      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {/* 章节大纲 */}
        <div className="bg-white rounded-lg p-3 border border-blue-200 shadow-sm">
          <div className="flex items-center space-x-2 mb-2">
            <FileText size={14} className="text-blue-600" />
            <h4 className="font-medium text-sm text-blue-900">章节大纲</h4>
          </div>
          <textarea 
            value={outline}
            onChange={(e) => handleOutlineChange(e.target.value)}
            className="w-full h-24 text-sm border border-blue-200 rounded p-2 resize-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
            placeholder="描述本章的主要情节和发展..."
          />
        </div>

        {/* 角色设定 */}
        <div className="bg-white rounded-lg p-3 border border-blue-200 shadow-sm">
          <div className="flex items-center space-x-2 mb-2">
            <Users size={14} className="text-blue-600" />
            <h4 className="font-medium text-sm text-blue-900">角色设定</h4>
          </div>
          <textarea 
            value={characters}
            onChange={(e) => handleCharactersChange(e.target.value)}
            className="w-full h-20 text-sm border border-blue-200 rounded p-2 resize-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
            placeholder="记录出场角色和关系..."
          />
        </div>

        {/* 场景设定 */}
        <div className="bg-white rounded-lg p-3 border border-blue-200 shadow-sm">
          <div className="flex items-center space-x-2 mb-2">
            <MapPin size={14} className="text-blue-600" />
            <h4 className="font-medium text-sm text-blue-900">场景设定</h4>
          </div>
          <textarea 
            value={worldSetting}
            onChange={(e) => setWorldSetting(e.target.value)}
            className="w-full h-20 text-sm border border-blue-200 rounded p-2 resize-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
            placeholder="描述故事发生的环境和背景..."
          />
        </div>

        {/* 情节要点 */}
        <div className="bg-white rounded-lg p-3 border border-blue-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Target size={14} className="text-blue-600" />
              <h4 className="font-medium text-sm text-blue-900">情节要点</h4>
            </div>
            <button 
              onClick={addPlotPoint}
              className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50"
            >
              + 添加
            </button>
          </div>
          <div className="space-y-2">
            {plotPoints.map((point, index) => (
              <div key={index} className="flex space-x-2">
                <input
                  type="text"
                  value={point}
                  onChange={(e) => updatePlotPoint(index, e.target.value)}
                  className="flex-1 text-sm border border-blue-200 rounded px-2 py-1 focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
                  placeholder={`情节要点 ${index + 1}`}
                />
                {plotPoints.length > 1 && (
                  <button 
                    onClick={() => removePlotPoint(index)}
                    className="text-xs text-red-500 hover:text-red-600 px-1"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 时间线 */}
        <div className="bg-white rounded-lg p-3 border border-blue-200 shadow-sm">
          <div className="flex items-center space-x-2 mb-2">
            <Clock size={14} className="text-blue-600" />
            <h4 className="font-medium text-sm text-blue-900">时间线</h4>
          </div>
          <div className="space-y-2">
            <div className="flex space-x-2 text-sm">
              <label className="text-blue-700 w-16">开始:</label>
              <input
                type="text"
                className="flex-1 border border-blue-200 rounded px-2 py-1 text-sm focus:border-blue-400"
                placeholder="章节开始时间点"
              />
            </div>
            <div className="flex space-x-2 text-sm">
              <label className="text-blue-700 w-16">结束:</label>
              <input
                type="text"
                className="flex-1 border border-blue-200 rounded px-2 py-1 text-sm focus:border-blue-400"
                placeholder="章节结束时间点"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlanningPanel
