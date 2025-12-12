import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

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

// UI状态接口
interface UIState {
  notifications: Notification[]
  loading: LoadingState
  theme: 'light' | 'dark' | 'auto'
  sidebarCollapsed: boolean
  mobileMenuOpen: boolean
}

// Actions接口
interface UIActions {
  // 通知相关
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void

  // 加载状态相关
  setLoading: (loading: LoadingState) => void
  clearLoading: () => void

  // 主题相关
  setTheme: (theme: 'light' | 'dark' | 'auto') => void

  // UI状态相关
  toggleSidebar: () => void
  toggleMobileMenu: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setMobileMenuOpen: (open: boolean) => void
}

// 组合状态和Actions
type UIStore = UIState & UIActions

// 初始状态
const getInitialTheme = (): 'light' | 'dark' | 'auto' => {
  try {
    const saved = localStorage.getItem('theme')
    if (saved && ['light', 'dark', 'auto'].includes(saved)) {
      return saved as 'light' | 'dark' | 'auto'
    }
  } catch {
    // localStorage 可能不可用
  }
  return 'auto'
}

const initialState: UIState = {
  notifications: [],
  loading: { isLoading: false },
  theme: getInitialTheme(),
  sidebarCollapsed: false,
  mobileMenuOpen: false,
}

// 创建 Store
export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // 通知相关 Actions
        addNotification: notification => {
          const id = `notification-${Date.now()}-${Math.random()}`
          const newNotification: Notification = {
            ...notification,
            id,
            duration: notification.duration ?? 5000,
          }

          set(
            state => ({
              notifications: [...state.notifications, newNotification],
            }),
            false,
            'addNotification'
          )

          // 自动移除通知
          const duration = newNotification.duration ?? 0
          if (duration > 0) {
            setTimeout(() => {
              get().removeNotification(id)
            }, duration)
          }
        },

        removeNotification: id => {
          set(
            state => ({
              notifications: state.notifications.filter(n => n.id !== id),
            }),
            false,
            'removeNotification'
          )
        },

        clearNotifications: () => {
          set({ notifications: [] }, false, 'clearNotifications')
        },

        // 加载状态相关 Actions
        setLoading: loading => {
          set({ loading }, false, 'setLoading')
        },

        clearLoading: () => {
          set({ loading: { isLoading: false } }, false, 'clearLoading')
        },

        // 主题相关 Actions
        setTheme: theme => {
          set({ theme }, false, 'setTheme')
          try {
            localStorage.setItem('theme', theme)
          } catch {
            // localStorage 可能不可用
          }
        },

        // UI状态相关 Actions
        toggleSidebar: () => {
          set(state => ({ sidebarCollapsed: !state.sidebarCollapsed }), false, 'toggleSidebar')
        },

        toggleMobileMenu: () => {
          set(state => ({ mobileMenuOpen: !state.mobileMenuOpen }), false, 'toggleMobileMenu')
        },

        setSidebarCollapsed: collapsed => {
          set({ sidebarCollapsed: collapsed }, false, 'setSidebarCollapsed')
        },

        setMobileMenuOpen: open => {
          set({ mobileMenuOpen: open }, false, 'setMobileMenuOpen')
        },
      }),
      {
        name: 'ui-storage',
        partialize: state => ({
          theme: state.theme,
          sidebarCollapsed: state.sidebarCollapsed,
        }),
      }
    ),
    { name: 'UIStore' }
  )
)

// Selectors（用于性能优化，避免不必要的重渲染）
export const useNotifications = () => useUIStore(state => state.notifications)
export const useLoading = () => useUIStore(state => state.loading)
export const useTheme = () => useUIStore(state => state.theme)
export const useSidebarCollapsed = () => useUIStore(state => state.sidebarCollapsed)
export const useMobileMenuOpen = () => useUIStore(state => state.mobileMenuOpen)
