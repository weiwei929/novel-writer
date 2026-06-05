/**
 * Day 1 status 字面量（M1-A TASK-200 唯一命名源）
 * 新写入禁止 legacy 别名；存量读映射见 TASK-201 status-migration。
 */

export const PROJECT_STATUS_PRIMARY = [
  'imported',
  'planning',
  'planned',
  'writing',
  'written',
  'reviewing',
  'reviewed',
  'archived',
  'shelved',
] as const

export const PROJECT_STATUS_LEGACY_READ = ['draft', 'completed'] as const

export const PROPOSAL_STATUS_PRIMARY = [
  'creating',
  'created',
  'approved',
  'shelved',
] as const

export const PROPOSAL_STATUS_LEGACY_READ = [
  'draft',
  'submitted',
  'evaluated',
  'rejected',
] as const

export type ProjectStatusPrimary = (typeof PROJECT_STATUS_PRIMARY)[number]
export type ProjectStatusLegacyRead = (typeof PROJECT_STATUS_LEGACY_READ)[number]
export type ProposalStatusPrimary = (typeof PROPOSAL_STATUS_PRIMARY)[number]
export type ProposalStatusLegacyRead = (typeof PROPOSAL_STATUS_LEGACY_READ)[number]

export const PROJECT_STATUS_ALL = [
  ...PROJECT_STATUS_PRIMARY,
  ...PROJECT_STATUS_LEGACY_READ,
] as const

export const PROPOSAL_STATUS_ALL = [
  ...PROPOSAL_STATUS_PRIMARY,
  ...PROPOSAL_STATUS_LEGACY_READ,
] as const

export type ProjectStatus = (typeof PROJECT_STATUS_ALL)[number]
export type ProposalStatus = (typeof PROPOSAL_STATUS_ALL)[number]

const PROJECT_WRITE_FORBIDDEN = new Set<string>(PROJECT_STATUS_LEGACY_READ)
const PROPOSAL_WRITE_FORBIDDEN = new Set<string>(PROPOSAL_STATUS_LEGACY_READ)

export function assertProjectStatusForWrite(status: string): void {
  if (PROJECT_WRITE_FORBIDDEN.has(status)) {
    throw new Error(`Project.status "${status}" is legacy read-only; use primary literals`)
  }
  if (!(PROJECT_STATUS_PRIMARY as readonly string[]).includes(status)) {
    throw new Error(`Project.status "${status}" is not a Day1 primary literal`)
  }
}

export function assertProposalStatusForWrite(status: string): void {
  if (PROPOSAL_WRITE_FORBIDDEN.has(status)) {
    throw new Error(`Proposal.status "${status}" is legacy read-only; use primary literals`)
  }
  if (!(PROPOSAL_STATUS_PRIMARY as readonly string[]).includes(status)) {
    throw new Error(`Proposal.status "${status}" is not a Day1 primary literal`)
  }
}
