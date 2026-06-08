/**
 * 前端状态映射 — 与后端 status-migration.ts 一一对应
 * 所有 proposalsApi / projectsApi ingest 层统一应用
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

export function mapProjectStatus(status: string): string {
  return PROJECT_STATUS_MAP[status] ?? status
}

export function mapProposalStatus(status: string): string {
  return PROPOSAL_STATUS_MAP[status] ?? status
}
