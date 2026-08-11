import { Prisma } from '@prisma/client'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { prisma } from '../utils/db'
import { ApiResponse } from '../utils/response'
import { META_KEYS_DAY1 } from '../constants/metadata-keys'
import { mapProposalStatus } from '../services/status-migration'
import { synopsisFieldsForCreate } from '../utils/workSynopsis'
import { seedWorkSettingFromSketch } from '../utils/workSetting'
import {
  buildOriginContent,
  extractTrackedFields,
  recordWorkNoteDiff,
} from '../utils/workNote'

const PROPOSAL_STATUSES = ['draft', 'submitted', 'evaluated', 'approved', 'rejected', 'shelved', 'formed'] as const

const CreateProposalSchema = z.object({
  title: z.string().min(1),
  synopsis: z.string().optional().nullable(),
  innovation: z.string().optional().nullable(),
  coreSetting: z.string().optional().nullable(),
  references: z.any().optional(),
  sourceNotes: z.string().optional().nullable(),
  metadata: z.any().optional(),
  status: z.enum(PROPOSAL_STATUSES).optional(),
})

const UpdateProposalSchema = CreateProposalSchema.partial()
const UpdateStatusSchema = z.object({ status: z.enum(PROPOSAL_STATUSES) })
const EvaluateSchema = z.object({
  action: z.enum(['approve', 'reject', 'shelve']),
  note: z.string().optional(),
})

type GetByIdParams = { Params: { id: string } }
type CreateBody = { Body: z.infer<typeof CreateProposalSchema> }
type UpdateParams = { Params: { id: string }; Body: z.infer<typeof UpdateProposalSchema> }
type StatusParams = { Params: { id: string }; Body: z.infer<typeof UpdateStatusSchema> }
type EvaluateParams = { Params: { id: string }; Body: z.infer<typeof EvaluateSchema> }

type ProposalForPlanning = {
  id: string
  title: string
  synopsis: string | null
  references: unknown
  metadata: unknown
}

/** #1 / #3 / #4 approve — 唯一 Project 写入点 */
export async function acceptIntoPlanningCore(
  tx: Prisma.TransactionClient,
  proposal: ProposalForPlanning
) {
  const metadata = (proposal.metadata as Record<string, unknown>) || {}
  const now = new Date()
  const synopsisWrite = synopsisFieldsForCreate(proposal.synopsis)
  const workSettingFromSketch = seedWorkSettingFromSketch(metadata._settingSketch)

  const projectMetadata = {
    [META_KEYS_DAY1.SOURCE_FROM]: 'proposal',
    [META_KEYS_DAY1.PROPOSAL_ID_LEGACY]: proposal.id,
    [META_KEYS_DAY1.FROM_EVALUATE]: true,
    [META_KEYS_DAY1.PLANNING_PHASE]: 'evaluating',
    ...(proposal.references ? { attachedReferences: proposal.references } : {}),
    ...(typeof metadata._evaluation === 'string' && metadata._evaluation.trim()
      ? { _evaluation: metadata._evaluation }
      : {}),
    ...(synopsisWrite.metadataSynopsis !== undefined
      ? { synopsis: synopsisWrite.metadataSynopsis }
      : {}),
    ...(workSettingFromSketch ? { workSetting: workSettingFromSketch } : {}),
  }

  const created = await tx.project.create({
    data: {
      title: proposal.title,
      ...(synopsisWrite.description !== undefined
        ? { description: synopsisWrite.description }
        : {}),
      status: 'planning',
      proposalId: proposal.id,
      submittedToPlanningAt: now,
      metadata: projectMetadata as Prisma.InputJsonValue,
    },
  })

  // 创作手记：缘起 + 首轮 synopsis / workSetting（kind=edit，真实立项事件）
  const afterSnap = extractTrackedFields(
    projectMetadata as Record<string, unknown>,
    synopsisWrite.description ?? null
  )
  await recordWorkNoteDiff(tx, created.id, {}, afterSnap, {
    extra: { origin: buildOriginContent(proposal) },
  })

  await tx.character.updateMany({
    where: { proposalId: proposal.id },
    data: { projectId: created.id, proposalId: null },
  })
  await tx.timelineEntry.updateMany({
    where: { proposalId: proposal.id },
    data: { projectId: created.id, proposalId: null },
  })
  await tx.creativeFlow.updateMany({
    where: { proposalId: proposal.id },
    data: { projectId: created.id, proposalId: null },
  })

  // ponytail: 710-A 已拆除立项时按外来参考全文物化章节的暗链（含 _sourceRef fallback）
  // 素材附件跟随是 710-C；此处只止血，不治「带不进素材」

  const updatedProposal = await tx.proposal.update({
    where: { id: proposal.id },
    data: { projectId: created.id, status: 'approved' },
  })

  return { project: created, proposal: updatedProposal }
}

async function acceptIntoPlanning(proposal: ProposalForPlanning) {
  return prisma.$transaction(tx => acceptIntoPlanningCore(tx, proposal))
}

function canAcceptIntoPlanning(status: string): boolean {
  const mapped = mapProposalStatus(status)
  return mapped === 'created' || status === 'created' || status === 'submitted' || status === 'evaluated'
}

async function rejectProposal(id: string, note?: string) {
  const proposal = await prisma.proposal.findUnique({ where: { id } })
  if (!proposal) return null
  const existingMeta = (proposal.metadata as Record<string, unknown>) || {}
  return prisma.proposal.update({
    where: { id },
    data: {
      status: 'creating',
      metadata: {
        ...existingMeta,
        [META_KEYS_DAY1.REJECTED_AT]: new Date().toISOString(),
        ...(note ? { _rejectNote: note } : {}),
      } as Prisma.InputJsonValue,
    },
  })
}

function setEvaluateDeprecation(reply: FastifyReply, proposalId: string, rel: string) {
  reply.header('Deprecation', 'true')
  reply.header('Link', `</api/v2/proposals/${proposalId}/${rel}>; rel="successor-version"`)
}

export async function proposalRoutes(app: FastifyInstance) {
  app.get('/', async (req, reply) => {
    const statusFilter =
      typeof (req.query as { status?: string }).status === 'string'
        ? (req.query as { status: string }).status
        : undefined

    const proposals = await prisma.proposal.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: 'desc' },
    })

    let data = proposals
    if (statusFilter) {
      const statuses = statusFilter.split(',').map(s => s.trim()).filter(Boolean)
      if (statuses.length === 1) {
        data = data.filter(p => p.status === statuses[0])
      } else if (statuses.length > 1) {
        data = data.filter(p => statuses.includes(p.status))
      }
    }

    return { success: true, data }
  })

  app.get('/:id', async (req: FastifyRequest<GetByIdParams>, reply) => {
    const proposal = await prisma.proposal.findFirst({
      where: { id: req.params.id, deletedAt: null },
    })
    if (!proposal) {
      return reply.status(404).send({ success: false, error: 'Proposal not found' })
    }
    return { success: true, data: proposal }
  })

  app.post('/', async (req: FastifyRequest<CreateBody>, reply) => {
    const result = CreateProposalSchema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({ success: false, error: result.error.format() })
    }

    const { status, ...rest } = result.data
    const proposal = await prisma.proposal.create({
      data: {
        ...rest,
        status: status ?? 'draft',
        metadata: rest.metadata as Prisma.InputJsonValue | undefined,
      },
    })
    return { success: true, data: proposal }
  })

  app.put('/:id', async (req: FastifyRequest<UpdateParams>, reply) => {
    const result = UpdateProposalSchema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({ success: false, error: result.error.format() })
    }

    try {
      const proposal = await prisma.proposal.update({
        where: { id: req.params.id },
        data: {
          ...result.data,
          metadata: result.data.metadata as Prisma.InputJsonValue | undefined,
        },
      })
      return { success: true, data: proposal }
    } catch {
      return reply.status(404).send({ success: false, error: 'Proposal not found' })
    }
  })

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
    } catch {
      return reply.status(404).send({ success: false, error: 'Proposal not found' })
    }
  })

  // #1 accept-into-planning
  app.post('/:id/accept-into-planning', async (req: FastifyRequest<GetByIdParams>, reply) => {
    const proposal = await prisma.proposal.findFirst({
      where: { id: req.params.id, deletedAt: null },
    })
    if (!proposal) {
      return reply.status(404).send(ApiResponse.error('Proposal not found', 404))
    }
    if (proposal.projectId || proposal.status === 'approved') {
      return reply.status(400).send(ApiResponse.error('该提案已立项', 400))
    }
    if (!canAcceptIntoPlanning(proposal.status)) {
      return reply.status(400).send(ApiResponse.error('提案状态不允许进入企划课', 400))
    }

    try {
      const { project, proposal: updatedProposal } = await acceptIntoPlanning(proposal)
      return ApiResponse.success({ projectId: project.id, project, proposal: updatedProposal })
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'accept-into-planning failed'
      return reply.status(500).send(ApiResponse.error(message, 500))
    }
  })

  // #2 reject
  app.post('/:id/reject', async (req: FastifyRequest<GetByIdParams>, reply) => {
    const proposal = await prisma.proposal.findFirst({
      where: { id: req.params.id, deletedAt: null },
    })
    if (!proposal) {
      return reply.status(404).send(ApiResponse.error('Proposal not found', 404))
    }
    if (!canAcceptIntoPlanning(proposal.status) && proposal.status !== 'creating') {
      return reply.status(400).send(ApiResponse.error('提案状态不允许退回', 400))
    }

    const note = (req.body as { note?: string } | undefined)?.note
    const updated = await rejectProposal(req.params.id, note)
    if (!updated) {
      return reply.status(404).send(ApiResponse.error('Proposal not found', 404))
    }
    return ApiResponse.success(updated, '已退回创意讨论')
  })

  // #4 evaluate (PUT)
  app.put('/:id/evaluate', async (req: FastifyRequest<EvaluateParams>, reply) => {
    const result = EvaluateSchema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({ success: false, error: result.error.format() })
    }

    const proposal = await prisma.proposal.findFirst({
      where: { id: req.params.id, deletedAt: null },
    })
    if (!proposal) {
      return reply.status(404).send(ApiResponse.error('Proposal not found', 404))
    }

    const { action, note } = result.data
    const existingMeta = (proposal.metadata as Record<string, unknown>) || {}

    try {
      if (action === 'approve') {
        if (proposal.projectId || proposal.status === 'approved') {
          return reply.status(400).send(ApiResponse.error('该提案已立项', 400))
        }
        if (!canAcceptIntoPlanning(proposal.status)) {
          return reply.status(400).send(ApiResponse.error('提案状态不允许立项', 400))
        }
        setEvaluateDeprecation(reply, req.params.id, 'accept-into-planning')
        const { project, proposal: updatedProposal } = await acceptIntoPlanning(proposal)
        return ApiResponse.success(
          { projectId: project.id, project, proposal: updatedProposal },
          note ? `已同意立项：${note}` : '已同意立项'
        )
      }

      if (action === 'reject') {
        setEvaluateDeprecation(reply, req.params.id, 'reject')
        const updated = await rejectProposal(req.params.id, note)
        if (!updated) {
          return reply.status(404).send(ApiResponse.error('Proposal not found', 404))
        }
        return ApiResponse.success(updated, '已退回创意讨论')
      }

      const updated = await prisma.proposal.update({
        where: { id: req.params.id },
        data: {
          status: 'shelved',
          metadata: {
            ...existingMeta,
            ...(note ? { _shelveNote: note } : {}),
          } as Prisma.InputJsonValue,
        },
      })
      return ApiResponse.success(updated, '已移入作品暂存')
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Evaluate failed'
      return reply.status(500).send(ApiResponse.error(message, 500))
    }
  })

  // #3 approve (PUT legacy — thin wrapper → same core as #1)
  app.put('/:id/approve', async (req: FastifyRequest<GetByIdParams>, reply) => {
    const proposal = await prisma.proposal.findFirst({
      where: { id: req.params.id, deletedAt: null },
    })
    if (!proposal) {
      return reply.status(404).send({ success: false, error: 'Proposal not found' })
    }
    if (proposal.projectId || proposal.status === 'approved') {
      return reply.status(400).send({ success: false, error: '该提案已立项' })
    }
    if (!canAcceptIntoPlanning(proposal.status)) {
      return reply.status(400).send({ success: false, error: '提案状态不允许立项' })
    }
    try {
      const { project, proposal: updatedProposal } = await acceptIntoPlanning(proposal)
      return { success: true, data: { projectId: project.id, project, proposal: updatedProposal } }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Approve failed'
      return reply.status(500).send({ success: false, error: message })
    }
  })

  app.delete('/:id', async (req: FastifyRequest<GetByIdParams>, reply) => {
    try {
      await prisma.proposal.delete({ where: { id: req.params.id } })
      return { success: true, message: 'Proposal deleted' }
    } catch {
      return reply.status(404).send({ success: false, error: 'Proposal not found' })
    }
  })
}
