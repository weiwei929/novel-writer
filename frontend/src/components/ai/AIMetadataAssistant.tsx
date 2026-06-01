import React, { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { aiApi } from '../../services/api'
import { IconBot, IconCheck, IconClose, IconEdit, IconInfo, IconSave, IconSparkles, IconUser } from '../ui/icons'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AIMetadataAssistantProps {
  isOpen: boolean
  onClose: () => void
  type: 'project' | 'chapter'
  entityId: string
  field: string
  fieldLabel: string
  existingContent?: string  // 现有内容，用于编辑模式
  onSave: (content: string) => void
}

export const AIMetadataAssistant: React.FC<AIMetadataAssistantProps> = ({
  isOpen,
  onClose,
  type,
  entityId,
  field,
  fieldLabel,
  existingContent = '',  // 接收现有内容
  onSave,
}) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [userInput, setUserInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedContent, setGeneratedContent] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 初始化对话 - 当对话框打开时重置并发送初始消息
  useEffect(() => {
    if (isOpen) {
      // 重置消息列表
      setMessages([])
      setGeneratedContent(null)
      setError(null)
      
      // 根据是否有现有内容，发送不同的初始消息
      const hasExisting = existingContent && existingContent.trim().length > 0
      console.log('🤖 [AIMetadataAssistant] Initializing:', {
        isOpen,
        existingContent: existingContent?.substring(0, 100) + '...',
        hasExisting,
        contentLength: existingContent?.length || 0
      })
      
      // 延迟发送，确保 messages 已重置
      setTimeout(() => {
        if (hasExisting) {
          // 编辑模式：告诉 AI 现有内容
          handleSendMessage(`现有内容：\n\n${existingContent}\n\n请帮我优化或修改`, true)
        } else {
          // 新建模式：从零开始
          handleSendMessage('开始', true)
        }
      }, 100)
    }
  }, [isOpen])

  const handleSendMessage = async (message: string, isInitial: boolean = false) => {
    if (!message.trim() && !isInitial) return

    const userMessage = message.trim()
    
    // 始终添加用户消息到对话中（包括初始消息，这样用户可以看到"现有内容：..."）
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    
    setUserInput('')
    setLoading(true)
    setError(null)

    try {
      const response = await aiApi.metadataChat({
        type,
        entityId,
        field,
        conversationHistory: messages,
        userMessage: isInitial ? '请开始引导我构建这个字段的内容' : userMessage,
      })

      if (response.success && response.data?.content) {
        // 添加 AI 消息
        setMessages(prev => [...prev, { role: 'assistant', content: response.data!.content }])
        
        // 检查 AI 是否生成了最终内容（包含 Markdown 代码块）
        if (response.data.content.includes('```') || response.data.content.includes('## ')) {
          // 提取 Markdown 内容
          const extracted = extractMarkdownContent(response.data.content)
          if (extracted) {
            setGeneratedContent(extracted)
            setEditedContent(extracted)
          }
        }
      } else {
        throw new Error(response.error?.message || 'AI 响应格式错误')
      }
    } catch (err: any) {
      setError(err.message || 'AI 对话失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 提取 Markdown 内容
  const extractMarkdownContent = (text: string): string | null => {
    // 尝试提取代码块中的内容
    const codeBlockMatch = text.match(/```(?:markdown)?\n([\s\S]*?)\n```/)
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim()
    }
    
    // 如果包含 Markdown 标题，直接返回
    if (text.includes('## ') || text.includes('### ')) {
      return text.trim()
    }
    
    return null
  }

  const handleSave = () => {
    if (generatedContent) {
      onSave(isEditing ? editedContent : generatedContent)
      handleClose()
    }
  }

  const handleClose = () => {
    setMessages([])
    setUserInput('')
    setError(null)
    setGeneratedContent(null)
    setIsEditing(false)
    setEditedContent('')
    onClose()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(userInput)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-blue-50 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <IconBot size={24} className="text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">AI 元数据助手</h2>
              <p className="text-sm text-gray-500">正在构建：{fieldLabel}</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-white/50 rounded-full transition-colors">
            <IconClose size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* 对话区域 */}
          <div className={`${generatedContent ? 'w-1/2' : 'w-full'} flex flex-col border-r border-gray-200`}>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <IconBot size={16} className="text-purple-600" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <IconUser size={16} className="text-blue-600" />
                    </div>
                  )}
                </div>
              ))}
              
              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <IconBot size={16} className="text-purple-600" />
                  </div>
                  <div className="bg-gray-100 rounded-lg p-4">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              {error && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                  <IconInfo size={16} />
                  {error}
                </div>
              )}
              
              <div className="flex gap-2">
                <textarea
                  ref={inputRef}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="输入你的想法... (Enter 发送, Shift+Enter 换行)"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={2}
                  disabled={loading}
                />
                <button
                  onClick={() => handleSendMessage(userInput)}
                  disabled={loading || !userInput.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all flex items-center gap-2"
                >
                  <IconSparkles size={18} />
                  发送
                </button>
              </div>
            </div>
          </div>

          {/* 预览区域 */}
          {generatedContent && (
            <div className="w-1/2 flex flex-col bg-gray-50">
              <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">生成的内容</h3>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                >
                  {isEditing ? <IconCheck size={16} /> : <IconEdit size={16} />}
                  {isEditing ? '完成编辑' : '编辑'}
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                {isEditing ? (
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full h-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm"
                  />
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{generatedContent}</ReactMarkdown>
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3 text-sm text-yellow-800">
                  ⚠️ 保存后，此内容将成为 AI 写作和审阅的核心约束条件
                </div>
                <button
                  onClick={handleSave}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 font-medium transition-all flex items-center justify-center gap-2"
                >
                  <IconSave size={18} />
                  确认保存到"{fieldLabel}"
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
