import { FastifyInstance } from 'fastify'
import { z } from 'zod'

const LoginSchema = z.object({
  password: z.string(),
})

// Simple hardcoded password for local single-user mode
// Simple authentication for single-user mode
const APP_PASSWORD = process.env.APP_PASSWORD || 'novel2024'

if (!process.env.APP_PASSWORD) {
  console.warn('⚠️  WARNING: APP_PASSWORD not set. Using default insecure password.')
}

export async function authRoutes(app: FastifyInstance) {
  // GET /auth/status
  app.get('/status', async (req, reply) => {
    // In a real app, verify JWT here. 
    // For now, if they have a header 'x-auth-token' or 'Authorization', assume it's valid if it matches a pattern?
    // Or just checking if server is up?
    // The frontend logic checks if response.success is true.
    return { 
      success: true, 
      data: { 
        requireAuth: true, 
        authenticated: true, // Optimistic for now, or check header?
        message: '已连接' 
      } 
    }
  })

  // POST /auth/login
  app.post('/login', async (req, reply) => {
    const result = LoginSchema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({ success: false, error: result.error.format() })
    }

    if (result.data.password === APP_PASSWORD) {
      return {
        success: true,
        data: {
          sessionId: 'mock-session-id-' + Date.now(),
          message: '登录成功'
        }
      }
    } else {
      return reply.status(401).send({
        success: false,
        error: { message: '密码错误' }
      })
    }
  })

  // POST /auth/logout
  app.post('/logout', async (req, reply) => {
    return { success: true, message: '已登出' }
  })
}
