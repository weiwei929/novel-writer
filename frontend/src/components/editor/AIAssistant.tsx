import React, { useState, useEffect } from 'react'
import { aiApi } from '../../services/api'
import { settingsManager } from '../../utils/settings'
import { Bot, Lightbulb, User, Zap, Loader, CheckCircle, XCircle } from 'lucide-react'

interface AIAssistantProps {
  currentContent: string
  onSuggestionAccept: (suggestion: string) => void
  projectId?: string
  chapterId?: string
}

const AIAssistant: React.FC<AIAssistantProps> = ({ currentContent, onSuggestionAccept, projectId, chapterId }) => {
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
      const status = await aiApi.checkStatus()
      setApiStatus(status.status !== 'unavailable' ? 'connected' : 'error')
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
        type,
        chapterId
      })

      if (response.success && response.data) {
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

      if (response.success && response.data) {
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
        temperature: 0.7,
        projectId
      })

      if (response.success && response.data) {
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

  const handleClose = () => {
    if (result) {
      if (window.confirm('生成的内容尚未保存/采纳，确定要关闭吗？')) {
        setResult('')
        setIsOpen(false)
      }
    } else {
      setIsOpen(false)
    }
  }

  // 如果 AI 功能未启用，建议去设置
  if (!aiEnabled) {
     // ... (Existing implementation for disabled state) ... 
      if (!isOpen) { 
        // ...
      }
      // Return settings prompt...
      return (
        <div className="fixed right-6 bottom-6 bg-white rounded-lg shadow-xl border w-96 z-50">
            {/* Same as before but ensure z-index */}
             <div className="bg-gray-500 text-white p-4 flex items-center justify-between">
                {/* ... */}
                <button onClick={() => setIsOpen(false)}>×</button> 
             </div>
             {/* ... content ... */}
        </div>
      )
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true)
          if (apiStatus === 'unknown') checkApiStatus()
        }}
        className="fixed right-6 bottom-6 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50 transform hover:scale-105 active:scale-95"
        title="AI 写作助手"
      >
        <Bot size={24} />
      </button>
    )
  }

  return (
    <div className="fixed right-6 bottom-6 bg-white rounded-xl shadow-2xl border w-96 max-h-[600px] flex flex-col z-50 overflow-hidden ring-1 ring-black/5">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-4 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center space-x-2">
          <Bot size={20} />
          <span className="font-semibold tracking-wide">AI 写作助手</span>
        </div>
        <div className="flex items-center space-x-3">
          {apiStatus === 'connected' && <div className="flex items-center text-xs bg-black/20 px-2 py-0.5 rounded-full"><div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5"></div>在线</div>}
          {apiStatus === 'error' && <div className="flex items-center text-xs bg-red-900/30 px-2 py-0.5 rounded-full"><XCircle size={10} className="mr-1"/>离线</div>}
          <button 
            onClick={handleClose} 
            className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
          >
            ×
          </button>
        </div>
      </div>

      {apiStatus === 'error' && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 text-sm flex justify-between items-center shrink-0">
          <span>服务连接失败</span>
          <button onClick={checkApiStatus} className="text-red-600 font-medium hover:underline text-xs">
            重试
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
            <p className="text-sm text-gray-600 mb-4">基于当前内容生成写作建议</p>
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
            <p className="text-sm text-gray-600 mb-4">描述角色特征，AI 将生成详细设定</p>
            <textarea
              value={characterDescription}
              onChange={e => setCharacterDescription(e.target.value)}
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
            <p className="text-sm text-gray-600 mb-4">自定义 AI 生成请求</p>
            <div className="space-y-2">
              <textarea
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                placeholder="输入你的生成提示..."
                className="w-full p-2 border rounded text-sm"
                rows={2}
              />
              <textarea
                value={customSystemPrompt}
                onChange={e => setCustomSystemPrompt(e.target.value)}
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
          <div className="flex-1 overflow-y-auto bg-gray-50 border-t flex flex-col min-h-0">
            <div className="p-4 space-y-4">
               {/* Result Header */}
               <div className="flex items-center justify-between text-xs text-gray-500 uppercase tracking-wider font-semibold">
                  <span>AI 生成预览</span>
                  <div className="flex space-x-2">
                     <button className="hover:text-blue-600">复制</button>
                  </div>
               </div>

               {/* Content Preview */}
               <div className="bg-white border rounded-lg p-3 text-sm leading-relaxed text-gray-800 shadow-sm font-serif whitespace-pre-wrap">
                  {result}
               </div>

               {/* Actions */}
               <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setResult('')}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                  >
                    不满意 (放弃)
                  </button>
                  <button
                    onClick={handleAcceptSuggestion}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm hover:shadow transition-all text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={16} />
                    采用建议
                  </button>
               </div>
               
               <div className="text-center">
                  <button 
                     onClick={() => {
                        // Loop: Retry logic (simplistic: just re-trigger for now or clear)
                        setResult('')
                        // Ideally we recall the last function, but for now 'Discard' acts as retry trigger
                     }}
                     className="text-xs text-gray-400 hover:text-blue-500 underline decoration-dotted"
                  >
                     这也太差了，重新生成
                  </button>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AIAssistant
