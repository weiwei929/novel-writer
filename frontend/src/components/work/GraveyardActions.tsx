/**
 * 墓园操作栏 — 0608 文件暂存池
 *
 * 墓园（deletedAt != null）操作：
 *   还原（清 deletedAt）| 彻底删除
 *
 * 冻结项清理：不再用 shelved status，改用 deletedAt 机制（F-003）
 */

import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconRefresh, IconDelete } from '../ui/icons'
import { projectsApi, type Project } from '../../services/api'
import { useNotifications } from '../../hooks/useNotifications'

interface GraveyardActionsProps {
  project: Project
  onRefresh: () => Promise<void>
}

export default function GraveyardActions({
  project,
  onRefresh,
}: GraveyardActionsProps) {
  const navigate = useNavigate()
  const { success: notifySuccess, error: notifyError } = useNotifications()
  const [loading, setLoading] = useState(false)

  // 还原：清 deletedAt → 回到原 status 队列
  const handleRestore = useCallback(async () => {
    if (!window.confirm(`确定要还原「${project.title}」吗？`)) return
    try {
      setLoading(true)
      await projectsApi.unshelve(project.id)
      notifySuccess('已还原', '作品已从暂存移出')
      await onRefresh()
    } catch {
      notifyError('还原失败', '无法还原作品')
    } finally {
      setLoading(false)
    }
  }, [project, onRefresh, notifySuccess, notifyError])

  // 彻底删除
  const handleDelete = useCallback(async () => {
    if (
      !window.confirm(
        `确定要彻底删除「${project.title}」吗？此操作不可撤销。`
      )
    )
      return
    try {
      setLoading(true)
      await projectsApi.delete(project.id)
      notifySuccess('已删除', '作品已彻底删除')
      navigate('/')
    } catch {
      notifyError('删除失败', '无法删除作品')
    } finally {
      setLoading(false)
    }
  }, [project, navigate, notifySuccess, notifyError])

  const disabled = loading

  return (
    <>
      <button
        onClick={handleRestore}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 text-sm disabled:opacity-50"
      >
        <IconRefresh size={14} />
        还原
      </button>
      <button
        onClick={handleDelete}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm disabled:opacity-50"
      >
        <IconDelete size={14} />
        彻底删除
      </button>
    </>
  )
}
