
import React, { useState } from 'react'
import { Send, Bot, X, CheckCheck, BookMarked, ChevronDown, FileSearch } from 'lucide-react'
import { aiApi } from '../../services/api'

interface AIAssistantPanelProps {
  onClose: () => void
  onApplyContent?: (content: string) => void
  onUpdateMetadata?: (field: string, content: string) => Promise<void>
  projectId?: string
  chapterId?: string
}

const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({ onClose, onApplyContent, onUpdateMetadata, projectId, chapterId }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: '我是您的 AI 创作助手。有什么我可以帮您的吗？您可以让我续写一段，或者给当前章节提供建议。' }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // State for Metadata Popover
  const [activeMessageIdx, setActiveMessageIdx] = useState<number | null>(null)
  
  const handleSend = async (overrideContent?: string, overrideContextType?: 'chapter_review' | 'global') => {
    const contentToSend = overrideContent || input;
    if (!contentToSend.trim()) return
    
    const userMsg = contentToSend
    const newMessages = [...messages, { role: 'user' as const, content: userMsg }]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    try {
      const response = await aiApi.chat(newMessages.map(m => ({ 
        role: m.role, 
        content: m.content 
      })), { 
        projectId, 
        chapterId,
        // If it's a specific review action, use that context type. Otherwise default to chat.
        contextType: overrideContextType || 'chat' 
      })
      
      setMessages(prev => [...prev, { role: 'assistant', content: response }])
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，AI 服务暂时不可用。请检查后台连接。' }])
    } finally {
      setIsLoading(false)
    }
  }

  const startChapterReview = () => {
    handleSend("请对当前章节进行【本章诊断】，检查节奏、风格和对话自然度。", 'chapter_review');
  }

  const handleMetadataAction = async (field: string, content: string) => {
      if (!onUpdateMetadata) return;
      try {
          await onUpdateMetadata(field, content);
          setActiveMessageIdx(null);
          // Optional: Show toast or success indicator? handled by parent usually.
      } catch (e) {
          console.error(e);
      }
  }

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200 w-80 shadow-xl">
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-blue-50/50">
        <div className="flex items-center gap-2 text-blue-800 font-medium">
          <Bot size={18} />
          <span>AI 助手</span>
        </div>
        <div className="flex items-center gap-1">
             <button 
                onClick={startChapterReview}
                className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                title="本章诊断 (Chapter Review)"
                disabled={isLoading}
             >
                <FileSearch size={16} />
             </button>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md">
              <X size={16} />
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[90%] rounded-lg p-3 text-sm group relative ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
              }`}
            >
              <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
              
              {/* Action Buttons for AI messages */}
              {msg.role === 'assistant' && (
                <div className="flex flex-wrap gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                   {onApplyContent && (
                    <button 
                        onClick={() => onApplyContent(msg.content)}
                        className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 shadow-sm hover:bg-blue-100"
                        title="插入到编辑器光标处"
                    >
                        <CheckCheck size={12} />
                        <span>正文</span>
                    </button>
                   )}
                   
                   {onUpdateMetadata && (
                       <div className="relative">
                           <button 
                                onClick={() => setActiveMessageIdx(activeMessageIdx === idx ? null : idx)}
                                className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded border border-purple-100 shadow-sm hover:bg-purple-100"
                                title="采纳为项目设定"
                            >
                                <BookMarked size={12} />
                                <span>设定</span>
                                <ChevronDown size={10} />
                            </button>
                            
                            {activeMessageIdx === idx && (
                                <div className="absolute top-full left-0 mt-1 w-32 bg-white rounded-lg shadow-xl border border-gray-200 z-10 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
                                    <button 
                                        onClick={() => handleMetadataAction('settings', msg.content)}
                                        className="text-left px-3 py-2 text-xs hover:bg-purple-50 text-gray-700"
                                    >
                                        存为世界观
                                    </button>
                                    <button 
                                        onClick={() => handleMetadataAction('characters', msg.content)}
                                        className="text-left px-3 py-2 text-xs hover:bg-purple-50 text-gray-700"
                                    >
                                        存为角色
                                    </button>
                                    <button 
                                        onClick={() => handleMetadataAction('synopsis', msg.content)}
                                        className="text-left px-3 py-2 text-xs hover:bg-purple-50 text-gray-700"
                                    >
                                        存为梗概
                                    </button>
                                </div>
                            )}
                       </div>
                   )}
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
            placeholder="与 AI 讨论剧情或设定..."
            className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button
            onClick={() => handleSend()}
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
