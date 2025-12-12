import React, { useState, useEffect } from 'react'
import { settingsManager, AppSettings } from '../utils/settings'
import { Settings, Bot, Save, RotateCcw, AlertTriangle } from 'lucide-react'

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(settingsManager.getAll())
  const [tempApiKey, setTempApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const handleSettingsUpdate = () => {
      setSettings(settingsManager.getAll())
    }

    window.addEventListener('settings-updated', handleSettingsUpdate)
    return () => window.removeEventListener('settings-updated', handleSettingsUpdate)
  }, [])

  const handleSave = () => {
    // 保存 API Key
    if (tempApiKey.trim()) {
      settingsManager.set('grokApiKey', tempApiKey.trim())
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    if (confirm('确定要重置所有设置到默认值吗？')) {
      settingsManager.reset()
      setTempApiKey('')
    }
  }

  const handleAIToggle = (enabled: boolean) => {
    if (enabled) {
      // 启用 AI 时检查 API Key
      if (!settings.grokApiKey && !tempApiKey.trim()) {
        alert('请先配置 Grok API Key 才能启用 AI 功能')
        return
      }
      settingsManager.enableAI(tempApiKey.trim() || undefined)
    } else {
      settingsManager.disableAI()
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm">
        {/* 标题 */}
        <div className="border-b p-6">
          <div className="flex items-center space-x-3">
            <Settings size={24} className="text-gray-600" />
            <div>
              <h1 className="text-2xl font-bold">应用设置</h1>
              <p className="text-gray-600 mt-1">配置应用的行为和功能</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* AI 功能设置 */}
          <section>
            <div className="flex items-center space-x-3 mb-4">
              <Bot size={20} className="text-blue-600" />
              <h2 className="text-lg font-semibold">AI 写作助手</h2>
            </div>

            {/* AI 开关 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="font-medium">启用 AI 助手</label>
                  <p className="text-sm text-gray-600">
                    开启后可使用 AI 进行续写、改进建议和角色生成
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.aiEnabled}
                    onChange={e => handleAIToggle(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* API Key 配置 */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Grok API Key</label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={tempApiKey || settings.grokApiKey || ''}
                      onChange={e => setTempApiKey(e.target.value)}
                      placeholder="输入你的 Grok API Key"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {showApiKey ? '隐藏' : '显示'}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  获取 API Key:{' '}
                  <a
                    href="https://console.x.ai/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    https://console.x.ai/
                  </a>
                </p>
              </div>

              {/* AI 状态指示 */}
              <div className="p-3 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full ${settings.aiEnabled ? 'bg-green-500' : 'bg-gray-400'}`}
                  ></div>
                  <span className="text-sm font-medium">
                    AI 状态: {settings.aiEnabled ? '已启用' : '已禁用'}
                  </span>
                </div>
                {!settings.aiEnabled && (
                  <div className="mt-2 flex items-start space-x-2">
                    <AlertTriangle size={16} className="text-amber-500 mt-0.5" />
                    <p className="text-sm text-gray-600">AI 功能已关闭，编辑器将以纯文本模式运行</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* 编辑器设置 */}
          <section>
            <h2 className="text-lg font-semibold mb-4">编辑器设置</h2>

            <div className="space-y-4">
              {/* 自动保存 */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="font-medium">自动保存</label>
                  <p className="text-sm text-gray-600">编辑时自动保存内容</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoSave}
                    onChange={e => settingsManager.set('autoSave', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* 自动保存间隔 */}
              {settings.autoSave && (
                <div className="pl-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    自动保存间隔 (秒)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.autoSaveInterval / 1000}
                    onChange={e =>
                      settingsManager.set('autoSaveInterval', parseInt(e.target.value) * 1000)
                    }
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </section>

          {/* 界面设置 */}
          <section>
            <h2 className="text-lg font-semibold mb-4">界面设置</h2>

            <div className="space-y-4">
              {/* 主题 */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="font-medium">主题</label>
                  <p className="text-sm text-gray-600">选择界面主题</p>
                </div>
                <select
                  value={settings.theme}
                  onChange={e => settingsManager.set('theme', e.target.value as 'light' | 'dark')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="light">浅色</option>
                  <option value="dark">深色</option>
                </select>
              </div>

              {/* 语言 */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="font-medium">语言</label>
                  <p className="text-sm text-gray-600">选择界面语言</p>
                </div>
                <select
                  value={settings.language}
                  onChange={e =>
                    settingsManager.set('language', e.target.value as 'zh-CN' | 'en-US')
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="zh-CN">中文</option>
                  <option value="en-US">English</option>
                </select>
              </div>
            </div>
          </section>

          {/* 操作按钮 */}
          <section className="border-t pt-6">
            <div className="flex items-center justify-between">
              <button
                onClick={handleReset}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <RotateCcw size={16} />
                <span>重置设置</span>
              </button>

              <button
                onClick={handleSave}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Save size={16} />
                <span>{saved ? '已保存' : '保存设置'}</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
