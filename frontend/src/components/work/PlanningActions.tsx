/**
 * 企划课操作栏 — 0608 §2
 *
 * 企划课部门操作：
 *   planning（进行中）: 管理章节规划 | 编辑元数据 | 确认企划完成 | 📂 文件暂存
 *   planned（已完成）:  管理章节规划 | 退回设定中 | 📂 文件暂存
 *
 * 冻结项清理：
 *   - 不使用 StageTransitionModal（F-004/F-010）
 *   - 不使用跨部门退回（F-001）
 *   - "确认企划完成" 替代 "正式立项"（F-007）
 *   - 📂 调用 softShelve 而非 softDelete（deletedAt 语义）
 */

import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconList, IconRefresh, IconDownload } from '../ui/icons'
import { projectsApi, type Project } from '../../services/api'
import { confirmPlanningWithReadiness } from '../../services/planningConfirm'
import { useNotifications } from '../../hooks/useNotifications'

interface PlanningActionsProps {
  project: Project
  workArea: 'active' | 'completed'
  onRefresh: () => Promise<void>
  onShowPlanning: () => void
  onShowMetadataEditor: () => void
}

export default function PlanningActions({
  project,
  workArea,
  onRefresh,
  onShowPlanning,
  onShowMetadataEditor,
}: PlanningActionsProps) {
  const navigate = useNavigate()
  const { success: notifySuccess, error: notifyError } = useNotifications()
  const [loading, setLoading] = useState(false)

  const doAction = useCallback(
    async (label: string, action: () => Promise<unknown>, onSuccess?: () => void) => {
      if (!window.confirm(`确定要${label}吗？`)) return
      try {
        setLoading(true)
        await action()
        notifySuccess(`已${label}`)
        await onRefresh()
        onSuccess?.()
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : `无法${label}`
        notifyError('操作失败', message)
      } finally {
        setLoading(false)
      }
    },
    [onRefresh, notifySuccess, notifyError]
  )

  // 企划完成 → 进入 planned
  const handleConfirmPlanned = () =>
    doAction('确认企划完成', () => confirmPlanningWithReadiness(project))

  // 退回设定中：planned → planning
  const handleBackToPlanning = () =>
    doAction('退回设定中', () => projectsApi.transition(project.id, 'planning'))

  // 📂 文件暂存 → 调用 softShelve（deletedAt 语义，非旧 shelve 状态）
  const handleSoftShelve = () =>
    doAction('放入文件暂存', () => projectsApi.softShelve(project.id), () =>
      navigate('/')
    )

  const disabled = loading

  if (workArea === 'active') {
    return (
      <>
        <button
          onClick={onShowPlanning}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm disabled:opacity-50"
        >
          <IconList size={14} />
          管理章节规划
        </button>
        <button
          onClick={onShowMetadataEditor}
          disabled={disabled}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          编辑元数据
        </button>
        <button
          onClick={handleConfirmPlanned}
          disabled={disabled}
          className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
        >
          确认企划完成
        </button>
        <button
          onClick={handleSoftShelve}
          disabled={disabled}
          className="px-3 py-1.5 text-sm border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-50 disabled:opacity-50"
        >
          <IconDownload size={14} className="inline mr-1" />
          放入文件暂存
        </button>
      </>
    )
  }

  // planned — 已完成
  return (
    <>
      <button
        onClick={onShowPlanning}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm disabled:opacity-50"
      >
        <IconList size={14} />
        管理章节规划
      </button>
      <button
        onClick={handleBackToPlanning}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm disabled:opacity-50"
      >
        <IconRefresh size={14} />
        退回设定中
      </button>
      <button
        onClick={handleSoftShelve}
        disabled={disabled}
        className="px-3 py-1.5 text-sm border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-50 disabled:opacity-50"
      >
        <IconDownload size={14} className="inline mr-1" />
        放入文件暂存
      </button>
    </>
  )
}
