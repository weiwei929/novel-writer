import { META_KEYS_DAY1 } from '../constants/metadata-keys'

/**
 * 存量读兼容映射 — 集中管理，不散落在页面。
 * Day1 迁移后 DB 存主体字面量；API 层在 TASK-202 前仍可能暴露旧标签。
 * JSON 键见 META_KEYS_DAY1（§A 条件与 DISCUSSION_SUBMITTED 对齐）。
 */
export const PROJECT_STATUS_MAP: Record<string, string> = {
  imported: 'imported',
  published: 'reviewed',
  pooled: 'shelved',
  trashed: 'shelved',
  draft: 'planning',
  completed: 'reviewed',
}

export const PROPOSAL_STATUS_MAP: Record<string, string> = {
  draft: 'creating',
  submitted: 'created',
  evaluated: 'created',
  rejected: 'creating',
  approved: 'approved',
  shelved: 'shelved',
}

/** 文档锚点：§A 使用 META_KEYS_DAY1.DISCUSSION_SUBMITTED */
export const META_KEYS_FOR_MIGRATION = META_KEYS_DAY1

export function mapProjectStatus(status: string): string {
  return PROJECT_STATUS_MAP[status] ?? status
}

export function mapProposalStatus(status: string): string {
  return PROPOSAL_STATUS_MAP[status] ?? status
}

export function withMappedProjectStatus<T extends { status: string }>(project: T): T {
  return { ...project, status: mapProjectStatus(project.status) }
}

export function withMappedProposalStatus<T extends { status: string }>(proposal: T): T {
  return { ...proposal, status: mapProposalStatus(proposal.status) }
}
