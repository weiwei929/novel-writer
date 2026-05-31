import { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { prisma } from '../utils/db'
import { ownerFields, hasExactlyOneOwner, ownerRefine, ownerWhere } from '../utils/ownership'

const ListQuerySchema = z.object(ownerFields).refine(hasExactlyOneOwner, ownerRefine)

const TimelineFieldsSchema = z.object({
  time: z.string().min(1),
  location: z.string().min(1),
  characters: z.string().min(1),
  premise: z.string().optional().nullable(),
  process: z.string().optional().nullable(),
  outcome: z.string().optional().nullable(),
  narrativeMode: z.string().optional().nullable(),
  emotionStage: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
})

const CreateTimelineSchema = TimelineFieldsSchema.extend(ownerFields).refine(
  hasExactlyOneOwner,
  ownerRefine
)

// 更新不接受归属字段
const UpdateTimelineSchema = TimelineFieldsSchema.partial()

type ListQuery = { Querystring: z.infer<typeof ListQuerySchema> }
type GetByIdParams = { Params: { id: string } }
type CreateBody = { Body: z.infer<typeof CreateTimelineSchema> }
type UpdateParams = { Params: { id: string }; Body: z.infer<typeof UpdateTimelineSchema> }

export async function timelineRoutes(app: FastifyInstance) {
  // GET /timeline/list?projectId=xxx
  app.get('/list', async (req: FastifyRequest<ListQuery>, reply) => {
    const result = ListQuerySchema.safeParse(req.query)
    if (!result.success) {
      return reply.status(400).send({ success: false, error: result.error.format() })
    }

    const entries = await prisma.timelineEntry.findMany({
      where: ownerWhere(result.data),
      orderBy: { sortOrder: 'asc' },
    })
    return { success: true, data: entries }
  })

  // GET /timeline/:id
  app.get('/:id', async (req: FastifyRequest<GetByIdParams>, reply) => {
    const entry = await prisma.timelineEntry.findUnique({
      where: { id: req.params.id },
    })
    if (!entry) {
      return reply.status(404).send({ success: false, error: 'Timeline entry not found' })
    }
    return { success: true, data: entry }
  })

  // POST /timeline
  app.post('/', async (req: FastifyRequest<CreateBody>, reply) => {
    const result = CreateTimelineSchema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({ success: false, error: result.error.format() })
    }

    const entry = await prisma.timelineEntry.create({
      data: {
        ...result.data,
        sortOrder: result.data.sortOrder ?? 0,
      },
    })
    return { success: true, data: entry }
  })

  // PUT /timeline/:id
  app.put('/:id', async (req: FastifyRequest<UpdateParams>, reply) => {
    const result = UpdateTimelineSchema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({ success: false, error: result.error.format() })
    }

    try {
      const entry = await prisma.timelineEntry.update({
        where: { id: req.params.id },
        data: result.data,
      })
      return { success: true, data: entry }
    } catch (e) {
      return reply.status(404).send({ success: false, error: 'Timeline entry not found' })
    }
  })

  // DELETE /timeline/:id
  app.delete('/:id', async (req: FastifyRequest<GetByIdParams>, reply) => {
    try {
      await prisma.timelineEntry.delete({ where: { id: req.params.id } })
      return { success: true, message: 'Timeline entry deleted' }
    } catch (e) {
      return reply.status(404).send({ success: false, error: 'Timeline entry not found' })
    }
  })
}
