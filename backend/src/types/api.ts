// API响应统一格式定义

/**
 * 统一API响应格式
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
 * API错误码枚举
 */
export enum ApiErrorCode {
  // 验证错误
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_PARAMETER = 'MISSING_PARAMETER',
  
  // 认证授权错误
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // 资源错误
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_EXISTS = 'RESOURCE_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  
  // 数据库错误
  DATABASE_ERROR = 'DATABASE_ERROR',
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',
  
  // 业务逻辑错误
  BUSINESS_LOGIC_ERROR = 'BUSINESS_LOGIC_ERROR',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  
  // 系统错误
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR'
}

/**
 * 分页请求参数
 */
export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * 创建成功响应
 */
export function createSuccessResponse<T>(
  data: T,
  metadata?: Record<string, any>,
  pagination?: ApiResponse<T>['pagination']
): ApiResponse<T> {
  return {
    success: true,
    data,
    pagination,
    metadata: {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      ...metadata
    }
  }
}

/**
 * 创建错误响应
 */
export function createErrorResponse(
  code: ApiErrorCode | string,
  message: string,
  details?: any,
  metadata?: Record<string, any>
): ApiResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details
    },
    metadata: {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      ...metadata
    }
  }
}

/**
 * HTTP状态码映射
 */
export const HttpStatusCode = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const

/**
 * 错误码与HTTP状态码映射
 */
export const ErrorCodeToHttpStatus: Record<string, number> = {
  [ApiErrorCode.VALIDATION_ERROR]: HttpStatusCode.BAD_REQUEST,
  [ApiErrorCode.INVALID_INPUT]: HttpStatusCode.BAD_REQUEST,
  [ApiErrorCode.MISSING_PARAMETER]: HttpStatusCode.BAD_REQUEST,
  [ApiErrorCode.UNAUTHORIZED]: HttpStatusCode.UNAUTHORIZED,
  [ApiErrorCode.FORBIDDEN]: HttpStatusCode.FORBIDDEN,
  [ApiErrorCode.TOKEN_EXPIRED]: HttpStatusCode.UNAUTHORIZED,
  [ApiErrorCode.NOT_FOUND]: HttpStatusCode.NOT_FOUND,
  [ApiErrorCode.RESOURCE_EXISTS]: HttpStatusCode.CONFLICT,
  [ApiErrorCode.RESOURCE_CONFLICT]: HttpStatusCode.CONFLICT,
  [ApiErrorCode.DATABASE_ERROR]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [ApiErrorCode.DATABASE_CONNECTION_ERROR]: HttpStatusCode.SERVICE_UNAVAILABLE,
  [ApiErrorCode.BUSINESS_LOGIC_ERROR]: HttpStatusCode.BAD_REQUEST,
  [ApiErrorCode.OPERATION_NOT_ALLOWED]: HttpStatusCode.FORBIDDEN,
  [ApiErrorCode.INTERNAL_ERROR]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [ApiErrorCode.SERVICE_UNAVAILABLE]: HttpStatusCode.SERVICE_UNAVAILABLE,
  [ApiErrorCode.TIMEOUT_ERROR]: HttpStatusCode.INTERNAL_SERVER_ERROR
}