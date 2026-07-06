import { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { prisma } from '../utils/db'
import { ownerFields, hasExactlyOneOwner, ownerRefine, ownerWhere } from '../utils/ownership'

const ListQuerySchema = z.object(ownerFields).refine(hasExactlyOneOwner, ownerRefine)

const CreativeFlowFieldsSchema = z.object({
  title: z.string().min(1),
  content: z.string(),
  tags: z.any().optional(),
})

const CreateCreativeFlowSchema = CreativeFlowFieldsSchema.extend(ownerFields).refine(
  hasExactlyOneOwner,
  ownerRefine
)

// 更新不接受归属字段
const UpdateCreativeFlowSchema = CreativeFlowFieldsSchema.partial()

type ListQuery = { Querystring: z.infer<typeof ListQuerySchema> }
type GetByIdParams = { Params: { id: string } }
type CreateBody = { Body: z.infer<typeof CreateCreativeFlowSchema> }
type UpdateParams = { Params: { id: string }; Body: z.infer<typeof UpdateCreativeFlowSchema> }

export async function creativeFlowRoutes(app: FastifyInstance) {
  // GET /creative-flows/list?projectId=xxx
  app.get('/list', async (req: FastifyRequest<ListQuery>, reply) => {
    const result = ListQuerySchema.safeParse(req.query)
    if (!result.success) {
      return reply.status(400).send({ success: false, error: result.error.format() })
    }

    const flows = await prisma.creativeFlow.findMany({
      where: ownerWhere(result.data),
      orderBy: { createdAt: 'desc' },
    })
    return { success: true, data: flows }
  })

  // GET /creative-flows/:id
  app.get('/:id', async (req: FastifyRequest<GetByIdParams>, reply) => {
    const flow = await prisma.creativeFlow.findUnique({
      where: { id: req.params.id },
    })
    if (!flow) {
      return reply.status(404).send({ success: false, error: 'Creative flow not found' })
    }
    return { success: true, data: flow }
  })

  // POST /creative-flows
  app.post('/', async (req: FastifyRequest<CreateBody>, reply) => {
    const result = CreateCreativeFlowSchema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({ success: false, error: result.error.format() })
    }

    const flow = await prisma.creativeFlow.create({
      data: result.data,
    })
    return { success: true, data: flow }
  })

  // PUT /creative-flows/:id
  app.put('/:id', async (req: FastifyRequest<UpdateParams>, reply) => {
    const result = UpdateCreativeFlowSchema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({ success: false, error: result.error.format() })
    }

    try {
      const flow = await prisma.creativeFlow.update({
        where: { id: req.params.id },
        data: result.data,
      })
      return { success: true, data: flow }
    } catch (e) {
      return reply.status(404).send({ success: false, error: 'Creative flow not found' })
    }
  })

  // DELETE /creative-flows/:id
  app.delete('/:id', async (req: FastifyRequest<GetByIdParams>, reply) => {
    try {
      await prisma.creativeFlow.delete({ where: { id: req.params.id } })
      return { success: true, message: 'Creative flow deleted' }
    } catch (e) {
      return reply.status(404).send({ success: false, error: 'Creative flow not found' })
    }
  })
}
