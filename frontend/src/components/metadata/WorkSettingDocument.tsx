import { useEffect, useState } from 'react'
import {
  countRequiredBlocksFilled,
  getWorkSetting,
  saveWorkSetting,
  WORK_SETTING_BLOCKS,
  type WorkSetting,
} from '../../services/workSetting'
import { projectsApi, type Project } from '../../services/api'
import { getWorkSynopsis } from '../../utils/workSynopsis'
import { useNotifications } from '../../hooks/useNotifications'

interface WorkSettingDocumentProps {
  project: Pick<Project, 'id' | 'metadata' | 'description' | 'status'>
  isEditing?: boolean
  onEditToggle?: () => void
  onSaved?: () => void
}

export default function WorkSettingDocument({
  project,
  isEditing = false,
  onEditToggle,
  onSaved,
}: WorkSettingDocumentProps) {
  const { success, error: notifyError } = useNotifications()

  // 0号块：故事梗概
  const initialSynopsis = getWorkSynopsis(
    project.description,
    project.metadata as Record<string, unknown>
  )
  const [synopsis, setSynopsis] = useState(initialSynopsis)

  // 1~4号块：3必+1选 作品设定
  const [settingFields, setSettingFields] = useState<WorkSetting>(() =>
    getWorkSetting(project.metadata as Record<string, unknown>)
  )

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setSynopsis(
      getWorkSynopsis(project.description, project.metadata as Record<string, unknown>)
    )
    setSettingFields(getWorkSetting(project.metadata as Record<string, unknown>))
  }, [project.description, project.metadata])

  const handleSaveAll = async () => {
    setSaving(true)
    try {
      // 1. 保存 0号块 (梗概：双写入 description 与 metadata.synopsis)
      await projectsApi.update(project.id, {
        description: synopsis.trim(),
        metadata: {
          ...(project.metadata as Record<string, unknown>),
          synopsis: synopsis.trim(),
        },
      })

      // 2. 保存 1~4号块 (workSetting 四块)
      await saveWorkSetting(project.id, settingFields)

      success('已保存作品设定')
      onSaved?.()
      if (onEditToggle) onEditToggle()
    } catch {
      notifyError('保存作品设定失败')
    } finally {
      setSaving(false)
    }
  }

  const filledRequired = countRequiredBlocksFilled(settingFields)
  const hasSynopsis = synopsis.trim().length > 0

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
      {/* 文档头部 Toolbar */}
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
            作品活体设定集 (0 ~ 4 号连贯资产)
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            包含作品梗概基石与四维设定 · 企划放行契约 · 创作室只读参阅
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-medium border border-indigo-100">
            放行核心设定：{filledRequired}/3
          </span>
          {onEditToggle && (
            <button
              type="button"
              onClick={onEditToggle}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                isEditing
                  ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  : 'bg-indigo-600 border-transparent text-white hover:bg-indigo-700 shadow-xs'
              }`}
            >
              {isEditing ? '取消编辑' : '编辑作品设定'}
            </button>
          )}
        </div>
      </div>

      {/* 设定文档主体流 (0 ~ 4 号块) */}
      <div className="p-5 space-y-6">
        {/* 📌 0号块：作品基石 · 故事梗概 */}
        <section className="space-y-2 border-b border-gray-100 pb-5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
              <span className="text-amber-500 font-normal">📌 0号块</span>
              作品基石 · 故事梗概
              <span className="text-indigo-600 font-normal">（创意组交接必填）</span>
            </label>
            <span className="text-[11px] text-gray-400">
              {hasSynopsis ? `${synopsis.trim().length} 字` : '未填写'}
            </span>
          </div>

          {isEditing ? (
            <textarea
              value={synopsis}
              onChange={e => setSynopsis(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans leading-relaxed"
              placeholder="概括作品核心主线与亮点概要，作为企划与创作的参照底座…"
            />
          ) : (
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50/70 rounded-lg p-3.5 border border-gray-100 min-h-[60px]">
              {hasSynopsis ? (
                synopsis.trim()
              ) : (
                <span className="text-gray-400 italic text-xs">
                  暂未填写故事梗概。梗概是作品创作最重要的基础参考。
                </span>
              )}
            </div>
          )}
        </section>

        {/* 📌 1~4号块：企划课四维设定 */}
        <section className="space-y-5">
          <div className="text-xs font-bold text-gray-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            企划四维设定（3 项放行必填 + 1 项选填）
          </div>

          {WORK_SETTING_BLOCKS.map((block, idx) => {
            const val = settingFields[block.key] || ''
            const len = val.trim().length
            const isFilled = len > 0
            const blockNum = idx + 1

            return (
              <div key={block.key} className="space-y-2 border-b border-gray-50 pb-4 last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-gray-800 flex items-center gap-1.5">
                    <span className="text-indigo-600 font-normal">#{blockNum}</span>
                    {block.label}
                    {block.required ? (
                      <span className="text-indigo-600 font-normal">（放行必填）</span>
                    ) : (
                      <span className="text-gray-400 font-normal">（选填）</span>
                    )}
                  </label>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                      isFilled
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : block.required
                          ? 'bg-amber-50 text-amber-700 border border-amber-100'
                          : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {isFilled ? `已填写 · ${len} 字` : block.required ? '待填写 · 创作室放行必备' : '未填写'}
                  </span>
                </div>

                {isEditing ? (
                  <textarea
                    value={settingFields[block.key]}
                    onChange={e =>
                      setSettingFields(prev => ({ ...prev, [block.key]: e.target.value }))
                    }
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-y min-h-[90px] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans leading-relaxed"
                    placeholder={`详细撰写${block.label}，供写作时只读参阅…`}
                  />
                ) : (
                  <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50/50 rounded-lg p-3.5 border border-gray-100 min-h-[50px]">
                    {val.trim() ? (
                      val.trim()
                    ) : (
                      <span className="text-gray-400 italic text-xs">企划阶段未填写</span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </section>
      </div>

      {/* 编辑态底栏 */}
      {isEditing && (
        <div className="px-5 py-3.5 border-t bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-xs text-gray-500 space-y-0.5">
            <p className="text-indigo-900 font-medium">
              💡 保存后将同时同步故事梗概与四维设定，并直接投射到创作室只读侧栏。
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onEditToggle && (
              <button
                type="button"
                onClick={onEditToggle}
                className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
            )}
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSaveAll()}
              className="px-5 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 shadow-sm transition-colors"
            >
              {saving ? '保存中…' : '保存作品设定'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
