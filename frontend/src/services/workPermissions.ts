import type { Project } from './api'
import {
  hasReleasedToEditorial,
  hasReleasedToLibrary,
  hasReleasedToStudio,
} from './releaseHandoff'

export interface WorkPermissions {
  synopsis: boolean
  chapters: boolean
  body: boolean
  world: boolean
}

const FULL: WorkPermissions = { synopsis: true, chapters: true, body: true, world: true }
const PLAN: WorkPermissions = { synopsis: true, chapters: true, body: false, world: true }
const STUDIO: WorkPermissions = { synopsis: true, chapters: true, body: true, world: true }
const REVIEW: WorkPermissions = { synopsis: false, chapters: false, body: true, world: false }
const READONLY: WorkPermissions = { synopsis: false, chapters: false, body: false, world: false }

/** 按 status + release handoff 返回各 Tab 可写权限（与 workspaceFilters 分桶同构） */
export function getWorkPermissions(
  project: Pick<Project, 'status' | 'metadata'>,
): WorkPermissions {
  const { status } = project

  switch (status) {
    case 'draft':
      return FULL
    case 'planning':
      return PLAN
    case 'planned':
      return hasReleasedToStudio(project) ? STUDIO : PLAN
    case 'writing':
      return STUDIO
    case 'written':
      return hasReleasedToEditorial(project) ? REVIEW : STUDIO
    case 'reviewing':
      return REVIEW
    case 'reviewed':
      return hasReleasedToLibrary(project) ? READONLY : REVIEW
    case 'archived':
      return READONLY
    default:
      return READONLY
  }
}
