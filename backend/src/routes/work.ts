import { FastifyInstance, FastifyRequest } from 'fastify'
import { prisma } from '../utils/db'
import { withMappedProjectStatus } from '../services/status-migration'
import { ApiResponse } from '../utils/response'

type GetByIdParams = { Params: { id: string } }

export async function workRoutes(app: FastifyInstance) {
  // GET /api/v2/work/:id — 聚合作品详情（projectId only）
  app.get('/:id', async (req: FastifyRequest<GetByIdParams>, reply) => {
    const { id } = req.params

    const project = await prisma.project.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: { select: { chapters: true } },
      },
    })

    if (!project) {
      return reply.status(404).send(ApiResponse.error('Project not found', 404))
    }

    const [chapters, characters, timelineEntries, creativeFlows, proposal] = await Promise.all([
      prisma.chapter.findMany({
        where: { projectId: id },
        orderBy: { order: 'asc' },
      }),
      prisma.character.findMany({
        where: { projectId: id },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.timelineEntry.findMany({
        where: { projectId: id },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.creativeFlow.findMany({
        where: { projectId: id },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.proposal.findFirst({ where: { projectId: id } }),
    ])

    const { _count, ...projectData } = project

    return ApiResponse.success({
      project: {
        ...withMappedProjectStatus(projectData),
        chapterCount: _count.chapters,
      },
      chapters,
      characters,
      timelineEntries,
      creativeFlows,
      proposal: proposal ?? undefined,
    })
  })
}
