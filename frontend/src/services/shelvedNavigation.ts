/** P1-b: derive WorkDetailPage ?from= for shelved projects */

export type WorkDetailFrom = 'planning' | 'writing' | 'editorial' | 'library'

const SOURCE_DIRECT: Record<string, WorkDetailFrom | null> = {
  planning: 'planning',
  writing: 'writing',
  review: 'editorial',
  library: 'library',
  creative: null,
}

export function workDetailFromPreviousStatus(
  previousStatus: string | undefined
): WorkDetailFrom | null {
  if (!previousStatus) return null
  switch (previousStatus) {
    case 'planning':
    case 'planned':
      return 'planning'
    case 'writing':
    case 'written':
      return 'writing'
    case 'reviewing':
    case 'reviewed':
      return 'editorial'
    case 'archived':
    case 'published':
    case 'library':
      return 'library'
    default:
      return null
  }
}

export function resolveShelvedWorkDetailFrom(shelved: {
  source?: string
  previousStatus?: string
}): WorkDetailFrom | null {
  const source = shelved.source
  if (source && Object.prototype.hasOwnProperty.call(SOURCE_DIRECT, source)) {
    return SOURCE_DIRECT[source]
  }
  return workDetailFromPreviousStatus(shelved.previousStatus)
}

export function workDetailPath(projectId: string, from: WorkDetailFrom): string {
  return `/work/${projectId}?from=${from}`
}
