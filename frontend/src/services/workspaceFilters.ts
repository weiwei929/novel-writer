import type { Project, Proposal } from './api'
import {
  hasReleasedToEditorial,
  hasReleasedToLibrary,
  hasReleasedToStudio,
} from './releaseHandoff'

/** 待企划 — 企划建议书 submitted / evaluated */
export function isPendingPlanningProposal(p: Proposal): boolean {
  return p.status === 'submitted' || p.status === 'evaluated'
}

/** 0608 企划课三列：待企划 + 企划进行中 + 已完成企划（未提交创作室） */
export function inPlanningWorkspace(p: Project): boolean {
  return p.status === 'planning' || (p.status === 'planned' && !hasReleasedToStudio(p))
}

/** 0608 创作室三列：待创作 + 创作中 + 已完成创作（未提交编审部） */
export function inStudioWorkspace(p: Project): boolean {
  return (
    (p.status === 'planned' && hasReleasedToStudio(p)) ||
    p.status === 'writing' ||
    (p.status === 'written' && !hasReleasedToEditorial(p))
  )
}

/** 0608 编审部三列：待审阅 + 审阅中 + 已完成审阅（未提交文集库） */
export function inEditorialWorkspace(p: Project): boolean {
  return (
    (p.status === 'written' && hasReleasedToEditorial(p)) ||
    p.status === 'reviewing' ||
    (p.status === 'reviewed' && !hasReleasedToLibrary(p))
  )
}

/** 0608 文集库：待归库 + 已归档 */
export function inLibraryWorkspace(p: Project): boolean {
  return (p.status === 'reviewed' && hasReleasedToLibrary(p)) || p.status === 'archived'
}

export function countPlanningWorkspace(proposals: Proposal[], projects: Project[]): number {
  return proposals.filter(isPendingPlanningProposal).length + projects.filter(inPlanningWorkspace).length
}

export function countStudioWorkspace(projects: Project[]): number {
  return projects.filter(inStudioWorkspace).length
}

export function countEditorialWorkspace(projects: Project[]): number {
  return projects.filter(inEditorialWorkspace).length
}

export function countLibraryWorkspace(projects: Project[]): number {
  return projects.filter(inLibraryWorkspace).length
}
