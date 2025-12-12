import Fastify from 'fastify'
import cors from '@fastify/cors'
import sensible from '@fastify/sensible'
import { prisma } from './utils/db'
import { projectRoutes } from './routes/projects'
import { chapterRoutes } from './routes/chapters'
import { scrapRoutes } from './routes/scraps'
import { authRoutes } from './routes/auth'
import { aiRoutes } from './routes/ai'

const server = Fastify({
  logger: true,
})

// Plugins
server.register(cors, {
  origin: true, // Allow all origins for local dev
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
})
server.register(sensible)

// Health Check
server.get('/health', async (request, reply) => {
  try {
    // Check DB connection
    await prisma.$queryRaw`SELECT 1`
    return { status: 'ok', database: 'connected', version: '2.0.0-alpha' }
  } catch (error) {
    server.log.error(error)
    reply.status(503)
    return { status: 'error', database: 'disconnected' }
  }
})

// Register Routes
import { collectionRoutes } from './routes/collections'

// ...

// Register Routes
server.register(projectRoutes, { prefix: '/api/v2/projects' })
server.register(chapterRoutes, { prefix: '/api/v2/chapters' })
server.register(scrapRoutes, { prefix: '/api/v2/scraps' })
server.register(collectionRoutes, { prefix: '/api/v2/collections' })
server.register(authRoutes, { prefix: '/api/v2/auth' })
server.register(aiRoutes, { prefix: '/api/v2/ai' })

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
