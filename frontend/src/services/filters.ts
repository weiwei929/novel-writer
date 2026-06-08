import { mapProposalStatus, mapProjectStatus } from './status-migration'
import type { Proposal, Project } from './api'

/** 提案是否处于「可提交到企划课评估」的状态 */
export function isProposalSubmittable(p: Proposal): boolean {
  const s = mapProposalStatus(p.status)
  return s === 'creating'
}

/** 提案是否处于「企划课待评估」状态 */
export function isProposalPendingReview(p: Proposal): boolean {
  const s = mapProposalStatus(p.status)
  return s === 'created'
}

/** 提案是否已审批通过 */
export function isProposalApproved(p: Proposal): boolean {
  return mapProposalStatus(p.status) === 'approved'
}

/** Project 是否处于企划课阶段 */
export function isProjectPlanning(p: Project): boolean {
  const s = mapProjectStatus(p.status)
  return s === 'planning' || s === 'planned'
}

/** Project 是否处于创作室阶段 */
export function isProjectStudio(p: Project): boolean {
  const s = mapProjectStatus(p.status)
  return s === 'planned' || s === 'writing' || s === 'written'
}
