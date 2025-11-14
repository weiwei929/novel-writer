import React, { useState, useEffect } from 'react'
import { useWritingMode, WritingMode } from '../../contexts/WritingModeContext'
import { FileText, Layers, Check } from 'lucide-react'

interface ModeSwitcherProps {
  className?: string
  variant?: 'tabs' | 'buttons' | 'dropdown'
  size?: 'sm' | 'md' | 'lg'
}

// 模式配置（不包含审阅）
const modeConfig: Partial<Record<WritingMode, {
  icon: any
  label: string
  fullLabel: string
  description: string
  color: string
  shortcut: string
}>> = {
  [WritingMode.PLANNING]: {
    icon: Layers,
    label: '规划',
    fullLabel: '规划模式',
    description: '项目设置与章节构建',
    color: 'blue',
    shortcut: '1'
  },
  [WritingMode.WRITING]: {
    icon: FileText,
    label: '写作',
    fullLabel: '写作模式',
    description: '专注内容创作',
    color: 'green',
    shortcut: '2'
  },
  // 审阅模式暂不在切换器中呈现，后续用于版本管理
}

const ModeSwitcher: React.FC<ModeSwitcherProps> = ({
  className = '',
  variant = 'tabs',
  size = 'md'
}) => {
  const { modeState, switchMode, canSwitchToMode } = useWritingMode()
  const { currentMode } = modeState
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && !event.shiftKey && !event.altKey) {
        switch (event.key) {
          case '1':
            event.preventDefault()
            canSwitchToMode(WritingMode.PLANNING) && switchMode(WritingMode.PLANNING)
            break
          case '2':
            event.preventDefault()
            canSwitchToMode(WritingMode.WRITING) && switchMode(WritingMode.WRITING)
            break
          // 移除审阅模式快捷键
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [switchMode, canSwitchToMode])

  // 样式配置
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-3'
  }

  // 标签式切换器
  const renderTabs = () => (
    <div className={`flex bg-gray-100 rounded-lg p-1 ${className}`}>
      {Object.entries(modeConfig).map(([mode, config]) => {
        const IconComponent = config.icon
        const isActive = mode === currentMode
        const canSwitch = canSwitchToMode(mode as WritingMode)
        
        return (
          <button
            key={mode}
            onClick={() => canSwitch && switchMode(mode as WritingMode)}
            disabled={!canSwitch}
            className={`
              flex items-center space-x-2 ${sizeClasses[size]} rounded-md font-medium
              transition-all duration-200 flex-1 justify-center
              ${isActive 
                ? `bg-${config.color}-500 text-white shadow-sm` 
                : `text-gray-600 hover:text-${config.color}-600 hover:bg-white`
              }
              ${!canSwitch ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            title={`${config.fullLabel} (Ctrl+${config.shortcut})`}
          >
            <IconComponent size={size === 'sm' ? 14 : size === 'md' ? 16 : 18} />
            <span className={size === 'sm' ? 'hidden sm:inline' : ''}>{config.label}</span>
          </button>
        )
      })}
    </div>
  )

  // 按钮式切换器
  const renderButtons = () => (
    <div className={`flex space-x-2 ${className}`}>
      {Object.entries(modeConfig).map(([mode, config]) => {
        const IconComponent = config.icon
        const isActive = mode === currentMode
        const canSwitch = canSwitchToMode(mode as WritingMode)
        
        return (
          <button
            key={mode}
            onClick={() => canSwitch && switchMode(mode as WritingMode)}
            disabled={!canSwitch}
            className={`
              flex items-center space-x-2 ${sizeClasses[size]} rounded-lg border
              transition-all duration-300 ease-in-out font-medium transform
              ${isActive 
                ? `bg-${config.color}-50 border-${config.color}-200 text-${config.color}-700 scale-105 shadow-md` 
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:scale-102'
              }
              ${!canSwitch ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'}
            `}
            title={`${config.fullLabel} (Ctrl+${config.shortcut})`}
          >
            <IconComponent size={size === 'sm' ? 14 : size === 'md' ? 16 : 18} />
            <span>{config.label}</span>
            {isActive && <Check size={14} />}
          </button>
        )
      })}
    </div>
  )

  // 下拉式切换器
  const renderDropdown = () => {
    const currentConfig = modeConfig[currentMode] || modeConfig[WritingMode.WRITING]
    if (!currentConfig) return renderTabs()
    const CurrentIcon = currentConfig.icon

    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`
            flex items-center space-x-2 ${sizeClasses[size]} 
            bg-white border border-gray-200 rounded-lg
            hover:bg-gray-50 transition-colors font-medium
          `}
        >
          <CurrentIcon size={size === 'sm' ? 14 : size === 'md' ? 16 : 18} />
          <span>{currentConfig.fullLabel}</span>
          <div className="w-4 h-4 flex items-center justify-center">
            <div className={`w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-600 transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {isDropdownOpen && (
          <>
            {/* 背景遮罩 */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsDropdownOpen(false)}
            />
            
            {/* 下拉菜单 */}
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
              {Object.entries(modeConfig).map(([mode, config], index) => {
                const IconComponent = config.icon
                const isActive = mode === currentMode
                const canSwitch = canSwitchToMode(mode as WritingMode)
                
                return (
                  <button
                    key={mode}
                    onClick={() => {
                      if (canSwitch && !isActive) {
                        switchMode(mode as WritingMode)
                        setIsDropdownOpen(false)
                      }
                    }}
                    disabled={!canSwitch}
                    className={`
                      w-full flex items-center space-x-3 px-4 py-3 text-left
                      transition-colors
                      ${isActive ? 'bg-gray-50 cursor-default' : 'hover:bg-gray-50 cursor-pointer'}
                      ${!canSwitch ? 'opacity-50 cursor-not-allowed' : ''}
                      ${index === 0 ? 'rounded-t-lg' : ''}
                      ${index === Object.keys(modeConfig).length - 1 ? 'rounded-b-lg' : 'border-b border-gray-100'}
                    `}
                  >
                    <IconComponent size={18} className={`text-${config.color}-600`} />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {config.fullLabel}
                      </div>
                      <div className="text-xs text-gray-500">
                        {config.description}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">
                        Ctrl+{config.shortcut}
                      </kbd>
                      {isActive && (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
    )
  }

  // 根据variant渲染对应组件
  switch (variant) {
    case 'tabs':
      return renderTabs()
    case 'buttons':
      return renderButtons()
    case 'dropdown':
      return renderDropdown()
    default:
      return renderTabs()
  }
}

export default ModeSwitcher
