import { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { prisma } from '../utils/db'
import { ownerFields, hasExactlyOneOwner, ownerRefine, ownerWhere } from '../utils/ownership'

const ListQuerySchema = z.object(ownerFields).refine(hasExactlyOneOwner, ownerRefine)

const CharacterFieldsSchema = z.object({
  name: z.string().min(1),
  role: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  profile: z.any().optional(),
  gender: z.string().optional().nullable(),
  age: z.string().optional().nullable(),
  identity: z.string().optional().nullable(),
  appearance: z.string().optional().nullable(),
  personality: z.string().optional().nullable(),
  interests: z.string().optional().nullable(),
  roleType: z.string().optional().nullable(),
  experience: z.string().optional().nullable(),
  keyRelations: z.string().optional().nullable(),
  catchphrase: z.string().optional().nullable(),
})

const CreateCharacterSchema = CharacterFieldsSchema.extend(ownerFields).refine(
  hasExactlyOneOwner,
  ownerRefine
)

// 更新不接受归属字段（projectId/proposalId 创建时定死）
const UpdateCharacterSchema = CharacterFieldsSchema.partial()

type ListQuery = { Querystring: z.infer<typeof ListQuerySchema> }
type GetByIdParams = { Params: { id: string } }
type CreateBody = { Body: z.infer<typeof CreateCharacterSchema> }
type UpdateParams = { Params: { id: string }; Body: z.infer<typeof UpdateCharacterSchema> }

export async function characterRoutes(app: FastifyInstance) {
  // GET /characters/list?projectId=xxx 或 ?proposalId=xxx
  app.get('/list', async (req: FastifyRequest<ListQuery>, reply) => {
    const result = ListQuerySchema.safeParse(req.query)
    if (!result.success) {
      return reply.status(400).send({ success: false, error: result.error.format() })
    }

    const characters = await prisma.character.findMany({
      where: ownerWhere(result.data),
      orderBy: { createdAt: 'asc' },
    })
    return { success: true, data: characters }
  })

  // GET /characters/:id
  app.get('/:id', async (req: FastifyRequest<GetByIdParams>, reply) => {
    const character = await prisma.character.findUnique({
      where: { id: req.params.id },
    })
    if (!character) {
      return reply.status(404).send({ success: false, error: 'Character not found' })
    }
    return { success: true, data: character }
  })

  // POST /characters
  app.post('/', async (req: FastifyRequest<CreateBody>, reply) => {
    const result = CreateCharacterSchema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({ success: false, error: result.error.format() })
    }

    const character = await prisma.character.create({
      data: result.data,
    })
    return { success: true, data: character }
  })

  // PUT /characters/:id
  app.put('/:id', async (req: FastifyRequest<UpdateParams>, reply) => {
    const result = UpdateCharacterSchema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({ success: false, error: result.error.format() })
    }

    try {
      const character = await prisma.character.update({
        where: { id: req.params.id },
        data: result.data,
      })
      return { success: true, data: character }
    } catch (e) {
      return reply.status(404).send({ success: false, error: 'Character not found' })
    }
  })

  // DELETE /characters/:id
  app.delete('/:id', async (req: FastifyRequest<GetByIdParams>, reply) => {
    try {
      await prisma.character.delete({ where: { id: req.params.id } })
      return { success: true, message: 'Character deleted' }
    } catch (e) {
      return reply.status(404).send({ success: false, error: 'Character not found' })
    }
  })
}
