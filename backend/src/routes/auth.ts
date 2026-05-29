import { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import crypto from 'crypto'

const LoginSchema = z.object({
  password: z.string(),
})

const APP_PASSWORD = process.env.APP_PASSWORD || 'novel2024'

if (!process.env.APP_PASSWORD) {
  console.warn('⚠️  WARNING: APP_PASSWORD not set. Using default insecure password.')
}

// 简单的内存会话存储（单用户模式）
const sessions = new Map<string, number>()

// 清理过期会话（24小时）
setInterval(() => {
  const now = Date.now()
  for (const [token, time] of sessions) {
    if (now - time > 24 * 60 * 60 * 1000) {
      sessions.delete(token)
    }
  }
}, 60 * 60 * 1000)

function getToken(req: FastifyRequest): string | null {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) return null
  return auth.slice(7)
}

export async function authRoutes(app: FastifyInstance) {
  // GET /auth/status
  app.get('/status', async (req, reply) => {
    const token = getToken(req)
    const authenticated = token ? sessions.has(token) : false

    return {
      success: true,
      data: {
        requireAuth: true,
        authenticated,
        message: authenticated ? '已认证' : '需要登录',
      },
    }
  })

  // POST /auth/login
  app.post('/login', async (req, reply) => {
    const result = LoginSchema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({ success: false, error: result.error.format() })
    }

    if (result.data.password === APP_PASSWORD) {
      const sessionId = crypto.randomBytes(32).toString('hex')
      sessions.set(sessionId, Date.now())

      return {
        success: true,
        data: {
          sessionId,
          message: '登录成功',
        },
      }
    } else {
      return reply.status(401).send({
        success: false,
        error: { code: 401, message: '密码错误' },
      })
    }
  })

  // POST /auth/logout
  app.post('/logout', async (req, reply) => {
    const token = getToken(req)
    if (token) {
      sessions.delete(token)
    }
    return { success: true, data: { message: '已登出' } }
  })
}
