import { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { prisma } from '../utils/db'

const PROPOSAL_STATUSES = ['draft', 'submitted', 'evaluated', 'approved', 'rejected'] as const

// 创建：归属字段（projectId）不在创建期开放，立项流程后续卡处理
const CreateProposalSchema = z.object({
  title: z.string().min(1),
  synopsis: z.string().optional().nullable(),
  innovation: z.string().optional().nullable(),
  coreSetting: z.string().optional().nullable(),
  references: z.any().optional(),
  sourceNotes: z.string().optional().nullable(),
})

// 更新：锁定归属字段（projectId 不接受），仅允许改内容字段
const UpdateProposalSchema = CreateProposalSchema.partial()

const UpdateStatusSchema = z.object({
  status: z.enum(PROPOSAL_STATUSES),
})

type GetByIdParams = { Params: { id: string } }
type CreateBody = { Body: z.infer<typeof CreateProposalSchema> }
type UpdateParams = { Params: { id: string }; Body: z.infer<typeof UpdateProposalSchema> }
type StatusParams = { Params: { id: string }; Body: z.infer<typeof UpdateStatusSchema> }

export async function proposalRoutes(app: FastifyInstance) {
  // GET /proposals
  app.get('/', async (_req, reply) => {
    const proposals = await prisma.proposal.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return { success: true, data: proposals }
  })

  // GET /proposals/:id
  app.get('/:id', async (req: FastifyRequest<GetByIdParams>, reply) => {
    const proposal = await prisma.proposal.findUnique({
      where: { id: req.params.id },
    })
    if (!proposal) {
      return reply.status(404).send({ success: false, error: 'Proposal not found' })
    }
    return { success: true, data: proposal }
  })

  // POST /proposals（新建即落 draft，返回 ID）
  app.post('/', async (req: FastifyRequest<CreateBody>, reply) => {
    const result = CreateProposalSchema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({ success: false, error: result.error.format() })
    }

    const proposal = await prisma.proposal.create({
      data: result.data,
    })
    return { success: true, data: proposal }
  })

  // PUT /proposals/:id（锁定归属字段，仅改内容）
  app.put('/:id', async (req: FastifyRequest<UpdateParams>, reply) => {
    const result = UpdateProposalSchema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({ success: false, error: result.error.format() })
    }

    try {
      const proposal = await prisma.proposal.update({
        where: { id: req.params.id },
        data: result.data,
      })
      return { success: true, data: proposal }
    } catch (e) {
      return reply.status(404).send({ success: false, error: 'Proposal not found' })
    }
  })

  // PUT /proposals/:id/status（状态变更，用 PUT 避免 CORS 预检）
  app.put('/:id/status', async (req: FastifyRequest<StatusParams>, reply) => {
    const result = UpdateStatusSchema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({ success: false, error: result.error.format() })
    }

    try {
      const proposal = await prisma.proposal.update({
        where: { id: req.params.id },
        data: { status: result.data.status },
      })
      return { success: true, data: proposal }
    } catch (e) {
      return reply.status(404).send({ success: false, error: 'Proposal not found' })
    }
  })

  // PUT /proposals/:id/approve（通过立项：建项目 + 作品设定 re-key + 提案归档）
  app.put('/:id/approve', async (req: FastifyRequest<GetByIdParams>, reply) => {
    const { id } = req.params
    const proposal = await prisma.proposal.findUnique({ where: { id } })
    if (!proposal) {
      return reply.status(404).send({ success: false, error: 'Proposal not found' })
    }
    if (proposal.projectId || proposal.status === 'approved') {
      return reply.status(400).send({ success: false, error: '该提案已立项' })
    }

    // 原子操作：建项目 → 作品设定 proposalId 搬移到 projectId → 提案归档
    const project = await prisma.$transaction(async tx => {
      const created = await tx.project.create({
        data: { title: proposal.title, status: 'planning' },
      })
      await tx.character.updateMany({
        where: { proposalId: id },
        data: { projectId: created.id, proposalId: null },
      })
      await tx.timelineEntry.updateMany({
        where: { proposalId: id },
        data: { projectId: created.id, proposalId: null },
      })
      await tx.creativeFlow.updateMany({
        where: { proposalId: id },
        data: { projectId: created.id, proposalId: null },
      })
      await tx.proposal.update({
        where: { id },
        data: { projectId: created.id, status: 'approved' },
      })
      return created
    })

    return { success: true, data: { projectId: project.id, project } }
  })

  // DELETE /proposals/:id
  app.delete('/:id', async (req: FastifyRequest<GetByIdParams>, reply) => {
    try {
      await prisma.proposal.delete({ where: { id: req.params.id } })
      return { success: true, message: 'Proposal deleted' }
    } catch (e) {
      return reply.status(404).send({ success: false, error: 'Proposal not found' })
    }
  })
}
