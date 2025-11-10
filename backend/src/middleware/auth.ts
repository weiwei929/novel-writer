/**
 * 单用户认证中间件
 * 专为个人使用设计的轻量级安全验证
 */

import { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'

// 扩展 Request 接口
declare global {
  namespace Express {
    interface Request {
      isAuthenticated?: boolean
      sessionId?: string
    }
  }
}

// 简单的会话存储 (内存存储，适合单用户)
const activeSessions = new Map<string, {
  createdAt: Date
  lastAccess: Date
  isValid: boolean
}>()

// 配置常量
const APP_PASSWORD = process.env.APP_PASSWORD || 'novel2024'
const SESSION_SECRET = process.env.SESSION_SECRET || 'novel-writer-session-key'
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000 // 24小时

/**
 * 生成会话ID
 */
function generateSessionId(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * 验证会话是否有效
 */
function isSessionValid(sessionId: string): boolean {
  const session = activeSessions.get(sessionId)
  if (!session || !session.isValid) {
    return false
  }

  // 检查会话是否超时
  const now = new Date()
  const timeDiff = now.getTime() - session.lastAccess.getTime()
  
  if (timeDiff > SESSION_TIMEOUT) {
    activeSessions.delete(sessionId)
    return false
  }

  // 更新最后访问时间
  session.lastAccess = now
  return true
}

/**
 * 应用启动密码验证
 */
// 别名导出，用于路由保护
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  return authenticateApp(req, res, next)
}

export const authenticateApp = (req: Request, res: Response, next: NextFunction) => {
  // 检查是否需要密码验证
  if (process.env.REQUIRE_PASSWORD_ON_START !== 'true') {
    req.isAuthenticated = true
    return next()
  }

  const authToken = req.headers.authorization?.replace('Bearer ', '') || 
                   req.cookies?.auth_token ||
                   req.headers['x-auth-token']

  // 如果有有效的会话令牌
  if (authToken && isSessionValid(authToken)) {
    req.isAuthenticated = true
    req.sessionId = authToken
    return next()
  }

  // 检查是否是登录请求
  if (req.path === '/auth/login' && req.method === 'POST') {
    return next()
  }

  // 检查是否是公开路由
  const publicRoutes = ['/health', '/api/v1/health', '/auth/status']
  if (publicRoutes.includes(req.path)) {
    return next()
  }

  // 需要认证
  res.status(401).json({
    success: false,
    error: {
      code: 'AUTHENTICATION_REQUIRED',
      message: '请先验证应用密码'
    },
    requireAuth: true
  })
}

/**
 * 敏感操作验证中间件
 */
export const requireConfirmation = (operation: 'delete' | 'export' | 'import') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const requireConfirmation = {
      delete: process.env.REQUIRE_CONFIRMATION_FOR_DELETE === 'true',
      export: process.env.REQUIRE_CONFIRMATION_FOR_EXPORT === 'true',
      import: process.env.REQUIRE_CONFIRMATION_FOR_IMPORT === 'true'
    }

    if (!requireConfirmation[operation]) {
      return next()
    }

    const confirmed = req.headers['x-operation-confirmed'] === 'true' ||
                     req.body.confirmed === true

    if (!confirmed) {
      return res.status(200).json({
        success: false,
        requireConfirmation: true,
        operation,
        message: `此操作需要确认: ${operation}`
      })
    }

    next()
  }
}

/**
 * 登录处理
 */
export const handleLogin = (req: Request, res: Response) => {
  const { password } = req.body

  if (!password || password !== APP_PASSWORD) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_PASSWORD',
        message: '密码错误'
      }
    })
  }

  // 创建新会话
  const sessionId = generateSessionId()
  activeSessions.set(sessionId, {
    createdAt: new Date(),
    lastAccess: new Date(),
    isValid: true
  })

  res.json({
    success: true,
    data: {
      sessionId,
      expiresIn: SESSION_TIMEOUT,
      message: '登录成功'
    }
  })
}

/**
 * 登出处理
 */
export const handleLogout = (req: Request, res: Response) => {
  const sessionId = req.sessionId

  if (sessionId) {
    activeSessions.delete(sessionId)
  }

  res.json({
    success: true,
    message: '已退出登录'
  })
}

/**
 * 获取认证状态
 */
export const getAuthStatus = (req: Request, res: Response) => {
  const requireAuth = process.env.REQUIRE_PASSWORD_ON_START === 'true'
  
  if (!requireAuth) {
    return res.json({
      success: true,
      data: {
        requireAuth: false,
        authenticated: true,
        message: '无需认证'
      }
    })
  }

  const authToken = req.headers.authorization?.replace('Bearer ', '') || 
                   req.cookies?.auth_token ||
                   req.headers['x-auth-token']

  const isAuthenticated = authToken && isSessionValid(authToken)

  res.json({
    success: true,
    data: {
      requireAuth: true,
      authenticated: isAuthenticated,
      sessionCount: activeSessions.size,
      message: isAuthenticated ? '已认证' : '需要认证'
    }
  })
}

/**
 * 清理过期会话 (定时任务)
 */
export const cleanupSessions = () => {
  const now = new Date()
  let cleanedCount = 0

  for (const [sessionId, session] of activeSessions.entries()) {
    const timeDiff = now.getTime() - session.lastAccess.getTime()
    if (timeDiff > SESSION_TIMEOUT) {
      activeSessions.delete(sessionId)
      cleanedCount++
    }
  }

  if (cleanedCount > 0) {
    console.log(`🧹 清理了 ${cleanedCount} 个过期会话`)
  }
}

// 每小时清理一次过期会话
setInterval(cleanupSessions, 60 * 60 * 1000)