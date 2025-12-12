import { Request, Response, NextFunction } from 'express'
import rateLimit, { Options } from 'express-rate-limit'
import helmet from 'helmet'
import { log } from '../utils/logger.js'

/**
 * Helmet 安全头配置
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Monaco Editor 需要 unsafe-eval
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Monaco Editor 需要
  crossOriginResourcePolicy: { policy: 'cross-origin' },
})

/**
 * API 速率限制配置
 * 开发环境使用更宽松的限制，生产环境使用严格限制
 */
export const apiLimiter = (() => {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const skipInDev = process.env.SKIP_RATE_LIMIT === 'true'

  // 开发环境可以跳过限制
  if (isDevelopment && skipInDev) {
    return (req: Request, res: Response, next: NextFunction) => next()
  }

  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 分钟
    max: isDevelopment ? 1000 : 100, // 开发环境 1000 次，生产环境 100 次
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: '请求过于频繁，请稍后再试',
      },
    },
    standardHeaders: true, // 返回速率限制信息到 `RateLimit-*` 头
    legacyHeaders: false, // 禁用 `X-RateLimit-*` 头
    skip: (req: Request) => {
      // 健康检查端点不限制
      return req.path === '/health' || req.path === '/status'
    },
    handler: (req: Request, res: Response) => {
      log.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        environment: process.env.NODE_ENV,
      })
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: '请求过于频繁，请稍后再试',
        },
      })
    },
  })
})()

/**
 * 严格速率限制（用于认证相关端点）
 */
export const authLimiter = (() => {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const skipInDev = process.env.SKIP_RATE_LIMIT === 'true'

  // 开发环境可以跳过限制
  if (isDevelopment && skipInDev) {
    return (req: Request, res: Response, next: NextFunction) => next()
  }

  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 分钟
    max: isDevelopment ? 50 : 5, // 开发环境 50 次，生产环境 5 次
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: '登录尝试过于频繁，请稍后再试',
      },
    },
    skipSuccessfulRequests: true, // 成功请求不计入限制
    handler: (req: Request, res: Response) => {
      log.warn('Auth rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        environment: process.env.NODE_ENV,
      })
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: '登录尝试过于频繁，请稍后再试',
        },
      })
    },
  })
})()

/**
 * 文件上传速率限制
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 小时
  max: 10, // 限制每个 IP 每小时最多 10 次上传
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '上传次数过多，请稍后再试',
    },
  },
  handler: (req: Request, res: Response) => {
    log.warn('Upload rate limit exceeded', {
      ip: req.ip,
      path: req.path,
    })
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: '上传次数过多，请稍后再试',
      },
    })
  },
})

/**
 * 开发环境跳过速率限制（可选）
 */
export const createLimiter = (config: Options) => {
  if (process.env.NODE_ENV === 'development' && process.env.SKIP_RATE_LIMIT === 'true') {
    return (req: Request, res: Response, next: NextFunction) => next()
  }
  return rateLimit(config)
}
