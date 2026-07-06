import { IconClose } from '../ui/icons'
import { useEffect, useState } from 'react'
import type { TimelineEntry, TimelineInput } from '../../services/api'

interface TimelineFormModalProps {
  open: boolean
  entry: TimelineEntry | null
  defaultSortOrder: number
  onClose: () => void
  onSubmit: (data: Omit<TimelineInput, 'projectId'>) => Promise<void>
}

interface FormState {
  time: string
  location: string
  characters: string
  premise: string
  process: string
  outcome: string
  narrativeMode: string
  emotionStage: string
  notes: string
  sortOrder: string
}

const empty = (sortOrder: number): FormState => ({
  time: '',
  location: '',
  characters: '',
  premise: '',
  process: '',
  outcome: '',
  narrativeMode: '',
  emotionStage: '',
  notes: '',
  sortOrder: String(sortOrder),
})

export default function TimelineFormModal({
  open,
  entry,
  defaultSortOrder,
  onClose,
  onSubmit,
}: TimelineFormModalProps) {
  const [form, setForm] = useState<FormState>(empty(0))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (entry) {
      setForm({
        time: entry.time ?? '',
        location: entry.location ?? '',
        characters: entry.characters ?? '',
        premise: entry.premise ?? '',
        process: entry.process ?? '',
        outcome: entry.outcome ?? '',
        narrativeMode: entry.narrativeMode ?? '',
        emotionStage: entry.emotionStage ?? '',
        notes: entry.notes ?? '',
        sortOrder: String(entry.sortOrder ?? 0),
      })
    } else {
      setForm(empty(defaultSortOrder))
    }
  }, [open, entry, defaultSortOrder])

  if (!open) return null

  const set = (key: keyof FormState, value: string) => setForm(prev => ({ ...prev, [key]: value }))

  const valid = form.time.trim() && form.location.trim() && form.characters.trim()

  const handleSubmit = async () => {
    if (!valid) return
    setSaving(true)
    try {
      const parsedSort = parseInt(form.sortOrder, 10)
      await onSubmit({
        time: form.time.trim(),
        location: form.location.trim(),
        characters: form.characters.trim(),
        premise: form.premise || null,
        process: form.process || null,
        outcome: form.outcome || null,
        narrativeMode: form.narrativeMode || null,
        emotionStage: form.emotionStage || null,
        notes: form.notes || null,
        sortOrder: Number.isNaN(parsedSort) ? defaultSortOrder : parsedSort,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const inputCls =
    'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white'

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{entry ? '编辑故事线条目' : '新增故事线条目'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <IconClose size={20} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                时间 <span className="text-red-500">*</span>
              </label>
              <input className={inputCls} value={form.time} onChange={e => set('time', e.target.value)} placeholder="如：第一天清晨" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                地点 <span className="text-red-500">*</span>
              </label>
              <input className={inputCls} value={form.location} onChange={e => set('location', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">排序</label>
              <input className={inputCls} type="number" value={form.sortOrder} onChange={e => set('sortOrder', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              涉及人物及当下关系 <span className="text-red-500">*</span>
            </label>
            <input className={inputCls} value={form.characters} onChange={e => set('characters', e.target.value)} placeholder="如：林小满（与陆沉初识，敌对）" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">叙事方式</label>
              <input className={inputCls} value={form.narrativeMode} onChange={e => set('narrativeMode', e.target.value)} placeholder="如：顺叙 / 倒叙 / 插叙" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">情绪阶段</label>
              <input className={inputCls} value={form.emotionStage} onChange={e => set('emotionStage', e.target.value)} placeholder="如：铺垫 / 高潮 / 回落" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">起因</label>
            <textarea className={inputCls} rows={2} value={form.premise} onChange={e => set('premise', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">过程</label>
            <textarea className={inputCls} rows={2} value={form.process} onChange={e => set('process', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">结果</label>
            <textarea className={inputCls} rows={2} value={form.outcome} onChange={e => set('outcome', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea className={inputCls} rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !valid}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
