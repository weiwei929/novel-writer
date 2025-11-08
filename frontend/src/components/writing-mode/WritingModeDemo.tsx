import React from 'react'
import { WritingModeProvider, useWritingMode, WritingMode } from '../../contexts/WritingModeContext'
import ModeSwitcher from './ModeSwitcher'
import ModeIndicator from './ModeIndicator'

// 演示组件内容
const WritingModeDemoContent: React.FC = () => {
  const { modeState, switchMode, getModeConfig } = useWritingMode()
  const currentConfig = getModeConfig(modeState.currentMode)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">写作模式系统演示</h1>
        
        {/* 模式切换器和指示器 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">模式控制</h2>
          <div className="flex items-center gap-6 mb-4">
            <ModeIndicator />
            <ModeSwitcher variant="tabs" />
          </div>
          <div className="flex items-center gap-4">
            <ModeSwitcher variant="buttons" size="sm" />
            <ModeSwitcher variant="dropdown" size="sm" />
          </div>
        </div>

        {/* 当前模式信息 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">当前模式状态</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>当前模式：</strong> 
              <span className={`ml-2 px-2 py-1 rounded text-sm ${
                modeState.currentMode === WritingMode.PLANNING ? 'bg-blue-100 text-blue-700' :
                modeState.currentMode === WritingMode.WRITING ? 'bg-green-100 text-green-700' :
                'bg-purple-100 text-purple-700'
              }`}>
                {modeState.currentMode === WritingMode.PLANNING && '规划模式'}
                {modeState.currentMode === WritingMode.WRITING && '写作模式'}  
                {modeState.currentMode === WritingMode.REVIEW && '审阅模式'}
              </span>
            </div>
            <div>
              <strong>切换时间：</strong> 
              <span className="ml-2 text-gray-600">
                {new Date(modeState.transitionTimestamp).toLocaleTimeString()}
              </span>
            </div>
            <div>
              <strong>上次模式：</strong>
              <span className="ml-2 text-gray-600">
                {modeState.previousMode ? (
                  modeState.previousMode === WritingMode.PLANNING ? '规划模式' :
                  modeState.previousMode === WritingMode.WRITING ? '写作模式' : '审阅模式'
                ) : '无'}
              </span>
            </div>
            <div>
              <strong>历史记录：</strong>
              <span className="ml-2 text-gray-600">
                {modeState.modeHistory.length} 次切换
              </span>
            </div>
          </div>
        </div>

        {/* 模式配置预览 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">UI 配置预览</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">左侧面板</h3>
              <div className="bg-gray-100 p-4 rounded border-l-4 border-gray-400">
                {currentConfig.leftPanel}
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">主编辑区</h3>
              <div className="bg-gray-100 p-4 rounded border-l-4 border-blue-400">
                {currentConfig.mainContent}
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">右侧面板</h3>
              <div className="bg-gray-100 p-4 rounded border-l-4 border-green-400">
                {currentConfig.rightPanel}
              </div>
            </div>
          </div>
        </div>

        {/* 手动测试按钮 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">手动测试</h2>
          <div className="flex gap-3">
            <button 
              onClick={() => switchMode(WritingMode.PLANNING)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              切换到规划模式
            </button>
            <button 
              onClick={() => switchMode(WritingMode.WRITING)}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              切换到写作模式
            </button>
            <button 
              onClick={() => switchMode(WritingMode.REVIEW)}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
            >
              切换到审阅模式
            </button>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p><strong>键盘快捷键：</strong></p>
            <p>Ctrl+1: 规划模式 | Ctrl+2: 写作模式 | Ctrl+3: 审阅模式</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// 主演示组件：提供上下文
const WritingModeDemo: React.FC = () => {
  return (
    <WritingModeProvider>
      <WritingModeDemoContent />
    </WritingModeProvider>
  )
}

export default WritingModeDemo