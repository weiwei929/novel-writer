import { useEffect, useMemo, useState } from 'react'
import { IconClose } from '../ui/icons'
import { PROJECT_STATUS_LABEL, type Project, type ProjectStatus } from '../../services/api'

export type StageTransitionAction = 'advance' | 'retreat' | 'shelve'

interface StageTransitionModalProps {
  open: boolean
  project: Project
  onConfirm: (action: StageTransitionAction, note?: string) => void
  onCancel: () => void
}

const STAGE_LABEL: Record<ProjectStatus, string> = {
  draft: '创意组',
  planning: '企划课',
  writing: '创作室',
  reviewing: '编审部',
  completed: '已完成',
  archived: '已归档',
  shelved: '作品暂存',
}

const NEXT_STATUS: Partial<Record<ProjectStatus, ProjectStatus>> = {
  draft: 'planning',
  planning: 'writing',
  writing: 'reviewing',
  reviewing: 'completed',
}

const PREV_STATUS: Partial<Record<ProjectStatus, ProjectStatus>> = {
  planning: 'draft',
  writing: 'planning',
  reviewing: 'writing',
  completed: 'reviewing',
}

type OptionId = StageTransitionAction | 'cancel'

interface TransitionOption {
  id: OptionId
  label: string
  action?: StageTransitionAction
}

function buildOptions(status: ProjectStatus): TransitionOption[] {
  const options: TransitionOption[] = []
  const next = NEXT_STATUS[status]
  const prev = PREV_STATUS[status]

  if (next) {
    options.push({
      id: 'advance',
      action: 'advance',
      label: `继续推进 → ${STAGE_LABEL[next]}`,
    })
  }
  if (prev) {
    options.push({
      id: 'retreat',
      action: 'retreat',
      label: `回退到${STAGE_LABEL[prev]}`,
    })
  }
  options.push({
    id: 'shelve',
    action: 'shelve',
    label: '移入暂存',
  })
  options.push({ id: 'cancel', label: '取消' })
  return options
}

export default function StageTransitionModal({
  open,
  project,
  onConfirm,
  onCancel,
}: StageTransitionModalProps) {
  const options = useMemo(() => buildOptions(project.status), [project.status])
  const defaultSelection = options.find(o => o.action === 'advance')?.id ?? options[0]?.id ?? 'cancel'
  const [selected, setSelected] = useState<OptionId>(defaultSelection)
  const [note, setNote] = useState('')

  useEffect(() => {
    if (open) {
      setSelected(defaultSelection)
      setNote('')
    }
  }, [open, defaultSelection])

  if (!open) return null

  const statusLabel = PROJECT_STATUS_LABEL[project.status] ?? project.status
  const selectedOption = options.find(o => o.id === selected)

  const handleConfirm = () => {
    if (!selectedOption?.action) {
      onCancel()
      return
    }
    onConfirm(selectedOption.action, note.trim() || undefined)
  }

  const next = NEXT_STATUS[project.status]
  const modalTitle = next
    ? `将作品《${project.title}》从 [${statusLabel}] 推进到 [${STAGE_LABEL[next]}]`
    : `阶段管理 — 《${project.title}》`

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-gray-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">推进作品</h2>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 hover:bg-gray-100 rounded text-gray-400"
          >
            <IconClose size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">{modalTitle}</p>

          <fieldset className="space-y-2">
            <legend className="text-xs font-medium text-gray-500 mb-1">决策选项</legend>
            {options.map(option => (
              <label
                key={option.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm ${
                  selected === option.id
                    ? 'border-blue-300 bg-blue-50 text-blue-900'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <input
                  type="radio"
                  name="stage-action"
                  className="text-blue-600"
                  checked={selected === option.id}
                  onChange={() => setSelected(option.id)}
                />
                {option.label}
              </label>
            ))}
          </fieldset>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">备注（可选）</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="过渡说明…"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={selected === 'cancel' || !selectedOption?.action}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  )
}

export const nextStatusForTransition: Partial<Record<ProjectStatus, ProjectStatus>> = NEXT_STATUS
export const prevStatusForTransition: Partial<Record<ProjectStatus, ProjectStatus>> = PREV_STATUS
