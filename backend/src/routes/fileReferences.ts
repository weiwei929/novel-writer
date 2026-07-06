import { Prisma } from '@prisma/client'
import { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { prisma } from '../utils/db'
import { ApiResponse } from '../utils/response'

const PROCESSING_TYPES = ['complete', 'partial', 'none'] as const

const ImportSchema = z.object({
  fileName: z.string().min(1),
  content: z.string().min(1),
})

const UpdateSchema = z.object({
  fileName: z.string().optional(),
  processingType: z.enum(PROCESSING_TYPES).optional(),
  proposalId: z.string().uuid().nullable().optional(),
  annotations: z.any().optional(),
  comment: z.string().nullable().optional(),
  tags: z.any().optional(),
})

type GetByIdParams = { Params: { id: string } }
type UpdateBody = { Params: { id: string }; Body: z.infer<typeof UpdateSchema> }

export function autoProcessMarkdown(content: string, fileName: string) {
  const lines = content.split('\n')
  const firstLine = lines[0]?.trim() ?? ''
  const title =
    firstLine.startsWith('#')
      ? firstLine.replace(/^#+\s*/, '').trim()
      : fileName.replace(/\.md$/i, '') || '未命名文件'

  const paragraphs = content
    .split(/\n\n+|(?=^## )/m)
    .map(p => p.trim())
    .filter(Boolean)

  return { title, paragraphs, paragraphCount: paragraphs.length }
}

function normalizeTags(tags: unknown): string[] {
  if (!tags) return []
  if (Array.isArray(tags)) return tags.map(String)
  return []
}

function mapFileRef(row: {
  id: string
  fileName: string
  fileContent: string | null
  fileType: string
  sourceUrl: string | null
  processingType: string
  proposalId: string | null
  annotations: unknown
  comment: string | null
  tags: unknown
  metadata: unknown
  createdAt: Date
  updatedAt: Date
}) {
  return {
    ...row,
    tags: normalizeTags(row.tags),
    metadata: (row.metadata as Record<string, unknown>) || {},
    annotations: (row.annotations as unknown[]) || [],
  }
}

export async function fileReferenceRoutes(app: FastifyInstance) {
  // POST /external-refs/import
  app.post('/import', async (req, reply) => {
    const parsed = ImportSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: parsed.error.format() })
    }

    const { fileName, content } = parsed.data
    const processed = autoProcessMarkdown(content, fileName)

    const created = await prisma.fileReference.create({
      data: {
        fileName,
        fileContent: content,
        fileType: 'md',
        processingType: 'none',
        metadata: processed as Prisma.InputJsonValue,
      },
    })

    return ApiResponse.success(mapFileRef(created), '文件已导入')
  })

  // GET /external-refs
  app.get('/', async (req, reply) => {
    const tag =
      typeof (req.query as { tag?: string }).tag === 'string'
        ? (req.query as { tag: string }).tag
        : undefined

    const rows = await prisma.fileReference.findMany({
      orderBy: { updatedAt: 'desc' },
    })

    let data = rows.map(mapFileRef)
    if (tag) {
      data = data.filter(r => r.tags.includes(tag))
    }

    return ApiResponse.success(data)
  })

  // GET /external-refs/:id
  app.get('/:id', async (req: FastifyRequest<GetByIdParams>, reply) => {
    const row = await prisma.fileReference.findUnique({ where: { id: req.params.id } })
    if (!row) {
      return reply.status(404).send(ApiResponse.error('FileReference not found', 404))
    }
    return ApiResponse.success(mapFileRef(row))
  })

  // PUT /external-refs/:id
  app.put('/:id', async (req: FastifyRequest<UpdateBody>, reply) => {
    const parsed = UpdateSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: parsed.error.format() })
    }

    try {
      const updated = await prisma.fileReference.update({
        where: { id: req.params.id },
        data: {
          ...(parsed.data.fileName !== undefined && { fileName: parsed.data.fileName }),
          ...(parsed.data.processingType !== undefined && {
            processingType: parsed.data.processingType,
          }),
          ...(parsed.data.proposalId !== undefined && { proposalId: parsed.data.proposalId }),
          ...(parsed.data.annotations !== undefined && {
            annotations: parsed.data.annotations as Prisma.InputJsonValue,
          }),
          ...(parsed.data.comment !== undefined && { comment: parsed.data.comment }),
          ...(parsed.data.tags !== undefined && { tags: parsed.data.tags as Prisma.InputJsonValue }),
        },
      })
      return ApiResponse.success(mapFileRef(updated))
    } catch {
      return reply.status(404).send(ApiResponse.error('FileReference not found', 404))
    }
  })

  // DELETE /external-refs/:id
  app.delete('/:id', async (req: FastifyRequest<GetByIdParams>, reply) => {
    try {
      await prisma.fileReference.delete({ where: { id: req.params.id } })
      return ApiResponse.success(null, '已删除')
    } catch {
      return reply.status(404).send(ApiResponse.error('FileReference not found', 404))
    }
  })
}
