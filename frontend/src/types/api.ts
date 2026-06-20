// 前端API类型定义和响应处理工具

/**
 * API响应格式（与后端保持一致）
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  metadata?: {
    timestamp: string
    version: string
    [key: string]: any
  }
}

/**
 * API错误类
 */
export class ApiError extends Error {
  public code: string
  public details?: any

  constructor(code: string, message: string, details?: any) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.details = details
  }
}

/**
 * 统一处理API响应
 */
export function handleApiResponse<T>(response: any): T {
  // 检查响应是否符合ApiResponse格式
  if (typeof response === 'object' && 'success' in response) {
    if (response.success) {
      return response.data as T
    } else {
      const error = response.error || { code: 'UNKNOWN_ERROR', message: '未知错误' }
      throw new ApiError(error.code, error.message, error.details)
    }
  }

  // 兼容旧格式，直接返回数据
  return response as T
}

/**
 * 统一处理API错误
 */
export function handleApiError(error: any): Promise<never> {
  console.error('API Error:', error)

  if (error instanceof ApiError) {
    return Promise.reject(error)
  }

  // 处理网络错误
  if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED' || !error.response) {
    return Promise.reject(new ApiError('NETWORK_ERROR', '网络连接失败，请检查网络设置'))
  }

  // 处理HTTP错误
  if (error.response) {
    const { status, data } = error.response

    // 如果后端返回的是 { success: false, error: "错误信息" } 格式（扁平字符串）
    if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') {
      return Promise.reject(
        new ApiError(
          `HTTP_${status}`,
          data.error,
          { status, data }
        )
      )
    }

    // 如果后端返回的是ApiResponse格式
    if (data && typeof data === 'object' && 'error' in data) {
      return Promise.reject(
        new ApiError(
          data.error.code || 'HTTP_ERROR',
          data.error.message || `HTTP ${status} 错误`,
          data.error.details
        )
      )
    }

    // 处理标准HTTP错误
    const httpErrors: Record<number, string> = {
      400: '请求参数错误',
      401: '未授权访问',
      403: '权限不足',
      404: '资源不存在',
      409: '资源冲突',
      500: '服务器内部错误',
      502: '网关错误',
      503: '服务不可用',
    }

    const message = httpErrors[status] || `HTTP ${status} 错误`
    return Promise.reject(new ApiError(`HTTP_${status}`, message, { status, data }))
  }

  // 处理其他错误
  return Promise.reject(new ApiError('UNKNOWN_ERROR', error.message || '未知错误发生'))
}

function isUnauthorizedError(code: unknown, message: string): boolean {
  return (
    code === 401 ||
    code === '401' ||
    code === 'HTTP_401' ||
    code === 'UNAUTHORIZED' ||
    message.includes('未认证') ||
    message.includes('未授权') ||
    message.includes('未登录')
  )
}

function isNetworkUnavailableError(code: unknown, hasResponse: boolean): boolean {
  return (
    !hasResponse &&
    (code === 'ERR_NETWORK' ||
      code === 'ECONNABORTED' ||
      code === 'NETWORK_ERROR' ||
      code === 'ETIMEDOUT')
  )
}

/** 将 API 异常转为面向用户的简短说明 */
export function describeApiErrorMessage(error: unknown, fallback = '操作失败，请稍后重试'): string {
  if (error instanceof ApiError) {
    if (isNetworkUnavailableError(error.code, false)) {
      return '无法连接后端服务，请确认后端已启动（默认端口 5000）'
    }
    if (isUnauthorizedError(error.code, error.message)) {
      return '登录已失效或未登录，请刷新页面重新输入密码'
    }
    if (error.code === 'HTTP_502' || error.code === 'HTTP_503') {
      return '后端服务暂时不可用，请稍后重试'
    }
    if (error.code === 'HTTP_500') {
      return '服务器处理出错，请查看后端日志'
    }
    return `${fallback}：${error.message}`
  }

  if (error && typeof error === 'object') {
    const err = error as {
      code?: string
      message?: string
      response?: { status?: number; data?: { error?: { message?: string } } }
    }

    const status = err.response?.status
    const backendMessage = err.response?.data?.error?.message ?? err.message ?? ''

    if (isNetworkUnavailableError(err.code, !err.response)) {
      return '无法连接后端服务，请确认后端已启动（默认端口 5000）'
    }
    if (status === 401 || isUnauthorizedError(status, backendMessage)) {
      return '登录已失效或未登录，请刷新页面重新输入密码'
    }
    if (status === 502 || status === 503) {
      return '后端服务暂时不可用，请稍后重试'
    }
    if (status === 500) {
      return '服务器处理出错，请查看后端日志'
    }
    if (backendMessage) {
      return `${fallback}：${backendMessage}`
    }
  }

  return fallback
}

/**
 * API请求配置
 */
export interface ApiRequestConfig {
  timeout?: number
  retries?: number
  retryDelay?: number
}

/**
 * 默认API配置
 */
export const DEFAULT_API_CONFIG: ApiRequestConfig = {
  timeout: 10000,
  retries: 3,
  retryDelay: 1000,
}

/**
 * 重试机制包装器
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: ApiRequestConfig = DEFAULT_API_CONFIG
): Promise<T> {
  const { retries = 3, retryDelay = 1000 } = config
  let lastError: Error

  for (let i = 0; i <= retries; i++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error

      // 如果是最后一次重试，直接抛出错误
      if (i === retries) {
        break
      }

      // 某些错误不需要重试
      if (
        error instanceof ApiError &&
        ['VALIDATION_ERROR', 'UNAUTHORIZED', 'FORBIDDEN', 'NOT_FOUND'].includes(error.code)
      ) {
        break
      }

      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, retryDelay))
    }
  }

  throw lastError!
}

/**
 * 创建统一的API客户端
 */
export function createApiClient(baseURL: string, config?: ApiRequestConfig) {
  const finalConfig = { ...DEFAULT_API_CONFIG, ...config }

  return {
    async request<T>(method: string, url: string, data?: any): Promise<T> {
      return withRetry(async () => {
        const response = await fetch(`${baseURL}${url}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: data ? JSON.stringify(data) : undefined,
          signal: AbortSignal.timeout(finalConfig.timeout!),
        })

        const responseData = await response.json()

        if (!response.ok) {
          handleApiError({
            response: {
              status: response.status,
              data: responseData,
            },
          })
        }

        return handleApiResponse<T>(responseData)
      }, finalConfig)
    },

    get<T>(url: string): Promise<T> {
      return this.request<T>('GET', url)
    },

    post<T>(url: string, data?: any): Promise<T> {
      return this.request<T>('POST', url, data)
    },

    put<T>(url: string, data?: any): Promise<T> {
      return this.request<T>('PUT', url, data)
    },

    delete<T>(url: string): Promise<T> {
      return this.request<T>('DELETE', url)
    },
  }
}
