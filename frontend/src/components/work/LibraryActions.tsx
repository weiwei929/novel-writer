/**
 * 文集库操作栏 — 0608 §2
 *
 * 文集库部门操作：
 *   reviewed（待处理）: 归入文集(→archived) | 📂 文件暂存
 *   archived（已完成）: 导出 | 📂 文件暂存
 */

import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconDownload, IconCheck } from '../ui/icons'
import { projectsApi, type Project } from '../../services/api'
import { useNotifications } from '../../hooks/useNotifications'

interface LibraryActionsProps {
  project: Project
  workArea: 'pending' | 'completed'
  onRefresh: () => Promise<void>
  onOpenLibraryPicker: () => void
}

export default function LibraryActions({
  project,
  workArea,
  onRefresh,
  onOpenLibraryPicker,
}: LibraryActionsProps) {
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

  // 归档：reviewed → archived
  const handleArchive = () =>
    doAction('归入文集', () => projectsApi.transition(project.id, 'archived'))

  // 软暂存
  const handleSoftShelve = () =>
    doAction('放入文件暂存', () => projectsApi.softShelve(project.id), () =>
      navigate('/library')
    )

  const handleExport = async () => {
    try {
      const blob = await projectsApi.exportProject(project.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${project.title}.md`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      notifySuccess('导出成功', '作品已下载')
    } catch {
      notifyError('导出失败', '无法导出作品')
    }
  }

  const disabled = loading

  if (workArea === 'pending') {
    return (
      <>
        <button
          onClick={onOpenLibraryPicker}
          disabled={disabled}
          className="px-3 py-1.5 text-sm border border-emerald-200 text-emerald-800 rounded-lg hover:bg-emerald-50 disabled:opacity-50"
        >
          归入文集
        </button>
        <button
          onClick={handleArchive}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium disabled:opacity-50"
        >
          <IconCheck size={14} />
          确认归档
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

  // archived — 已完成
  return (
    <>
      <button
        onClick={handleExport}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-green-200 text-green-700 rounded-lg hover:bg-green-50 text-sm disabled:opacity-50"
      >
        <IconDownload size={14} />
        导出
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
