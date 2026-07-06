import { FastifyInstance, FastifyRequest } from 'fastify'
import { prisma } from '../utils/db'
import { ApiResponse } from '../utils/response'
import { withMappedProjectStatus, withMappedProposalStatus } from '../services/status-migration'

/**
 * 全局墓园 — 仅 deletedAt IS NOT NULL。
 *
 * OR 设计债：status='shelved' && deletedAt IS NULL → 作品暂存（soft-shelve），不进墓园。
 * 墓园与 status 解耦；shelved ≠ 墓园。
 */
type GraveyardQuery = { Querystring: { type?: string } }

export async function graveyardRoutes(app: FastifyInstance) {
  app.get('/', async (req: FastifyRequest<GraveyardQuery>, reply) => {
    const typeFilter = req.query.type ?? 'all'
    const includeProjects = typeFilter === 'all' || typeFilter === 'project'
    const includeProposals = typeFilter === 'all' || typeFilter === 'proposal'

    if (!includeProjects && !includeProposals) {
      return reply.status(400).send(ApiResponse.error('type must be project, proposal, or all', 400))
    }

    const [projects, proposals] = await Promise.all([
      includeProjects
        ? prisma.project.findMany({
            where: { deletedAt: { not: null } },
            orderBy: { deletedAt: 'desc' },
            select: {
              id: true,
              title: true,
              status: true,
              deletedAt: true,
              greenlitAt: true,
              proposalId: true,
              updatedAt: true,
            },
          })
        : Promise.resolve([]),
      includeProposals
        ? prisma.proposal.findMany({
            where: { deletedAt: { not: null } },
            orderBy: { deletedAt: 'desc' },
            select: {
              id: true,
              title: true,
              status: true,
              deletedAt: true,
              projectId: true,
              updatedAt: true,
            },
          })
        : Promise.resolve([]),
    ])

    return ApiResponse.success({
      projects: projects.map(withMappedProjectStatus),
      proposals: proposals.map(withMappedProposalStatus),
    })
  })
}
