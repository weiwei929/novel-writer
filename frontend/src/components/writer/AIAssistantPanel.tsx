import React, { useState } from 'react'
import { Send, Bot, X, CheckCheck } from 'lucide-react'
import { aiApi } from '../../services/api'

interface AIAssistantPanelProps {
  onClose: () => void
  onApplyContent?: (content: string) => void
}

const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({ onClose, onApplyContent }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: '我是您的 AI 创作助手。有什么我可以帮您的吗？您可以让我续写一段，或者给当前章节提供建议。' }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim()) return
    
    const userMsg = input
    const newMessages = [...messages, { role: 'user' as const, content: userMsg }]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    try {
      const response = await aiApi.chat(newMessages.map(m => ({ 
        role: m.role, 
        content: m.content 
      })))
      
      setMessages(prev => [...prev, { role: 'assistant', content: response }])
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，AI 服务暂时不可用。请检查后台连接。' }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200 w-80 shadow-xl">
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-blue-50/50">
        <div className="flex items-center gap-2 text-blue-800 font-medium">
          <Bot size={18} />
          <span>AI 助手</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg p-3 text-sm group relative ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
              }`}
            >
              {msg.content}
              {/* Insert / Apply Button for AI messages */}
              {msg.role === 'assistant' && onApplyContent && (
                <div className="absolute -bottom-6 left-0 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                      onClick={() => onApplyContent(msg.content)}
                      className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 shadow-sm hover:bg-blue-100"
                   >
                     <CheckCheck size={12} />
                     <span>插入正文</span>
                   </button>
                </div>
              )}
            </div>
          </div>
        ))}
         {isLoading && (
            <div className="flex justify-start">
               <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                 <div className="flex space-x-1">
                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                 </div>
               </div>
            </div>
         )}
      </div>

      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSend()}
            placeholder="输入指令..."
            className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-1 top-1 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default AIAssistantPanel
