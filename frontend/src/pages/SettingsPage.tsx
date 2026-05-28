import React, { useState, useEffect } from 'react'
import { Save, AlertCircle, Server, Key, Box, Globe } from 'lucide-react'
import { settingsApi, aiApi } from '../services/api'
import { useNotifications } from '../hooks/useNotifications'

const SettingsPage: React.FC = () => {
  const { success, error } = useNotifications()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; provider?: string; model?: string; error?: string } | null>(null)
  
  const [config, setConfig] = useState({
    provider: 'gemini',
    apiKey: '',
    model: 'gemini-1.5-pro',
    baseUrl: ''
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response: any = await settingsApi.get()
      const data = response.ai ? response : { ai: { provider: 'gemini', apiKey: '', model: 'gemini-1.5-pro', baseUrl: '' } };
      
      if (data && data.ai) {
        setConfig({
            provider: data.ai.provider || 'gemini',
            apiKey: data.ai.apiKey || '', // Will be masked '******'
            model: data.ai.model || 'gemini-1.5-pro',
            baseUrl: data.ai.baseUrl || ''
        })
      }
    } catch (err) {
      error('加载设置失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await settingsApi.update({ ai: config })
      success('设置已保存', 'AI 配置已更新生效')
      // Refresh to get masked key if needed, or just stay
    } catch (err) {
      error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const result = await aiApi.testConnection()
      setTestResult(result)
      if (result.success) {
        success('连接成功', `模型: ${result.model || '未知'}`)
      } else {
        error('连接失败', result.error || '未知错误')
      }
    } catch (err) {
      setTestResult({ success: false, error: '测试失败' })
      error('测试失败')
    } finally {
      setTesting(false)
    }
  }

  if (loading) return <div className="p-8">加载中...</div>

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        <Server className="text-blue-600" />
        系统设置
      </h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            AI 模型配置
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            配置您的 LLM 提供商。为了在中国大陆地区稳定使用，建议配置 Base URL。
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Provider Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                模型提供商 (Provider)
              </label>
              <div className="relative">
                <Box className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <select
                  value={config.provider}
                  onChange={e => setConfig({ ...config, provider: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                >
                  <option value="gemini">Google Gemini</option>
                  <option value="openai">OpenAI</option>
                  <option value="deepseek">DeepSeek (OpenAI Compatible)</option>
                  <option value="mock">Mock (测试模式)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                模型名称 (Model Name)
              </label>
              <div className="relative">
                <input 
                  type="text"
                  value={config.model}
                  onChange={e => setConfig({ ...config, model: e.target.value })}
                  placeholder="e.g. gemini-1.5-pro"
                  className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key (密钥)
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="text" // using text explicitly to allow seeing dashes, mask handled by backend return
                value={config.apiKey}
                onChange={e => setConfig({ ...config, apiKey: e.target.value })}
                placeholder="AIza..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              密钥将安全存储在服务器端。显示为 ****** 是为了安全。
            </p>
          </div>

          {/* Base URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Base URL (代理地址/API域名)
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="text"
                value={config.baseUrl}
                onChange={e => setConfig({ ...config, baseUrl: e.target.value })}
                placeholder="https://generativelanguage.googleapis.com"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              />
            </div>
            <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
               <AlertCircle size={12} />
               注意：如果您的网络无法直接连接 Google，请填写可用的反代地址。保持为空将使用默认官方地址。
            </p>
          </div>

          {/* Test Connection Section */}
          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={handleTestConnection}
              disabled={testing || !config.apiKey}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm font-medium"
            >
              {testing ? (
                <>测试中...</>
              ) : (
                <>
                  <AlertCircle size={18} />
                  测试连接
                </>
              )}
            </button>
            
            {testResult && (
              <div className={`mt-3 p-3 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-start gap-2">
                  <div className={`mt-0.5 ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                    {testResult.success ? '✅' : '❌'}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                      {testResult.success ? '连接成功!' : '连接失败'}
                    </p>
                    {testResult.success && testResult.model && (
                      <p className="text-sm text-green-700 mt-1">
                        模型: {testResult.model}
                      </p>
                    )}
                    {!testResult.success && testResult.error && (
                      <p className="text-sm text-red-700 mt-1">
                        {testResult.error}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm font-medium"
            >
              {saving ? (
                <>保存中...</>
              ) : (
                <>
                  <Save size={18} />
                  保存配置
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
