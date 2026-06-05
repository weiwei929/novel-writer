import { FastifyInstance } from 'fastify'

const GRAVEYARD_PATH = '/api/v2/graveyard'

/** 旧作品暂存 API — 永久迁移至墓园（deletedAt 语义） */
export async function shelfRoutes(app: FastifyInstance) {
  app.get('/', async (_req, reply) => {
    reply.header('Deprecation', 'true')
    reply.header(
      'Warning',
      '299 - "DEPRECATION: /shelf migrated to /api/v2/graveyard (deletedAt-based graveyard)"'
    )
    return reply
      .code(308)
      .header('Location', GRAVEYARD_PATH)
      .send({
        message: '作品暂存已迁移至墓园 API',
        successor: GRAVEYARD_PATH,
      })
  })
}
