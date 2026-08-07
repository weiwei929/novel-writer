import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getToken, createSession, destroySession, isValidSession } from '../services/auth/sessionStore'

const LoginSchema = z.object({
  password: z.string(),
})

/** Resolves login password; production requires explicit APP_PASSWORD. */
export function resolveAppPassword(env: NodeJS.ProcessEnv = process.env): string {
  const configured = env.APP_PASSWORD?.trim()
  if (configured) return configured

  if (env.NODE_ENV === 'production') {
    throw new Error(
      'APP_PASSWORD is required when NODE_ENV=production. Set APP_PASSWORD in the environment.'
    )
  }

  console.warn('⚠️  WARNING: APP_PASSWORD not set. Using default insecure password.')
  return 'novel2024'
}

const APP_PASSWORD = resolveAppPassword()

export async function authRoutes(app: FastifyInstance) {
  // GET /auth/status
  app.get('/status', async (req, reply) => {
    const token = getToken(req)
    const authenticated = token ? isValidSession(token) : false

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
      const sessionId = createSession()

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
      destroySession(token)
    }
    return { success: true, data: { message: '已登出' } }
  })
}
