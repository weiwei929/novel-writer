import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { WorldCharacter, CharacterInput } from '../../services/api'

export const ROLE_TYPE_OPTIONS = ['主角一号', '主角二号', '重要配角', '普通配角', '龙套']

interface CharacterFormModalProps {
  open: boolean
  character: WorldCharacter | null
  onClose: () => void
  onSubmit: (data: Omit<CharacterInput, 'projectId'>) => Promise<void>
}

interface FormState {
  name: string
  gender: string
  age: string
  identity: string
  appearance: string
  personality: string
  interests: string
  roleType: string
  experience: string
  keyRelations: string
  catchphrase: string
}

const EMPTY: FormState = {
  name: '',
  gender: '',
  age: '',
  identity: '',
  appearance: '',
  personality: '',
  interests: '',
  roleType: '',
  experience: '',
  keyRelations: '',
  catchphrase: '',
}

export default function CharacterFormModal({
  open,
  character,
  onClose,
  onSubmit,
}: CharacterFormModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (character) {
      setForm({
        name: character.name ?? '',
        gender: character.gender ?? '',
        age: character.age ?? '',
        identity: character.identity ?? '',
        appearance: character.appearance ?? '',
        personality: character.personality ?? '',
        interests: character.interests ?? '',
        roleType: character.roleType ?? '',
        experience: character.experience ?? '',
        keyRelations: character.keyRelations ?? '',
        catchphrase: character.catchphrase ?? '',
      })
    } else {
      setForm(EMPTY)
    }
  }, [open, character])

  if (!open) return null

  const set = (key: keyof FormState, value: string) => setForm(prev => ({ ...prev, [key]: value }))

  const handleSubmit = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await onSubmit({
        name: form.name.trim(),
        gender: form.gender || null,
        age: form.age || null,
        identity: form.identity || null,
        appearance: form.appearance || null,
        personality: form.personality || null,
        interests: form.interests || null,
        roleType: form.roleType || null,
        experience: form.experience || null,
        keyRelations: form.keyRelations || null,
        catchphrase: form.catchphrase || null,
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
          <h2 className="text-lg font-bold text-gray-900">
            {character ? '编辑人物' : '新增人物'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                名称 <span className="text-red-500">*</span>
              </label>
              <input
                className={inputCls}
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="角色名称"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">角色定位</label>
              <select className={inputCls} value={form.roleType} onChange={e => set('roleType', e.target.value)}>
                <option value="">未设定</option>
                {ROLE_TYPE_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">性别</label>
              <input className={inputCls} value={form.gender} onChange={e => set('gender', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">年龄</label>
              <input className={inputCls} value={form.age} onChange={e => set('age', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">身份/职业</label>
              <input className={inputCls} value={form.identity} onChange={e => set('identity', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">兴趣</label>
              <input className={inputCls} value={form.interests} onChange={e => set('interests', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">外貌</label>
            <textarea className={inputCls} rows={2} value={form.appearance} onChange={e => set('appearance', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">性格（含特点/缺陷）</label>
            <textarea className={inputCls} rows={2} value={form.personality} onChange={e => set('personality', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">个人经历（选填）</label>
            <textarea className={inputCls} rows={2} value={form.experience} onChange={e => set('experience', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">关键关系（选填）</label>
            <textarea className={inputCls} rows={2} value={form.keyRelations} onChange={e => set('keyRelations', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">口头禅（选填）</label>
            <input className={inputCls} value={form.catchphrase} onChange={e => set('catchphrase', e.target.value)} />
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
            disabled={saving || !form.name.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
