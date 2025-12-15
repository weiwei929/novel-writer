import React, { useState, useEffect } from 'react'
import { Save, AlertCircle, Server, Key, Box, Globe } from 'lucide-react'
import { settingsApi } from '../services/api'
import { useNotifications } from '../hooks/useNotifications'
import Layout from '../components/Layout'
import { PageWrapper } from '../components/layout/PageWrapper'

const SettingsPage: React.FC = () => {
  const { success, error } = useNotifications()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
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

// Wrap with Layout for direct route usage if needed, or imported
export default function SettingsPageWrapper() {
    return (
        <Layout>
            <PageWrapper>
                <SettingsPage />
            </PageWrapper>
        </Layout>
    )
}
