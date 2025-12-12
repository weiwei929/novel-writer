/**
 * HTTP客户端配置
 * 自动处理认证token和错误重试
 */

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios'

// 创建axios实例
const api: AxiosInstance = axios.create({
  baseURL: 'http://localhost:5000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器 - 自动添加认证token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 获取保存的认证token
    const token = localStorage.getItem('novel_auth_token')

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 添加请求时间戳用于调试
    if (config.headers) {
      config.headers['X-Request-Time'] = new Date().toISOString()
    }

    console.log('🌐 API请求:', config.method?.toUpperCase(), config.url)
    return config
  },
  error => {
    console.error('❌ 请求配置错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理认证失败和重试
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(
      '✅ API响应:',
      response.config.method?.toUpperCase(),
      response.config.url,
      response.status
    )
    return response
  },
  async error => {
    const { config, response } = error

    console.error('❌ API错误:', config?.method?.toUpperCase(), config?.url, response?.status)

    // 处理认证失败
    if (response?.status === 401) {
      const errorData = response.data

      // 如果需要认证，清除无效token并提示用户重新登录
      if (errorData?.requireAuth) {
        localStorage.removeItem('novel_auth_token')

        // 如果不是登录页面，提示用户重新认证
        if (!config?.url?.includes('/auth/')) {
          // 可以在这里触发全局认证状态更新
          window.dispatchEvent(
            new CustomEvent('auth:required', {
              detail: { message: errorData.error?.message || '需要重新认证' },
            })
          )
        }
      }
    }

    // 处理网络错误
    if (error.code === 'ECONNREFUSED' || error.code === 'NETWORK_ERROR') {
      console.error('🌐 网络连接失败，请检查后端服务是否启动')

      // 触发全局网络错误事件
      window.dispatchEvent(
        new CustomEvent('network:error', {
          detail: {
            message: '无法连接到服务器，请检查后端服务是否启动',
            code: error.code,
          },
        })
      )
    }

    return Promise.reject(error)
  }
)

// 封装的请求方法
export const httpClient = {
  get: <T = any>(url: string, config?: AxiosRequestConfig) => api.get<T>(url, config),

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    api.post<T>(url, data, config),

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    api.put<T>(url, data, config),

  delete: <T = any>(url: string, config?: AxiosRequestConfig) => api.delete<T>(url, config),

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    api.patch<T>(url, data, config),
}

// 添加认证相关的便捷方法
export const authClient = {
  /**
   * 登录
   */
  login: async (password: string) => {
    const response = await api.post('/auth/login', { password })

    if (response.data.success && response.data.data.sessionId) {
      localStorage.setItem('novel_auth_token', response.data.data.sessionId)
    }

    return response.data
  },

  /**
   * 登出
   */
  logout: async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      localStorage.removeItem('novel_auth_token')
    }
  },

  /**
   * 获取认证状态
   */
  getStatus: async () => {
    const response = await api.get('/auth/status')
    return response.data
  },

  /**
   * 检查是否已认证
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('novel_auth_token')
  },
}

export default api
