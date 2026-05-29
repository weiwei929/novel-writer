import { FastifyRequest, FastifyReply } from 'fastify'
import { getToken, isValidSession } from '../services/auth/sessionStore'

// 无需认证的公开路由前缀
const PUBLIC_ROUTES = ['/api/v2/auth', '/health']

/** 全局鉴权中间件：拦截所有非公开路由，检查 Bearer token */
export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  // 跳过公开路由
  const url = request.url
  for (const prefix of PUBLIC_ROUTES) {
    if (url.startsWith(prefix)) return
  }

  // OPTIONS 预检请求放行
  if (request.method === 'OPTIONS') return

  const token = getToken(request)
  if (!token || !isValidSession(token)) {
    return reply.status(401).send({
      success: false,
      error: { code: 401, message: '未认证，请先登录' },
    })
  }
}
