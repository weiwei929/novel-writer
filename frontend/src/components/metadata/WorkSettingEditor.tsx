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
      await saveWorkSetting(project.id, project, fields)
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
      <div className="px-4 py-3 border-b">
        <h3 className="text-sm font-semibold text-gray-900">作品设定（三必一选）</h3>
        <p className="text-xs text-gray-500 mt-1">
          描述式创作设定文档；每块自由书写，无需拆分子字段。
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {WORK_SETTING_BLOCKS.map(block => (
          <div key={block.key}>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {block.label}
              {block.required ? (
                <span className="text-amber-600 font-normal ml-1">（建议填写）</span>
              ) : (
                <span className="text-gray-400 font-normal ml-1">（可选）</span>
              )}
            </label>
            <textarea
              value={fields[block.key]}
              onChange={e => setFields(prev => ({ ...prev, [block.key]: e.target.value }))}
              rows={5}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-y min-h-[100px] focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder={`记录${block.label}…`}
            />
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t bg-gray-50 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-gray-500 space-y-0.5">
          <p>仅保存当前内容，不改变作品流程状态。</p>
          <p className="text-gray-400">三必已填 {filledRequired}/3（仅供参考，不阻断流程）</p>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 shrink-0"
        >
          {saving ? '保存中…' : '保存作品设定'}
        </button>
      </div>
    </div>
  )
}
