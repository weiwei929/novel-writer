// 错误处理中间件

import { Request, Response, NextFunction } from 'express'
import { ApiErrorCode, createErrorResponse, ErrorCodeToHttpStatus } from '../types/api.js'
import { log } from '../utils/logger.js'

/**
 * 自定义API错误类
 */
export class ApiError extends Error {
  public code: ApiErrorCode | string
  public statusCode: number
  public details?: any

  constructor(code: ApiErrorCode | string, message: string, statusCode?: number, details?: any) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.statusCode = statusCode || ErrorCodeToHttpStatus[code] || 500
    this.details = details
  }
}

/**
 * 异步路由错误处理包装器
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

/**
 * 类型守卫：检查是否为 Error 对象
 */
function isError(err: unknown): err is Error {
  return err instanceof Error
}

/**
 * 类型守卫：检查是否为具有特定属性的对象
 */
function hasProperty<T extends string>(err: unknown, prop: T): err is Record<T, unknown> {
  return typeof err === 'object' && err !== null && prop in err
}

/**
 * 全局错误处理中间件
 */
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  log.error('Error occurred', {
    error: err,
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
  })

  // 如果响应已经发送，则交给默认错误处理器
  if (res.headersSent) {
    return next(err)
  }

  let statusCode = 500
  let errorCode = ApiErrorCode.INTERNAL_ERROR
  let message = '内部服务器错误'
  let details: any = undefined

  // 处理自定义API错误
  if (err instanceof ApiError) {
    statusCode = err.statusCode
    errorCode = err.code as ApiErrorCode
    message = err.message
    details = err.details
  }
  // 处理验证错误
  else if (hasProperty(err, 'name') && err.name === 'ValidationError') {
    statusCode = 400
    errorCode = ApiErrorCode.VALIDATION_ERROR
    message = '数据验证失败'
    const errorWithDetails = err as { errors?: any; message?: string }
    details = errorWithDetails.errors || (isError(err) ? err.message : undefined)
  }
  // 处理JSON解析错误
  else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400
    errorCode = ApiErrorCode.INVALID_INPUT
    message = 'JSON格式错误'
  }
  // 处理数据库连接错误
  else if (hasProperty(err, 'code') && (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND')) {
    statusCode = 503
    errorCode = ApiErrorCode.DATABASE_CONNECTION_ERROR
    message = '数据库连接失败'
  }
  // 处理超时错误
  else if (
    hasProperty(err, 'code') &&
    (err.code === 'ETIMEDOUT' || (hasProperty(err, 'timeout') && err.timeout))
  ) {
    statusCode = 500
    errorCode = ApiErrorCode.TIMEOUT_ERROR
    message = '请求超时'
  }
  // 处理权限错误
  else if (hasProperty(err, 'name') && err.name === 'UnauthorizedError') {
    statusCode = 401
    errorCode = ApiErrorCode.UNAUTHORIZED
    message = '未授权访问'
  }
  // 处理其他已知错误
  else if (isError(err) && err.message) {
    message = process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message

    // 根据错误消息推断错误类型
    if (err.message.includes('not found') || err.message.includes('不存在')) {
      statusCode = 404
      errorCode = ApiErrorCode.NOT_FOUND
    } else if (err.message.includes('duplicate') || err.message.includes('已存在')) {
      statusCode = 409
      errorCode = ApiErrorCode.RESOURCE_EXISTS
    } else if (err.message.includes('invalid') || err.message.includes('无效')) {
      statusCode = 400
      errorCode = ApiErrorCode.VALIDATION_ERROR
    }
  }

  // 在开发环境中包含堆栈跟踪
  if (process.env.NODE_ENV === 'development') {
    details = {
      ...details,
      stack: isError(err) ? err.stack : undefined,
      originalError: hasProperty(err, 'name') ? String(err.name) : undefined,
    }
  }

  const response = createErrorResponse(errorCode, message, details)
  res.status(statusCode).json(response)
}

/**
 * 404处理中间件
 */
export function notFoundHandler(req: Request, res: Response) {
  log.warn('404 Handler triggered', {
    path: req.path,
    url: req.url,
    method: req.method,
    query: req.query,
    originalUrl: req.originalUrl,
  })

  const response = createErrorResponse(ApiErrorCode.NOT_FOUND, '请求的资源不存在', {
    path: req.path,
    method: req.method,
  })

  res.status(404).json(response)
}

/**
 * 请求日志中间件
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now()

  // 记录请求开始
  log.http(`${req.method} ${req.url}`, { ip: req.ip })

  // 监听响应完成
  res.on('finish', () => {
    const duration = Date.now() - start
    log.http(`${req.method} ${req.url}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    })
  })

  next()
}
