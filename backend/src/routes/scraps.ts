import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../utils/db'

const CreateScrapSchema = z.object({
  projectId: z.string().uuid(),
  content: z.string().min(1),
  tags: z.string().optional(), // Comma separated or JSON
  note: z.string().optional(),
  originalChapterId: z.string().uuid().optional(),
})

export async function scrapRoutes(app: FastifyInstance) {
  // GET /scraps/project/:projectId
  app.get('/project/:projectId', async (req: any, reply) => {
    const scraps = await prisma.scrap.findMany({
      where: { projectId: req.params.projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        project: { select: { title: true } }
      }
    })
    return { success: true, data: scraps }
  })

  // POST /scraps ("Clip It")
  app.post('/', async (req: any, reply) => {
    const result = CreateScrapSchema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({ success: false, error: result.error.format() })
    }

    const scrap = await prisma.scrap.create({
      data: {
        projectId: result.data.projectId,
        content: result.data.content,
        tags: result.data.tags,
        note: result.data.note,
        originalChapterId: result.data.originalChapterId
      }
    })
    return { success: true, data: scrap }
  })

  // DELETE /scraps/:id
  app.delete('/:id', async (req: any, reply) => {
    try {
      await prisma.scrap.delete({ where: { id: req.params.id } })
      return { success: true, message: 'Scrap deleted' }
    } catch (e) {
      return reply.status(404).send({ success: false, error: 'Scrap not found' })
    }
  })
}
