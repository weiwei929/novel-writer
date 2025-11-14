import React from 'react'
import { useWritingMode, WritingMode } from '../../contexts/WritingModeContext'
import { FileText, Layers, ChevronDown } from 'lucide-react'

interface ModeIndicatorProps {
  className?: string
  showDropdown?: boolean
}

// 模式配置映射
const modeDisplayConfig: Partial<Record<WritingMode, {
  icon: any
  label: string
  description: string
  color: string
  bgColor: string
  borderColor: string
}>> = {
  [WritingMode.PLANNING]: {
    icon: Layers,
    label: '规划模式',
    description: '项目设置 & 章节构建',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  [WritingMode.WRITING]: {
    icon: FileText,
    label: '写作模式',
    description: '专注内容创作',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  // 审阅模式暂不在指示器中呈现，后续用于版本管理
}

const ModeIndicator: React.FC<ModeIndicatorProps> = ({ 
  className = '',
  showDropdown = true 
}) => {
  const { modeState, switchMode } = useWritingMode()
  const { currentMode } = modeState
  const config = modeDisplayConfig[currentMode] || modeDisplayConfig[WritingMode.WRITING]
  if (!config) return null
  const IconComponent = config.icon

  return (
    <div className={`relative ${className}`}>
      {/* 当前模式指示器 */}
      <div className={`
        flex items-center space-x-2 px-3 py-2 rounded-lg border
        ${config.bgColor} ${config.borderColor}
        transition-colors duration-200
      `}>
        <IconComponent size={18} className={config.color} />
        <div className="flex flex-col">
          <span className={`text-sm font-medium ${config.color}`}>
            {config.label}
          </span>
          <span className="text-xs text-gray-500">
            {config.description}
          </span>
        </div>
        {showDropdown && (
          <ChevronDown size={14} className="text-gray-400" />
        )}
      </div>

      {/* 模式切换下拉菜单 - 后续可以添加 */}
      {showDropdown && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 hidden group-hover:block">
          {Object.entries(modeDisplayConfig).map(([mode, modeConfig]) => {
            const ModeIcon = modeConfig.icon
            const isActive = mode === currentMode
            
            return (
              <button
                key={mode}
                onClick={() => switchMode(mode as WritingMode)}
                disabled={isActive}
                className={`
                  w-full flex items-center space-x-3 px-4 py-3 text-left
                  hover:bg-gray-50 transition-colors
                  ${isActive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  ${mode === WritingMode.PLANNING ? 'rounded-t-lg' : 'rounded-b-lg'}
                `}
              >
                <ModeIcon size={16} className={modeConfig.color} />
                <div className="flex-1">
                  <div className={`text-sm font-medium ${isActive ? 'text-gray-500' : 'text-gray-900'}`}>
                    {modeConfig.label}
                  </div>
                  <div className="text-xs text-gray-500">
                    {modeConfig.description}
                  </div>
                </div>
                {isActive && (
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ModeIndicator
