import { IconInfo } from '../ui/icons'
import type { ReactNode } from 'react'

interface PanelStatusProps {
  loading: boolean
  error: string | null
  empty: boolean
  icon: ReactNode
  emptyText: string
  children: ReactNode
}

export default function PanelStatus({
  loading,
  error,
  empty,
  icon,
  emptyText,
  children,
}: PanelStatusProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-sm">加载中...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-red-400">
        <IconInfo size={48} className="mb-3 opacity-40" />
        <p className="text-sm text-red-500">{error}</p>
      </div>
    )
  }

  if (empty) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <div className="mb-3">{icon}</div>
        <p className="text-sm">{emptyText}</p>
      </div>
    )
  }

  return <>{children}</>
}
