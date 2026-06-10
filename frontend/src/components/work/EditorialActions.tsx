/**
 * 编审部操作栏 — 0608 §2
 *
 * 编审部部门操作：
 *   written（待处理）: 开始审阅 → written→reviewing
 *   reviewing（进行中）: 进入审阅 | 确认审阅完成(reviewing→reviewed) | 📂 文件暂存
 *   reviewed（已完成）: 查看审阅 | 退回审阅中(reviewed→reviewing) | 📂 文件暂存
 *
 * 冻结项清理：reviewing→reviewed 替代 reviewing→completed（F-012）
 */

import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconArrowRight, IconRefresh, IconDownload, IconCheck, IconList } from '../ui/icons'
import { projectsApi, type Project } from '../../services/api'
import { useNotifications } from '../../hooks/useNotifications'

interface EditorialActionsProps {
  project: Project
  workArea: 'pending' | 'active' | 'completed'
  onRefresh: () => Promise<void>
}

export default function EditorialActions({
  project,
  workArea,
  onRefresh,
}: EditorialActionsProps) {
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
      } catch {
        notifyError('操作失败', `无法${label}`)
      } finally {
        setLoading(false)
      }
    },
    [onRefresh, notifySuccess, notifyError]
  )

  // 开始审阅：written → reviewing
  const handleStartReview = () =>
    doAction('开始审阅', () => projectsApi.transition(project.id, 'reviewing'))

  // 进入审阅详情
  const handleGoToReview = () =>
    navigate(`/review/${project.id}`)

  // 确认审阅完成：reviewing → reviewed（不是 completed！F-012）
  const handleCompleteReview = () =>
    doAction('确认审阅完成', () => projectsApi.transition(project.id, 'reviewed'))

  // 退回审阅中：reviewed → reviewing（部门内退回 ✅）
  const handleBackToReviewing = () =>
    doAction('退回审阅中', () => projectsApi.transition(project.id, 'reviewing'))

  // 软暂存
  const handleSoftShelve = () =>
    doAction('放入文件暂存', () => projectsApi.softShelve(project.id), () =>
      navigate('/')
    )

  const disabled = loading

  if (workArea === 'pending') {
    // written — 待处理
    return (
      <button
        onClick={handleStartReview}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium disabled:opacity-50"
      >
        <IconArrowRight size={14} />
        开始审阅
      </button>
    )
  }

  if (workArea === 'active') {
    // reviewing — 进行中
    return (
      <>
        <button
          onClick={handleGoToReview}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium disabled:opacity-50"
        >
          <IconList size={14} />
          进入审阅
        </button>
        <button
          onClick={handleCompleteReview}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium disabled:opacity-50"
        >
          <IconCheck size={14} />
          确认审阅完成
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

  // reviewed — 已完成
  return (
    <>
      <button
        onClick={handleBackToReviewing}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm disabled:opacity-50"
      >
        <IconRefresh size={14} />
        退回审阅中
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
