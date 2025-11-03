import React, { useState, useEffect } from 'react'
import { aiApi } from '../../services/api'
import { settingsManager } from '../../utils/settings'
import { Bot, Lightbulb, User, Zap, Loader, CheckCircle, XCircle, Settings } from 'lucide-react'

interface AIAssistantProps {
  currentContent: string
  onSuggestionAccept: (suggestion: string) => void
}

const AIAssistant: React.FC<AIAssistantProps> = ({ currentContent, onSuggestionAccept }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'suggestions' | 'character' | 'custom'>('suggestions')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [apiStatus, setApiStatus] = useState<'unknown' | 'connected' | 'error'>('unknown')
  const [aiEnabled, setAiEnabled] = useState(settingsManager.isAIEnabled())

  // 自定义生成表单
  const [customPrompt, setCustomPrompt] = useState('')
  const [customSystemPrompt, setCustomSystemPrompt] = useState('')
  const [characterDescription, setCharacterDescription] = useState('')

  // 监听设置变化
  useEffect(() => {
    const handleSettingsUpdate = () => {
      setAiEnabled(settingsManager.isAIEnabled())
    }
    
    window.addEventListener('settings-updated', handleSettingsUpdate)
    return () => window.removeEventListener('settings-updated', handleSettingsUpdate)
  }, [])

  const checkApiStatus = async () => {
    try {
      const response = await aiApi.test()
      setApiStatus(response.success ? 'connected' : 'error')
    } catch (err) {
      setApiStatus('error')
    }
  }

  const handleWritingSuggestion = async (type: 'continue' | 'improve' | 'brainstorm') => {
    if (!currentContent.trim()) {
      setError('请先在编辑器中输入一些内容')
      return
    }

    setLoading(true)
    setError('')
    setResult('')

    try {
      const response = await aiApi.getWritingSuggestion({
        content: currentContent,
        type
      })

      if (response.success) {
        setResult(response.data.suggestion)
      } else {
        setError(response.error?.message || '获取建议失败')
      }
    } catch (err) {
      setError('网络错误，请检查连接')
      console.error('AI suggestion error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCharacterGeneration = async () => {
    if (!characterDescription.trim()) {
      setError('请输入角色描述')
      return
    }

    setLoading(true)
    setError('')
    setResult('')

    try {
      const response = await aiApi.generateCharacter(characterDescription)

      if (response.success) {
        setResult(response.data.character)
      } else {
        setError(response.error?.message || '生成角色失败')
      }
    } catch (err) {
      setError('网络错误，请检查连接')
      console.error('Character generation error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCustomGeneration = async () => {
    if (!customPrompt.trim()) {
      setError('请输入生成提示')
      return
    }

    setLoading(true)
    setError('')
    setResult('')

    try {
      const response = await aiApi.generate({
        prompt: customPrompt,
        context: currentContent,
        systemPrompt: customSystemPrompt || undefined,
        maxTokens: 1500,
        temperature: 0.7
      })

      if (response.success) {
        setResult(response.data.content)
      } else {
        setError(response.error?.message || '生成内容失败')
      }
    } catch (err) {
      setError('网络错误，请检查连接')
      console.error('Custom generation error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptSuggestion = () => {
    if (result) {
      onSuggestionAccept(result)
      setResult('')
      setIsOpen(false)
    }
  }

  // 如果 AI 功能未启用，显示设置提示
  if (!aiEnabled) {
    if (!isOpen) {
      return (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed right-6 bottom-6 bg-gray-500 text-white p-3 rounded-full shadow-lg hover:bg-gray-600 transition-colors"
          title="AI 助手 (未启用)"
        >
          <Bot size={24} />
        </button>
      )
    }

    return (
      <div className="fixed right-6 bottom-6 bg-white rounded-lg shadow-xl border w-96">
        <div className="bg-gray-500 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot size={20} />
            <span className="font-semibold">AI 写作助手</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:text-gray-200"
          >
            ×
          </button>
        </div>

        <div className="p-6 text-center">
          <div className="mb-4">
            <Settings size={48} className="mx-auto text-gray-400 mb-2" />
            <h3 className="text-lg font-semibold text-gray-800">AI 功能未启用</h3>
            <p className="text-gray-600 mt-2">
              请在设置中启用 AI 功能并配置 API Key 来使用写作助手
            </p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                // 跳转到设置页面
                window.location.href = '/#/settings'
                setIsOpen(false)
              }}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              前往设置
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-50"
            >
              稍后设置
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true)
          if (apiStatus === 'unknown') {
            checkApiStatus()
          }
        }}
        className="fixed right-6 bottom-6 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        title="AI 写作助手"
      >
        <Bot size={24} />
      </button>
    )
  }

  return (
    <div className="fixed right-6 bottom-6 bg-white rounded-lg shadow-xl border w-96 max-h-[500px] overflow-hidden">
      <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bot size={20} />
          <span className="font-semibold">AI 写作助手</span>
        </div>
        <div className="flex items-center space-x-2">
          {apiStatus === 'connected' && <CheckCircle size={16} className="text-green-300" />}
          {apiStatus === 'error' && <XCircle size={16} className="text-red-300" />}
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:text-gray-200"
          >
            ×
          </button>
        </div>
      </div>

      {apiStatus === 'error' && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <p className="text-sm">AI 服务未配置或连接失败</p>
          <button
            onClick={checkApiStatus}
            className="text-xs text-red-600 hover:underline mt-1"
          >
            重新检测
          </button>
        </div>
      )}

      <div className="border-b">
        <div className="flex">
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              activeTab === 'suggestions'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Lightbulb size={16} className="inline mr-1" />
            写作建议
          </button>
          <button
            onClick={() => setActiveTab('character')}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              activeTab === 'character'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <User size={16} className="inline mr-1" />
            角色生成
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              activeTab === 'custom'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Zap size={16} className="inline mr-1" />
            自定义
          </button>
        </div>
      </div>

      <div className="p-4 max-h-80 overflow-y-auto">
        {activeTab === 'suggestions' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-4">
              基于当前内容生成写作建议
            </p>
            <div className="space-y-2">
              <button
                onClick={() => handleWritingSuggestion('continue')}
                disabled={loading || apiStatus === 'error'}
                className="w-full text-left p-3 border rounded hover:bg-gray-50 disabled:opacity-50"
              >
                <div className="font-medium">续写内容</div>
                <div className="text-sm text-gray-500">继续当前情节发展</div>
              </button>
              <button
                onClick={() => handleWritingSuggestion('improve')}
                disabled={loading || apiStatus === 'error'}
                className="w-full text-left p-3 border rounded hover:bg-gray-50 disabled:opacity-50"
              >
                <div className="font-medium">改进建议</div>
                <div className="text-sm text-gray-500">分析并提供改进意见</div>
              </button>
              <button
                onClick={() => handleWritingSuggestion('brainstorm')}
                disabled={loading || apiStatus === 'error'}
                className="w-full text-left p-3 border rounded hover:bg-gray-50 disabled:opacity-50"
              >
                <div className="font-medium">创意拓展</div>
                <div className="text-sm text-gray-500">提供创意发展方向</div>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'character' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-4">
              描述角色特征，AI 将生成详细设定
            </p>
            <textarea
              value={characterDescription}
              onChange={(e) => setCharacterDescription(e.target.value)}
              placeholder="例如：年轻的剑客，冷静沉着，有着神秘的过去..."
              className="w-full p-2 border rounded text-sm"
              rows={3}
            />
            <button
              onClick={handleCharacterGeneration}
              disabled={loading || apiStatus === 'error'}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              生成角色设定
            </button>
          </div>
        )}

        {activeTab === 'custom' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-4">
              自定义 AI 生成请求
            </p>
            <div className="space-y-2">
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="输入你的生成提示..."
                className="w-full p-2 border rounded text-sm"
                rows={2}
              />
              <textarea
                value={customSystemPrompt}
                onChange={(e) => setCustomSystemPrompt(e.target.value)}
                placeholder="系统提示（可选）..."
                className="w-full p-2 border rounded text-sm"
                rows={2}
              />
              <button
                onClick={handleCustomGeneration}
                disabled={loading || apiStatus === 'error'}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                生成内容
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader size={24} className="animate-spin text-blue-600" />
            <span className="ml-2 text-sm text-gray-600">AI 正在思考...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className="border rounded p-3 bg-gray-50">
            <div className="text-sm text-gray-600 mb-2">AI 生成结果：</div>
            <div className="text-sm whitespace-pre-wrap mb-3">{result}</div>
            <div className="flex space-x-2">
              <button
                onClick={handleAcceptSuggestion}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
              >
                采用建议
              </button>
              <button
                onClick={() => setResult('')}
                className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
              >
                清除
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AIAssistant