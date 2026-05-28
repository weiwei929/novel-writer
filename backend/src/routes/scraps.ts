import { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { prisma } from '../utils/db'

const CreateScrapSchema = z.object({
  projectId: z.string().uuid().optional().nullable(),
  content: z.string().min(1),
  tags: z.any().optional(),
  note: z.string().optional(),
  originalChapterId: z.string().uuid().optional(),
})

const UpdateScrapSchema = z.object({
  content: z.string().min(1).optional(),
  tags: z.any().optional(),
  note: z.string().optional(),
  projectId: z.string().uuid().optional(),
})

type CreateScrapBody = { Body: z.infer<typeof CreateScrapSchema> }
type UpdateScrapParams = { Params: { id: string }; Body: z.infer<typeof UpdateScrapSchema> }
type GetByProjectParams = { Params: { projectId: string } }
type DeleteScrapParams = { Params: { id: string } }

export async function scrapRoutes(app: FastifyInstance) {
  // GET /scraps/project/:projectId
  app.get('/project/:projectId', async (req: FastifyRequest<GetByProjectParams>, reply) => {
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
  app.post('/', async (req: FastifyRequest<CreateScrapBody>, reply) => {
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

  // PUT /scraps/:id
  app.put('/:id', async (req: FastifyRequest<UpdateScrapParams>, reply) => {
    const result = UpdateScrapSchema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({ success: false, error: result.error.format() })
    }

    try {
      const scrap = await prisma.scrap.update({
        where: { id: req.params.id },
        data: {
          ...(result.data.content !== undefined && { content: result.data.content }),
          ...(result.data.tags !== undefined && { tags: result.data.tags }),
          ...(result.data.note !== undefined && { note: result.data.note }),
          ...(result.data.projectId !== undefined && { projectId: result.data.projectId }),
        }
      })
      return { success: true, data: scrap }
    } catch (e) {
      return reply.status(404).send({ success: false, error: 'Scrap not found' })
    }
  })

  // GET /scraps
  app.get('/', async (_req, reply) => {
    const scraps = await prisma.scrap.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        project: { select: { title: true } }
      }
    })
    return { success: true, data: scraps }
  })

  // DELETE /scraps/:id
  app.delete('/:id', async (req: FastifyRequest<DeleteScrapParams>, reply) => {
    try {
      await prisma.scrap.delete({ where: { id: req.params.id } })
      return { success: true, message: 'Scrap deleted' }
    } catch (e) {
      return reply.status(404).send({ success: false, error: 'Scrap not found' })
    }
  })
}
