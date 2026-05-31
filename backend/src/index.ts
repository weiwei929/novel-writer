import Fastify from 'fastify'
import cors from '@fastify/cors'
import sensible from '@fastify/sensible'
import { prisma } from './utils/db'
import { projectRoutes } from './routes/projects'
import { chapterRoutes } from './routes/chapters'
import { scrapRoutes } from './routes/scraps'
import { authRoutes } from './routes/auth'
import { aiRoutes } from './routes/ai'
import { collectionRoutes } from './routes/collections'
import { settingsRoutes } from './routes/settings'
import { characterRoutes } from './routes/characters'
import { timelineRoutes } from './routes/timeline'
import { creativeFlowRoutes } from './routes/creativeFlows'
import { proposalRoutes } from './routes/proposals'
import { authMiddleware } from './middleware/auth'

const server = Fastify({
  logger: true,
})

// Plugins
server.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
})
server.register(sensible)

// Health Check（公开）
server.get('/health', async (request, reply) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'ok', database: 'connected', version: '2.0.0-alpha' }
  } catch (error) {
    server.log.error(error)
    reply.status(503)
    return { status: 'error', database: 'disconnected' }
  }
})

// 全局鉴权中间件：拦截所有非公开路由
server.addHook('preHandler', authMiddleware)

// Register Routes
server.register(projectRoutes, { prefix: '/api/v2/projects' })
server.register(chapterRoutes, { prefix: '/api/v2/chapters' })
server.register(scrapRoutes, { prefix: '/api/v2/scraps' })
server.register(collectionRoutes, { prefix: '/api/v2/collections' })
server.register(authRoutes, { prefix: '/api/v2/auth' })
server.register(aiRoutes, { prefix: '/api/v2/ai' })
server.register(settingsRoutes, { prefix: '/api/v2/settings' })
server.register(characterRoutes, { prefix: '/api/v2/characters' })
server.register(timelineRoutes, { prefix: '/api/v2/timeline' })
server.register(creativeFlowRoutes, { prefix: '/api/v2/creative-flows' })
server.register(proposalRoutes, { prefix: '/api/v2/proposals' })

// Run Server
const start = async () => {
  try {
    await server.listen({ port: 5000, host: '0.0.0.0' })
    console.log('Server running on http://localhost:5000')
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()
