import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

// 写作模式枚举
export enum WritingMode {
  PLANNING = 'planning',    // 规划模式：项目设置+章节构建
  WRITING = 'writing',      // 写作模式：专注内容创作  
  REVIEW = 'review'         // 审阅模式：预览+版本管理
}

// 写作模式状态接口
export interface WritingModeState {
  currentMode: WritingMode
  previousMode?: WritingMode
  modeHistory: WritingMode[]
  transitionTimestamp: number
}

// 上下文值接口
interface WritingModeContextValue {
  modeState: WritingModeState
  switchMode: (newMode: WritingMode) => void
  canSwitchToMode: (mode: WritingMode) => boolean
  getModeConfig: (mode: WritingMode) => ModeUIConfig
}

// UI配置接口
export interface ModeUIConfig {
  leftPanel: string
  rightPanel: string
  mainContent: string
  toolbar: string[]
  theme: {
    primary: string
    secondary: string
    accent: string
  }
}

// 模式UI配置
const ModeConfigs: Record<WritingMode, ModeUIConfig> = {
  [WritingMode.PLANNING]: {
    leftPanel: 'ProjectNavigationPanel',
    rightPanel: 'ChapterPlanningPanel',
    mainContent: 'ProjectOverview',
    toolbar: ['project-settings', 'chapter-planning', 'save'],
    theme: {
      primary: 'blue',
      secondary: 'blue-50',
      accent: 'blue-500'
    }
  },
  [WritingMode.WRITING]: {
    leftPanel: 'ChapterNavigationPanel',
    rightPanel: 'ChapterMetadataCard',
    mainContent: 'FocusedEditor',
    toolbar: ['save', 'preview-toggle', 'word-count'],
    theme: {
      primary: 'green',
      secondary: 'green-50',
      accent: 'green-500'
    }
  },
  [WritingMode.REVIEW]: {
    leftPanel: 'ProjectNavigationPanel',
    rightPanel: 'VersionManagementPanel',
    mainContent: 'PreviewContent',
    toolbar: ['version-save', 'export', 'sharing'],
    theme: {
      primary: 'purple',
      secondary: 'purple-50',
      accent: 'purple-500'
    }
  }
}

// 创建上下文
const WritingModeContext = createContext<WritingModeContextValue | undefined>(undefined)

// Provider组件属性
interface WritingModeProviderProps {
  children: ReactNode
  defaultMode?: WritingMode
}

// Provider组件
export const WritingModeProvider: React.FC<WritingModeProviderProps> = ({
  children,
  defaultMode = WritingMode.WRITING
}) => {
  const [modeState, setModeState] = useState<WritingModeState>({
    currentMode: defaultMode,
    modeHistory: [],
    transitionTimestamp: Date.now()
  })

  // 切换模式
  const switchMode = useCallback((newMode: WritingMode) => {
    if (newMode === modeState.currentMode) return

    setModeState(prev => ({
      currentMode: newMode,
      previousMode: prev.currentMode,
      modeHistory: [...prev.modeHistory, prev.currentMode].slice(-10), // 保留最近10次切换
      transitionTimestamp: Date.now()
    }))

    // 触发模式切换事件（可用于日志记录等）
    console.log(`Writing mode switched: ${modeState.currentMode} → ${newMode}`)
  }, [modeState.currentMode])

  // 检查是否可以切换到指定模式
  const canSwitchToMode = useCallback((mode: WritingMode): boolean => {
    // 这里可以添加业务逻辑，比如检查当前状态是否允许切换
    // 例如：编辑模式下有未保存内容时可能需要提醒
    
    // 暂时允许所有模式切换
    console.log(`Checking if can switch to mode: ${mode}`)
    return true
  }, [])

  // 获取模式配置
  const getModeConfig = useCallback((mode: WritingMode): ModeUIConfig => {
    return ModeConfigs[mode]
  }, [])

  const contextValue: WritingModeContextValue = {
    modeState,
    switchMode,
    canSwitchToMode,
    getModeConfig
  }

  return (
    <WritingModeContext.Provider value={contextValue}>
      {children}
    </WritingModeContext.Provider>
  )
}

// Hook：使用写作模式
export const useWritingMode = (): WritingModeContextValue => {
  const context = useContext(WritingModeContext)
  if (context === undefined) {
    throw new Error('useWritingMode must be used within a WritingModeProvider')
  }
  return context
}

// Hook：获取当前模式
export const useCurrentMode = (): WritingMode => {
  const { modeState } = useWritingMode()
  return modeState.currentMode
}

// Hook：模式切换器
export const useModeSwitcher = () => {
  const { switchMode, canSwitchToMode } = useWritingMode()
  
  return {
    switchToPlanning: () => switchMode(WritingMode.PLANNING),
    switchToWriting: () => switchMode(WritingMode.WRITING),
    switchToReview: () => switchMode(WritingMode.REVIEW),
    canSwitchTo: canSwitchToMode
  }
}

export default WritingModeContext