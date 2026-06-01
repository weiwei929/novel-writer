/**
 * ❌ DEPRECATED - 此组件已废弃
 * 
 * 原因：独立的角色生成功能已整合到 AI 元数据助手中
 * 替代方案：使用 AIMetadataAssistant 组件的"人物设定"字段对话式生成
 * 
 * 保留此文件仅作为 UI 设计参考
 */

import React, { useState } from 'react'
import { aiApi } from '../../services/api'
import { IconBot, IconClose, IconRefresh, IconSave, IconSparkles, IconUser } from '../ui/icons'

interface CharacterGenerationModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  onSave: (character: any) => void
}

export const CharacterGenerationModal: React.FC<CharacterGenerationModalProps> = ({
  isOpen,
  onClose,
  projectId,
  onSave,
}) => {
  const [description, setDescription] = useState('')
  const [character, setCharacter] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('请输入角色描述')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await aiApi.generateCharacter(projectId, description)
      if (response.success && response.data?.character) {
        setCharacter(response.data.character)
      } else {
        setError(response.error?.message || '角色生成失败')
      }
    } catch (err: any) {
      setError(err.message || '角色生成失败,请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = () => {
    if (character) {
      onSave(character)
      handleClose()
    }
  }

  const handleClose = () => {
    setDescription('')
    setCharacter(null)
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-blue-50 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <IconUser size={24} className="text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">AI 角色生成</h2>
              <p className="text-sm text-gray-500">描述你想要的角色,AI 将为你生成详细设定</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-white/50 rounded-full transition-colors">
            <IconClose size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Input Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              角色描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="例如: 一个冷酷的剑客,有着神秘的过去,擅长使用双刀,性格孤僻但内心善良..."
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              disabled={loading}
            />
            <p className="mt-2 text-xs text-gray-500">
              💡 提示: 描述越详细,生成的角色设定越丰富
            </p>
          </div>

          {/* Generate Button */}
          {!character && (
            <button
              onClick={handleGenerate}
              disabled={loading || !description.trim()}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  AI 正在创作中...
                </>
              ) : (
                <>
                  <IconSparkles size={20} />
                  生成角色
                </>
              )}
            </button>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* Character Display */}
          {character && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <IconBot size={20} className="text-purple-600" />
                  生成的角色设定
                </h3>
                <button
                  onClick={handleGenerate}
                  className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                >
                  <IconRefresh size={16} />
                  重新生成
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">姓名:</span>
                    <p className="text-gray-900 mt-1">{character.name || '未命名'}</p>
                  </div>
                  
                  {character.age && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">年龄:</span>
                      <p className="text-gray-900 mt-1">{character.age}</p>
                    </div>
                  )}

                  {character.personality && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">性格:</span>
                      <p className="text-gray-900 mt-1">{character.personality}</p>
                    </div>
                  )}

                  {character.background && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">背景:</span>
                      <p className="text-gray-900 mt-1 whitespace-pre-wrap">{character.background}</p>
                    </div>
                  )}

                  {character.appearance && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">外貌:</span>
                      <p className="text-gray-900 mt-1">{character.appearance}</p>
                    </div>
                  )}

                  {character.skills && character.skills.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">技能:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {character.skills.map((skill: string, index: number) => (
                          <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Raw JSON (collapsible) */}
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                  查看完整 JSON 数据
                </summary>
                <pre className="mt-2 p-4 bg-gray-900 text-green-400 rounded-lg text-xs overflow-x-auto">
                  {JSON.stringify(character, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
          >
            取消
          </button>
          {character && (
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors flex items-center gap-2"
            >
              <IconSave size={18} />
              保存到人物库
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
