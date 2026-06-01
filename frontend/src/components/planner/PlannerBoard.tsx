import React, { useState } from 'react'
import { ProjectOutline } from '../../types/planner'
import { aiApi } from '../../services/api'
import { IconBookOpen, IconLoading, IconSave, IconSend } from '../ui/icons'

interface PlannerBoardProps {
  projectId: string
  initialOutline?: ProjectOutline
  onSave: (outline: ProjectOutline) => void
}

/** @experimental Blocker B4 — outline generation endpoint returns 404 */
export const PlannerBoard: React.FC<PlannerBoardProps> = ({ projectId, initialOutline, onSave }) => {
  const [outline, setOutline] = useState<ProjectOutline | undefined>(initialOutline)
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    setError('')
    
    const res = await aiApi.generateOutline(projectId, prompt)
    if (res.success) {
      setOutline(res.data)
    } else {
      setError(res.error?.message || '生成失败')
    }
    setLoading(false)
  }

  return (
    <div className="flex h-full gap-4">
      {/* Left: Outline Tree View */}
      <div className="flex-1 bg-white rounded-lg shadow p-6 overflow-y-auto custom-scrollbar">
        {!outline ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <IconBookOpen size={48} className="mb-4 opacity-50" />
            <p>输入你的构思，让 AI 为你规划大纲</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-xl font-bold text-gray-800">核心梗概</h2>
              <p className="text-gray-600 mt-2">{outline.premise}</p>
            </div>
            
            <div className="space-y-6">
              {outline.acts.map((act, actIndex) => (
                <div key={actIndex} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <h3 className="font-bold text-lg text-blue-800 mb-3">{act.title}</h3>
                  <div className="space-y-3 pl-4 border-l-2 border-blue-200 ml-1">
                    {act.chapters.map((chapter, chIndex) => (
                      <div key={chIndex} className="bg-white p-3 rounded shadow-sm">
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          <span className="text-blue-500 text-sm">Ch.{chIndex + 1}</span>
                          {chapter.title}
                        </div>
                        {chapter.beats.length > 0 && (
                          <ul className="mt-2 space-y-1">
                             {chapter.beats.map((beat, bIndex) => (
                               <li key={bIndex} className="text-sm text-gray-600 flex items-start gap-2">
                                 <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 flex-shrink-0" />
                                 {beat}
                               </li>
                             ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: AI Chat / Control Panel */}
      <div className="w-96 flex flex-col bg-white rounded-lg shadow p-4">
        <div className="flex-1 overflow-y-auto mb-4">
           <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 mb-4">
              <strong>🤖 AI 深度规划师</strong>
              <p className="mt-1">告诉我你的故事想法，我会帮你设计完整的三幕式大纲。</p>
           </div>
           {error && (
             <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4">
               {error}
             </div>
           )}
        </div>

        <div className="border-t pt-4">
           <textarea
             className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
             rows={4}
             placeholder="例如：一个关于时间旅行的悬疑故事，主角是只有7秒记忆的侦探..."
             value={prompt}
             onChange={(e) => setPrompt(e.target.value)}
             onKeyDown={(e) => {
               if (e.key === 'Enter' && !e.shiftKey) {
                 e.preventDefault()
                 handleGenerate()
               }
             }}
           />
           <div className="flex justify-between items-center mt-3">
             <button
                onClick={() => outline && onSave(outline)}
                disabled={!outline}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
             >
               <IconSave size={18} />
               <span>保存大纲</span>
             </button>

             <button 
               onClick={handleGenerate}
               disabled={loading || !prompt.trim()}
               className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-colors"
             >
               {loading ? <IconLoading size={18} className="animate-spin" /> : <IconSend size={18} />}
               <span>生成大纲</span>
             </button>
           </div>
        </div>
      </div>
    </div>
  )
}
