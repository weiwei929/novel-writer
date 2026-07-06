/**
 * 通知 Hook - Zustand store 封装，回调引用稳定，避免 useEffect 无限循环
 */
import { useCallback } from 'react'
import { useUIStore, Notification } from '../stores/uiStore'

export const useNotifications = () => {
  const addNotification = useUIStore(state => state.addNotification)
  const removeNotification = useUIStore(state => state.removeNotification)
  const clearNotifications = useUIStore(state => state.clearNotifications)

  const success = useCallback(
    (title: string, message?: string, duration?: number) => {
      addNotification({ type: 'success', title, message, duration })
    },
    [addNotification]
  )

  const error = useCallback(
    (title: string, message?: string, duration?: number) => {
      addNotification({ type: 'error', title, message, duration })
    },
    [addNotification]
  )

  const warning = useCallback(
    (title: string, message?: string, duration?: number) => {
      addNotification({ type: 'warning', title, message, duration })
    },
    [addNotification]
  )

  const info = useCallback(
    (title: string, message?: string, duration?: number) => {
      addNotification({ type: 'info', title, message, duration })
    },
    [addNotification]
  )

  return {
    success,
    error,
    warning,
    info,
    addNotification,
    removeNotification,
    clearNotifications,
  }
}

export type { Notification }
