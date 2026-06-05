import { Prisma, Project } from '@prisma/client'
import { prisma } from '../utils/db'
import { META_KEYS_DAY1 } from '../constants/metadata-keys'
import { mapProjectStatus } from './status-migration'

export class ProjectNotFoundError extends Error {
  readonly statusCode = 404
  constructor(id: string) {
    super(`Project not found: ${id}`)
  }
}

export class StatusNotAllowedError extends Error {
  readonly statusCode = 400
  constructor(current: string, allowed: readonly string[]) {
    super(`Status "${current}" not allowed; expected one of: ${allowed.join(', ')}`)
  }
}

export class ProjectInGraveyardError extends Error {
  readonly statusCode = 400
  constructor() {
    super('Project is in graveyard (deletedAt set)')
  }
}

export async function assertProjectExists(id: string): Promise<Project> {
  const project = await prisma.project.findUnique({ where: { id } })
  if (!project) throw new ProjectNotFoundError(id)
  return project
}

/** Active list/detail: excludes graveyard */
export async function loadActiveProject(id: string): Promise<Project> {
  const project = await prisma.project.findFirst({
    where: { id, deletedAt: null },
  })
  if (!project) throw new ProjectNotFoundError(id)
  return project
}

export function assertNotDeleted(project: Pick<Project, 'deletedAt'>): void {
  if (project.deletedAt) throw new ProjectInGraveyardError()
}

export function assertStatusFor(current: string, allowed: readonly string[]): void {
  const normalized = mapProjectStatus(current)
  if (!allowed.includes(current) && !allowed.includes(normalized)) {
    throw new StatusNotAllowedError(current, allowed)
  }
}

export function setTimestampIfNull<T extends Record<string, unknown>>(
  data: T,
  field: keyof T,
  value: Date = new Date()
): T {
  if (data[field] != null) return data
  return { ...data, [field]: value }
}

export function mergeMetadata(
  base: Record<string, unknown>,
  patch: Record<string, unknown>
): Prisma.InputJsonValue {
  return { ...base, ...patch } as Prisma.InputJsonValue
}

export function buildShelvedMetadata(
  metadata: Record<string, unknown>,
  previousStatus: string,
  source: string
): Prisma.InputJsonValue {
  return mergeMetadata(metadata, {
    [META_KEYS_DAY1.SHELVED]: {
      previousStatus,
      shelvedAt: new Date().toISOString(),
      source,
    },
  })
}

export async function unshelveToPlanning(projectId: string): Promise<Project> {
  const project = await assertProjectExists(projectId)
  assertNotDeleted(project)
  assertStatusFor(project.status, ['shelved'])

  const metadata = (project.metadata as Record<string, unknown>) || {}
  const { [META_KEYS_DAY1.SHELVED]: _removed, ...rest } = metadata

  return prisma.project.update({
    where: { id: projectId },
    data: {
      status: 'planning',
      metadata: rest as Prisma.InputJsonValue,
    },
  })
}
