/**
 * 创作室操作栏 — 0608 §2
 *
 * 创作室部门操作：
 *   planned（待处理）: 开始写作 → startWriting
 *   writing（进行中）: 进入创作室 | 管理章节规划 | 完成写作(mark-written) | 📂 文件暂存
 *   written（已完成）: 管理章节规划 | 提交审阅(submit-review) | 退回重写(undo-written) | 📂 文件暂存
 *
 * 冻结项清理：
 *   - 不放行≠开始写作（F-008/F-009）
 *   - 不使用 StageTransitionModal（F-010）
 *   - 不使用跨部门退回（F-001）：undo-written 是部门内退回 ✅
 */

import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconArrowRight, IconList, IconRefresh, IconDownload, IconCheck } from '../ui/icons'
import { projectsApi, type Project, type Chapter } from '../../services/api'
import { useNotifications } from '../../hooks/useNotifications'

interface StudioActionsProps {
  project: Project
  workArea: 'pending' | 'active' | 'completed'
  chapters: Chapter[]
  onRefresh: () => Promise<void>
  onShowPlanning: () => void
}

export default function StudioActions({
  project,
  workArea,
  chapters,
  onRefresh,
  onShowPlanning,
}: StudioActionsProps) {
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

  // 开始写作：planned → writing，然后跳转编辑器
  const handleStartWriting = () =>
    doAction('开始写作', () => projectsApi.startWriting(project.id), () => {
      const sorted = [...chapters].sort((a, b) => a.order - b.order)
      const latest =
        sorted.length > 0
          ? sorted.sort(
              (a, b) =>
                new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            )[0]
          : null
      if (latest) {
        navigate(`/writing/${project.id}/${latest.id}`)
      } else {
        notifyError('无法进入创作室', '请先在企划课中创建章节规划')
      }
    })

  // 进入创作室（已在 writing 状态）
  const handleEnterWriting = () => {
    const sorted = [...chapters].sort((a, b) => a.order - b.order)
    const latest =
      sorted.length > 0
        ? sorted.sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )[0]
        : null
    if (latest) {
      navigate(`/writing/${project.id}/${latest.id}`)
    } else {
      notifyError('无法进入创作室', '请先创建章节')
    }
  }

  // 完成写作：writing → written
  const handleMarkWritten = () =>
    doAction('完成写作', () => projectsApi.markWritten(project.id))

  // 提交审阅：written → reviewing
  const handleSubmitReview = () =>
    doAction('提交审阅', () => projectsApi.submitReview(project.id))

  // 退回重写：written → writing（部门内退回 ✅）
  const handleUndoWritten = () =>
    doAction('退回重写', () => projectsApi.undoWritten(project.id))

  // 软暂存
  const handleSoftShelve = () =>
    doAction('放入文件暂存', () => projectsApi.softShelve(project.id), () =>
      navigate('/writing/projects')
    )

  const disabled = loading

  if (workArea === 'pending') {
    // planned — 待处理（刚从企划课放行过来）
    return (
      <button
        onClick={handleStartWriting}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
      >
        <IconArrowRight size={14} />
        开始写作
      </button>
    )
  }

  if (workArea === 'active') {
    // writing — 进行中
    return (
      <>
        <button
          onClick={handleEnterWriting}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
        >
          <IconArrowRight size={14} />
          进入创作室
        </button>
        <button
          onClick={onShowPlanning}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm disabled:opacity-50"
        >
          <IconList size={14} />
          管理章节规划
        </button>
        <button
          onClick={handleMarkWritten}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium disabled:opacity-50"
        >
          <IconCheck size={14} />
          完成写作
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

  // written — 已完成
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
        onClick={handleSubmitReview}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium disabled:opacity-50"
      >
        <IconArrowRight size={14} />
        提交审阅
      </button>
      <button
        onClick={handleUndoWritten}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm disabled:opacity-50"
      >
        <IconRefresh size={14} />
        退回重写
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
