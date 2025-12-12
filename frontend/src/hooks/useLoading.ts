/**
 * 加载状态 Hook - 兼容层
 * 提供与旧 UIContext 相同的 API，但使用 Zustand store
 */
import { useUIStore } from '../stores/uiStore'
import { LoadingState } from '../stores/uiStore'

export const useLoading = () => {
  const loading = useUIStore(state => state.loading)
  const setLoadingState = useUIStore(state => state.setLoading)
  const clearLoading = useUIStore(state => state.clearLoading)

  // 兼容旧的 setLoading API (isLoading: boolean, message?: string, progress?: number)
  const setLoading = (isLoading: boolean, message?: string, progress?: number) => {
    if (isLoading) {
      setLoadingState({ isLoading: true, message, progress })
    } else {
      clearLoading()
    }
  }

  // withLoading 方法：包装异步函数，自动管理加载状态
  const withLoading = async <T>(asyncFn: () => Promise<T>, message?: string): Promise<T> => {
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
    loading,
    setLoading,
    clearLoading,
    withLoading,
    isLoading: loading.isLoading,
    message: loading.message,
    progress: loading.progress,
  }
}

export type { LoadingState }
