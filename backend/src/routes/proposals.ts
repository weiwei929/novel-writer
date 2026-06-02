import { Prisma } from '@prisma/client'
import { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { prisma } from '../utils/db'
import { ApiResponse } from '../utils/response'

const PROPOSAL_STATUSES = ['draft', 'submitted', 'evaluated', 'approved', 'rejected', 'shelved'] as const

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

const UpdateStatusSchema = z.object({
  status: z.enum(PROPOSAL_STATUSES),
})

const EvaluateSchema = z.object({
  action: z.enum(['approve', 'reject', 'shelve']),
  note: z.string().optional(),
})

type GetByIdParams = { Params: { id: string } }
type CreateBody = { Body: z.infer<typeof CreateProposalSchema> }
type UpdateParams = { Params: { id: string }; Body: z.infer<typeof UpdateProposalSchema> }
type StatusParams = { Params: { id: string }; Body: z.infer<typeof UpdateStatusSchema> }
type EvaluateParams = { Params: { id: string }; Body: z.infer<typeof EvaluateSchema> }

function splitParagraphs(content: string): string[] {
  return content
    .split(/\n\n+|(?=^## )/m)
    .map(p => p.trim())
    .filter(Boolean)
}

function paragraphTitle(paragraph: string, index: number): string {
  const first = paragraph.split('\n')[0]?.trim() ?? ''
  if (first.startsWith('## ')) return first.replace(/^##+\s*/, '').trim()
  if (first.startsWith('# ')) return first.replace(/^#+\s*/, '').trim()
  return `第 ${index + 1} 节`
}

async function approveProposal(proposal: {
  id: string
  title: string
  synopsis: string | null
  references: unknown
  metadata: unknown
}) {
  const metadata = (proposal.metadata as Record<string, unknown>) || {}
  const refs = Array.isArray(proposal.references) ? proposal.references : []

  const project = await prisma.$transaction(async tx => {
    const created = await tx.project.create({
      data: {
        title: proposal.title,
        description: proposal.synopsis ?? undefined,
        status: 'draft',
        metadata: {
          _sourceFrom: 'proposal',
          _proposalId: proposal.id,
          _evaluation: metadata._evaluation,
        } as Prisma.InputJsonValue,
      },
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

    const sourceRef = refs.find(
      (r: { type?: string; processingType?: string }) =>
        r.type === 'file_ref' && r.processingType === 'complete'
    ) as { id?: string } | undefined

    const metaSource = metadata._sourceRef as { type?: string; id?: string } | undefined
    const fileRefId =
      sourceRef?.id ?? (metaSource?.type === 'file_ref' ? metaSource.id : undefined)

    if (fileRefId) {
      const fileRef = await tx.fileReference.findUnique({ where: { id: fileRefId } })
      if (fileRef?.fileContent) {
        const meta = (fileRef.metadata as { paragraphs?: string[] }) || {}
        const paragraphs =
          meta.paragraphs?.length ? meta.paragraphs : splitParagraphs(fileRef.fileContent)

        if (paragraphs.length > 0) {
          await tx.chapter.createMany({
            data: paragraphs.map((p, i) => ({
              projectId: created.id,
              title: paragraphTitle(p, i),
              content: p,
              order: i + 1,
              status: 'draft',
              wordCount: p.replace(/\s/g, '').length,
            })),
          })
        }
      }
    }

    await tx.proposal.update({
      where: { id: proposal.id },
      data: { projectId: created.id, status: 'approved' },
    })

    return created
  })

  return project
}

export async function proposalRoutes(app: FastifyInstance) {
  app.get('/', async (req, reply) => {
    const statusFilter =
      typeof (req.query as { status?: string }).status === 'string'
        ? (req.query as { status: string }).status
        : undefined

    const proposals = await prisma.proposal.findMany({
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
    const proposal = await prisma.proposal.findUnique({
      where: { id: req.params.id },
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

  app.put('/:id/evaluate', async (req: FastifyRequest<EvaluateParams>, reply) => {
    const result = EvaluateSchema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({ success: false, error: result.error.format() })
    }

    const proposal = await prisma.proposal.findUnique({ where: { id: req.params.id } })
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
        const project = await approveProposal(proposal)
        return ApiResponse.success(
          { projectId: project.id, project },
          note ? `已同意立项：${note}` : '已同意立项'
        )
      }

      if (action === 'reject') {
        const updated = await prisma.proposal.update({
          where: { id: req.params.id },
          data: {
            status: 'rejected',
            metadata: {
              ...existingMeta,
              ...(note ? { _rejectNote: note } : {}),
            } as Prisma.InputJsonValue,
          },
        })
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

  app.put('/:id/approve', async (req: FastifyRequest<GetByIdParams>, reply) => {
    const proposal = await prisma.proposal.findUnique({ where: { id: req.params.id } })
    if (!proposal) {
      return reply.status(404).send({ success: false, error: 'Proposal not found' })
    }
    if (proposal.projectId || proposal.status === 'approved') {
      return reply.status(400).send({ success: false, error: '该提案已立项' })
    }
    try {
      const project = await approveProposal(proposal)
      return { success: true, data: { projectId: project.id, project } }
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
