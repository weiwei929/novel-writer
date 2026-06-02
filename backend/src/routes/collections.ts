import { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { prisma } from '../utils/db'

// Validation Schemas
const CreateCollectionSchema = z.object({
  name: z.string().min(1, "名称不能为空"),
  description: z.string().optional(),
})

const UpdateCollectionSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
})

type CreateCollectionBody = { Body: z.infer<typeof CreateCollectionSchema> }
type UpdateCollectionBody = { Params: { id: string }, Body: z.infer<typeof UpdateCollectionSchema> }
type GetByIdParams = { Params: { id: string } }

export async function collectionRoutes(app: FastifyInstance) {
  // GET /collections
  app.get('/', async (req, reply) => {
    const collections = await prisma.collection.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { projects: true }
        }
      }
    })
    return { success: true, data: collections }
  })

  // GET /collections/:id
  app.get('/:id', async (req: FastifyRequest<GetByIdParams>, reply) => {
    const collection = await prisma.collection.findUnique({
      where: { id: req.params.id },
      include: {
        projects: true,
        _count: { select: { projects: true } }
      }
    })
    if (!collection) return reply.status(404).send({ success: false, error: 'Collection not found' })
    return { success: true, data: collection }
  })

  // POST /collections
  app.post('/', async (req: FastifyRequest<CreateCollectionBody>, reply) => {
    const result = CreateCollectionSchema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({ success: false, error: result.error.format() })
    }
    
    // In Prisma, we might not have a specific user context yet in this stripped version,
    // assuming global collections or simplified auth.
    const collection = await prisma.collection.create({
      data: {
        name: result.data.name,
        description: result.data.description,
      }
    })
    return { success: true, data: collection }
  })

  // PUT /collections/:id
  app.put('/:id', async (req: FastifyRequest<UpdateCollectionBody>, reply) => {
    const result = UpdateCollectionSchema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({ success: false, error: result.error.format() })
    }

    try {
      const collection = await prisma.collection.update({
        where: { id: req.params.id },
        data: result.data
      })
      return { success: true, data: collection }
    } catch (e) {
      return reply.status(404).send({ success: false, error: 'Collection not found' })
    }
  })

  // DELETE /collections/:id — 仅允许删除空文集
  app.delete('/:id', async (req: FastifyRequest<GetByIdParams>, reply) => {
    try {
      const existing = await prisma.collection.findUnique({
        where: { id: req.params.id },
        include: { _count: { select: { projects: true } } },
      })
      if (!existing) {
        return reply.status(404).send({ success: false, error: 'Collection not found' })
      }
      if (existing._count.projects > 0) {
        return reply.status(400).send({
          success: false,
          error: '文集内仍有作品，无法删除',
        })
      }
      await prisma.collection.delete({
        where: { id: req.params.id },
      })
      return { success: true, message: 'Collection deleted' }
    } catch (e) {
      return reply.status(404).send({ success: false, error: 'Collection not found' })
    }
  })
}
