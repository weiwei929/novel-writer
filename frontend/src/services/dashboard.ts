import { projectsApi, proposalsApi, type Project, type Proposal } from './api'
import {
  hasReleasedToEditorial,
  hasReleasedToLibrary,
  hasReleasedToStudio,
} from './releaseHandoff'

export type DashboardStageId = 'creative' | 'planning' | 'writing' | 'review' | 'library'

export interface DashboardListItem {
  id: string
  title: string
  status: string
  updatedAt?: string
  href: string
  statusLabel?: string
}

export interface DashboardStageSlice {
  count: number
  items: DashboardListItem[]
}

export interface DashboardOverview {
  creative: DashboardStageSlice
  planning: DashboardStageSlice
  writing: DashboardStageSlice
  review: DashboardStageSlice
  library: DashboardStageSlice
  activity: { time: string; text: string; href?: string }[]
}

function proposalStatusLabel(status: string): string {
  const map: Record<string, string> = {
    draft: '讨论中',
    submitted: '待评估',
    approved: '已接收入企划课',
    rejected: '已退回',
    shelved: '已放入文件暂存',
    evaluated: '已评估',
  }
  return map[status] || status
}

function mapProposalItem(p: Proposal): DashboardListItem {
  const meta = (p.metadata as { _discussionSubmitted?: boolean }) || {}
  const status =
    p.status === 'draft' && meta._discussionSubmitted ? 'submitted' : p.status
  return {
    id: p.id,
    title: p.title,
    status: p.status,
    updatedAt: p.updatedAt,
    href: `/creative/proposals/${p.id}`,
    statusLabel: proposalStatusLabel(status),
  }
}

function mapPlanningProposalItem(p: Proposal): DashboardListItem {
  const item = mapProposalItem(p)
  return { ...item, href: `/planning/proposals/${p.id}` }
}

function mapProjectItem(p: Project, stageId: DashboardStageId): DashboardListItem {
  const href =
    stageId === 'planning' ? `/planning/in-progress` :
    stageId === 'writing' ? `/writing/projects` :
    stageId === 'review' ? `/editorial` :
    `/library`
  return {
    id: p.id,
    title: p.title,
    status: p.status,
    updatedAt: p.updatedAt,
    href,
  }
}

function takeRecentItems(items: DashboardListItem[], limit: number): DashboardListItem[] {
  return [...items]
    .sort((a, b) => {
      const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
      const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
      return tb - ta
    })
    .slice(0, limit)
}

/** 0608 企划课三列：待企划 + 企划进行中 + 已完成企划（未提交创作室） */
function inPlanningWorkspace(p: Project): boolean {
  return p.status === 'planning' || (p.status === 'planned' && !hasReleasedToStudio(p))
}

function isPlanningProposal(p: Proposal): boolean {
  return p.status === 'submitted' || p.status === 'evaluated'
}

/** 0608 创作室三列：待创作 + 创作中 + 已完成创作（未提交编审部） */
function inStudioWorkspace(p: Project): boolean {
  return (
    (p.status === 'planned' && hasReleasedToStudio(p)) ||
    p.status === 'writing' ||
    (p.status === 'written' && !hasReleasedToEditorial(p))
  )
}

/** 0608 编审部三列：待审阅 + 审阅中 + 已完成审阅（未提交文集库） */
function inEditorialWorkspace(p: Project): boolean {
  return (
    (p.status === 'written' && hasReleasedToEditorial(p)) ||
    p.status === 'reviewing' ||
    (p.status === 'reviewed' && !hasReleasedToLibrary(p))
  )
}

/** 0608 文集库：待归库 + 已归档 */
function inLibraryWorkspace(p: Project): boolean {
  return (p.status === 'reviewed' && hasReleasedToLibrary(p)) || p.status === 'archived'
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const [proposals, projects] = await Promise.all([
    proposalsApi.getAll(),
    projectsApi.getAll(),
  ])

  const activeProposals = proposals.filter(
    p => p.status !== 'shelved'  // Legacy filter — 0608 移除 shelved 用户路径（F-003）
  )

  const creativeItems = proposals
    .filter(
      p =>
        p.status === 'draft' ||
        p.status === 'submitted' ||
        p.status === 'rejected'
    )
    .slice(0, 5)
    .map(mapProposalItem)

  const planningProposals = proposals.filter(isPlanningProposal)
  const planningProjects = projects.filter(inPlanningWorkspace)
  const planningItems = takeRecentItems(
    [
      ...planningProposals.map(mapPlanningProposalItem),
      ...planningProjects.map(p => mapProjectItem(p, 'planning')),
    ],
    5,
  )

  const studioProjects = projects.filter(inStudioWorkspace)
  const writingItems = takeRecentItems(
    studioProjects.map(p => mapProjectItem(p, 'writing')),
    5,
  )

  const editorialProjects = projects.filter(inEditorialWorkspace)
  const reviewItems = takeRecentItems(
    editorialProjects.map(p => mapProjectItem(p, 'review')),
    5,
  )

  const libraryProjects = projects.filter(inLibraryWorkspace)
  const libraryItems = takeRecentItems(
    libraryProjects.map(p => mapProjectItem(p, 'library')),
    5,
  )

  const activity: DashboardOverview['activity'] = []

  for (const p of proposals.slice(0, 8)) {
    if (p.status === 'approved' && p.projectId) {
      activity.push({
        time: p.updatedAt,
        text: `创意组「${p.title}」已接收入企划课`,
        href: `/planning/in-progress`,
      })
    } else if (p.status === 'submitted') {
      activity.push({
        time: p.updatedAt,
        text: `创意组「${p.title}」已提交企划建议书`,
        href: `/planning/proposals`,
      })
    }
  }

  for (const p of projects) {
    if (p.status === 'writing') {
      activity.push({
        time: p.updatedAt,
        text: `创作室「${p.title}」有更新`,
        href: `/writing/projects`,
      })
    }
    if (p.status === 'reviewed' && hasReleasedToLibrary(p)) {
      activity.push({
        time: p.updatedAt,
        text: `文集库「${p.title}」待归库`,
        href: `/library`,
      })
    }
  }

  activity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

  return {
    creative: {
      count: activeProposals.filter(p => ['draft', 'submitted', 'rejected'].includes(p.status))
        .length,
      items: creativeItems,
    },
    planning: {
      count: planningProposals.length + planningProjects.length,
      items: planningItems,
    },
    writing: {
      count: studioProjects.length,
      items: writingItems,
    },
    review: {
      count: editorialProjects.length,
      items: reviewItems,
    },
    library: {
      count: libraryProjects.length,
      items: libraryItems,
    },
    activity: activity.slice(0, 8),
  }
}
