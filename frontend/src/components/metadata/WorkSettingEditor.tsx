import { useEffect, useState } from 'react'
import {
  countRequiredBlocksFilled,
  getWorkSetting,
  saveWorkSetting,
  WORK_SETTING_BLOCKS,
  type WorkSetting,
} from '../../services/workSetting'
import type { Project } from '../../services/api'
import { useNotifications } from '../../hooks/useNotifications'

interface WorkSettingEditorProps {
  project: Pick<Project, 'id' | 'metadata' | 'status'>
  onSaved?: () => void
}

export default function WorkSettingEditor({ project, onSaved }: WorkSettingEditorProps) {
  const { success, error: notifyError } = useNotifications()
  const [fields, setFields] = useState<WorkSetting>(() => getWorkSetting(project.metadata as Record<string, unknown>))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setFields(getWorkSetting(project.metadata as Record<string, unknown>))
  }, [project.metadata])

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveWorkSetting(project.id, fields)
      success('已保存')
      onSaved?.()
    } catch {
      notifyError('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const filledRequired = countRequiredBlocksFilled(fields)

  return (
    <div className="bg-white rounded-lg border shadow-sm flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">企划作品设定（3 项必填 + 1 项选填）</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            描述式设定文档：作品放行至创作室的前提基础；每块自由撰写。
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 font-medium border border-indigo-100">
          放行核心设定已填 {filledRequired}/3
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {WORK_SETTING_BLOCKS.map(block => {
          const val = fields[block.key] || ''
          const len = val.trim().length
          const isFilled = len > 0

          return (
            <div key={block.key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <label className="font-medium text-gray-700">
                  {block.label}
                  {block.required ? (
                    <span className="text-indigo-600 font-normal ml-1">（放行必填）</span>
                  ) : (
                    <span className="text-gray-400 font-normal ml-1">（选填）</span>
                  )}
                </label>
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${
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
              <textarea
                value={fields[block.key]}
                onChange={e => setFields(prev => ({ ...prev, [block.key]: e.target.value }))}
                rows={5}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-y min-h-[100px] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                placeholder={`详细记录${block.label}，供创作室只读参阅...`}
              />
            </div>
          )
        })}
      </div>

      <div className="px-4 py-3 border-t bg-gray-50 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-gray-500 space-y-0.5">
          <p>保存后将作为创作室右侧侧栏的降噪只读参考。</p>
          <p className="text-gray-600 font-medium">
            {filledRequired === 3
              ? '✅ 3 项放行核心设定已具备，配合章节大纲即可一键提交创作室。'
              : `⚠️ 放行核心设定已具备 ${filledRequired}/3，尚需补全必填项。`}
          </p>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          className="px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 shrink-0 shadow-sm transition-colors"
        >
          {saving ? '保存中…' : '保存作品设定'}
        </button>
      </div>
    </div>
  )
}
