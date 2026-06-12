import type { Project } from './api'

function metadata(project: Pick<Project, 'metadata'>): Record<string, unknown> {
  return (project.metadata as Record<string, unknown>) ?? {}
}

function hasTimestamp(project: Pick<Project, 'metadata'>, key: string): boolean {
  const value = metadata(project)[key]
  return value != null && value !== ''
}

/** 企划课已提交创作室（metadata._releasedToStudioAt） */
export function hasReleasedToStudio(project: Pick<Project, 'metadata'>): boolean {
  return hasTimestamp(project, '_releasedToStudioAt')
}

/** 创作室已提交编审部（metadata._releasedToEditorialAt） */
export function hasReleasedToEditorial(project: Pick<Project, 'metadata'>): boolean {
  return hasTimestamp(project, '_releasedToEditorialAt')
}

/** 编审部已提交文集库（metadata._releasedToLibraryAt） */
export function hasReleasedToLibrary(project: Pick<Project, 'metadata'>): boolean {
  return hasTimestamp(project, '_releasedToLibraryAt')
}
