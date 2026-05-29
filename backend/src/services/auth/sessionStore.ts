import { FastifyRequest } from 'fastify'
import crypto from 'crypto'

const SESSION_TTL = 24 * 60 * 60 * 1000 // 24 hours

// 内存会话存储（单用户模式）
const sessions = new Map<string, number>()

// 每小时清理过期会话
setInterval(() => {
  const now = Date.now()
  for (const [token, time] of sessions) {
    if (now - time > SESSION_TTL) {
      sessions.delete(token)
    }
  }
}, 60 * 60 * 1000)

/** 从请求头中提取 Bearer token */
export function getToken(req: FastifyRequest): string | null {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) return null
  return auth.slice(7)
}

/** 创建新会话，返回 sessionId */
export function createSession(): string {
  const sessionId = crypto.randomBytes(32).toString('hex')
  sessions.set(sessionId, Date.now())
  return sessionId
}

/** 销毁指定会话 */
export function destroySession(token: string): void {
  sessions.delete(token)
}

/** 验证会话是否有效（滑动过期：活跃使用自动续期） */
export function isValidSession(token: string): boolean {
  const time = sessions.get(token)
  if (!time) return false
  if (Date.now() - time > SESSION_TTL) {
    sessions.delete(token)
    return false
  }
  // 活跃使用时刷新时间戳，避免写到一半过期
  sessions.set(token, Date.now())
  return true
}
