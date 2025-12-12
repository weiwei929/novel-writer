import React, { createContext, useContext, useReducer, ReactNode } from 'react'

// 通知类型
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  actions?: NotificationAction[]
}

export interface NotificationAction {
  label: string
  onClick: () => void
}

// 加载状态类型
export interface LoadingState {
  isLoading: boolean
  message?: string
  progress?: number
}

// 全局UI状态
interface UIState {
  notifications: Notification[]
  loading: LoadingState
  theme: 'light' | 'dark' | 'auto'
  sidebarCollapsed: boolean
  mobileMenuOpen: boolean
}

// Actions类型
type UIAction =
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'SET_LOADING'; payload: LoadingState }
  | { type: 'CLEAR_LOADING' }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' | 'auto' }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'TOGGLE_MOBILE_MENU' }

// 初始状态
const initialState: UIState = {
  notifications: [],
  loading: { isLoading: false },
  theme: (() => {
    try {
      return (localStorage.getItem('theme') as 'light' | 'dark' | 'auto') || 'auto'
    } catch {
      return 'auto'
    }
  })(),
  sidebarCollapsed: (() => {
    try {
      return localStorage.getItem('sidebarCollapsed') === 'true'
    } catch {
      return false
    }
  })(),
  mobileMenuOpen: false,
}

// Reducer
const uiReducer = (state: UIState, action: UIAction): UIState => {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      }

    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      }

    case 'CLEAR_NOTIFICATIONS':
      return {
        ...state,
        notifications: [],
      }

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      }

    case 'CLEAR_LOADING':
      return {
        ...state,
        loading: { isLoading: false },
      }

    case 'SET_THEME':
      try {
        localStorage.setItem('theme', action.payload)
      } catch {}
      return {
        ...state,
        theme: action.payload,
      }

    case 'TOGGLE_SIDEBAR':
      const newCollapsedState = !state.sidebarCollapsed
      try {
        localStorage.setItem('sidebarCollapsed', newCollapsedState.toString())
      } catch {}
      return {
        ...state,
        sidebarCollapsed: newCollapsedState,
      }

    case 'TOGGLE_MOBILE_MENU':
      return {
        ...state,
        mobileMenuOpen: !state.mobileMenuOpen,
      }

    default:
      return state
  }
}

// Context
const UIContext = createContext<{
  state: UIState
  dispatch: React.Dispatch<UIAction>
} | null>(null)

// Provider组件
export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(uiReducer, initialState)

  return <UIContext.Provider value={{ state, dispatch }}>{children}</UIContext.Provider>
}

// Hook for using UI context
export const useUI = () => {
  const context = useContext(UIContext)
  if (!context) {
    throw new Error('useUI must be used within a UIProvider')
  }
  return context
}

// 便捷的通知函数
export const useNotifications = () => {
  const { dispatch } = useUI()

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        id,
        duration: 5000, // 默认5秒
        ...notification,
      },
    })
    return id
  }

  const removeNotification = (id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id })
  }

  const success = (title: string, message?: string) => {
    return addNotification({ type: 'success', title, message })
  }

  const error = (title: string, message?: string, actions?: NotificationAction[]) => {
    return addNotification({
      type: 'error',
      title,
      message,
      actions,
      duration: 8000, // 错误消息显示更久
    })
  }

  const warning = (title: string, message?: string) => {
    return addNotification({ type: 'warning', title, message })
  }

  const info = (title: string, message?: string) => {
    return addNotification({ type: 'info', title, message })
  }

  return {
    success,
    error,
    warning,
    info,
    removeNotification,
  }
}

// 加载状态管理Hook
export const useLoading = () => {
  const { dispatch } = useUI()

  const setLoading = (isLoading: boolean, message?: string, progress?: number) => {
    if (isLoading) {
      dispatch({
        type: 'SET_LOADING',
        payload: { isLoading: true, message, progress },
      })
    } else {
      dispatch({ type: 'CLEAR_LOADING' })
    }
  }

  const withLoading = async function <T>(asyncFn: () => Promise<T>, message?: string): Promise<T> {
    setLoading(true, message)
    try {
      const result = await asyncFn()
      setLoading(false)
      return result
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  return {
    setLoading,
    withLoading,
  }
}
