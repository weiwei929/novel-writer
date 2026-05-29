/**
 * 通知 Hook - 兼容层
 * Zustand store 封装 —— 统一状态管理入口
 */
import { useUIStore } from '../stores/uiStore'
import { Notification } from '../stores/uiStore'

export const useNotifications = () => {
  const addNotification = useUIStore(state => state.addNotification)
  const removeNotification = useUIStore(state => state.removeNotification)
  const clearNotifications = useUIStore(state => state.clearNotifications)

  return {
    success: (title: string, message?: string, duration?: number) => {
      addNotification({ type: 'success', title, message, duration })
    },
    error: (title: string, message?: string, duration?: number) => {
      addNotification({ type: 'error', title, message, duration })
    },
    warning: (title: string, message?: string, duration?: number) => {
      addNotification({ type: 'warning', title, message, duration })
    },
    info: (title: string, message?: string, duration?: number) => {
      addNotification({ type: 'info', title, message, duration })
    },
    addNotification,
    removeNotification,
    clearNotifications,
  }
}

export type { Notification }

