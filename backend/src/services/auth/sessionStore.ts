import { FastifyRequest } from 'fastify'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

const SESSION_TTL = 24 * 60 * 60 * 1000 // 24 hours
// 放在 /tmp，避免 dev 模式下写项目目录触发 nodemon 重启
const SESSION_FILE =
  process.env.SESSION_FILE || '/tmp/novel-writer-sessions.json'

const sessions = new Map<string, number>()

function persistSessions() {
  try {
    fs.mkdirSync(path.dirname(SESSION_FILE), { recursive: true })
    const obj: Record<string, number> = {}
    for (const [token, time] of sessions) {
      obj[token] = time
    }
    fs.writeFileSync(SESSION_FILE, JSON.stringify(obj), 'utf8')
  } catch (err) {
    console.warn('Failed to persist sessions:', err)
  }
}

function loadSessions() {
  try {
    if (!fs.existsSync(SESSION_FILE)) return
    const raw = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8')) as Record<string, number>
    const now = Date.now()
    for (const [token, time] of Object.entries(raw)) {
      if (now - time <= SESSION_TTL) {
        sessions.set(token, time)
      }
    }
  } catch (err) {
    console.warn('Failed to load sessions:', err)
  }
}

loadSessions()

// 每小时清理过期会话
setInterval(() => {
  const now = Date.now()
  let changed = false
  for (const [token, time] of sessions) {
    if (now - time > SESSION_TTL) {
      sessions.delete(token)
      changed = true
    }
  }
  if (changed) persistSessions()
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
  persistSessions()
  return sessionId
}

/** 销毁指定会话 */
export function destroySession(token: string): void {
  sessions.delete(token)
  persistSessions()
}

/** 验证会话是否有效（滑动过期：活跃使用自动续期） */
export function isValidSession(token: string): boolean {
  const time = sessions.get(token)
  if (!time) return false
  if (Date.now() - time > SESSION_TTL) {
    sessions.delete(token)
    persistSessions()
    return false
  }
  sessions.set(token, Date.now())
  return true
}

// 定期落盘（create/destroy 仍立即写入；避免每次请求写盘触发 nodemon 重启）
setInterval(() => persistSessions(), 5 * 60 * 1000)
