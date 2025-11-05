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
    
    // 如果后端返回的是ApiResponse格式
    if (data && typeof data === 'object' && 'error' in data) {
      return Promise.reject(new ApiError(
        data.error.code || 'HTTP_ERROR',
        data.error.message || `HTTP ${status} 错误`,
        data.error.details
      ))
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
      503: '服务不可用'
    }
    
    const message = httpErrors[status] || `HTTP ${status} 错误`
    return Promise.reject(new ApiError(`HTTP_${status}`, message, { status, data }))
  }
  
  // 处理其他错误
  return Promise.reject(new ApiError(
    'UNKNOWN_ERROR',
    error.message || '未知错误发生'
  ))
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
  retryDelay: 1000
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
      if (error instanceof ApiError && 
          ['VALIDATION_ERROR', 'UNAUTHORIZED', 'FORBIDDEN', 'NOT_FOUND'].includes(error.code)) {
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
          signal: AbortSignal.timeout(finalConfig.timeout!)
        })
        
        const responseData = await response.json()
        
        if (!response.ok) {
          handleApiError({ 
            response: { 
              status: response.status, 
              data: responseData 
            } 
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
    }
  }
}