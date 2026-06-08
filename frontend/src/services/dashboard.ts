import { collectionsApi, projectsApi, proposalsApi, type Project, type Proposal } from './api'

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
    approved: '已通过',
    rejected: '已退回',
    shelved: '已暂存',
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

function mapProjectItem(p: Project, stageId: DashboardStageId): DashboardListItem {
  const href =
    stageId === 'planning'
      ? '/planning/in-progress'
      : stageId === 'writing'
        ? '/writing/projects'
        : stageId === 'review'
          ? '/editorial'
          : '/library'
  return {
    id: p.id,
    title: p.title,
    status: p.status,
    updatedAt: p.updatedAt,
    href,
  }
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const [proposals, projects, collections] = await Promise.all([
    proposalsApi.getAll(),
    projectsApi.getAll(),
    collectionsApi.getAll(),
  ])

  const activeProposals = proposals.filter(
    p => !['shelved'].includes(p.status) || p.status === 'submitted'
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

  const planningItems = projects
    .filter(p => p.status === 'draft' || p.status === 'planning')
    .slice(0, 5)
    .map(p => mapProjectItem(p, 'planning'))

  const writingItems = projects
    .filter(p => p.status === 'writing')
    .slice(0, 5)
    .map(p => mapProjectItem(p, 'writing'))

  const reviewItems = projects
    .filter(p => p.status === 'reviewing')
    .slice(0, 5)
    .map(p => mapProjectItem(p, 'review'))

  const libraryItems = projects
    .filter(p => p.status === 'completed' || p.status === 'archived')
    .slice(0, 5)
    .map(p => mapProjectItem(p, 'library'))

  const activity: DashboardOverview['activity'] = []

  for (const p of proposals.slice(0, 8)) {
    if (p.status === 'approved' && p.projectId) {
      activity.push({
        time: p.updatedAt,
        text: `创意组「${p.title}」已通过 → 进入企划课`,
        href: '/planning/in-progress',
      })
    } else if (p.status === 'submitted') {
      activity.push({
        time: p.updatedAt,
        text: `创意组「${p.title}」已提交企划建议书`,
        href: '/planning/proposals',
      })
    }
  }

  for (const p of projects.slice(0, 5)) {
    if (p.status === 'writing') {
      activity.push({
        time: p.updatedAt,
        text: `创作室「${p.title}」有更新`,
        href: '/writing/projects',
      })
    }
    if (p.status === 'completed') {
      activity.push({
        time: p.updatedAt,
        text: `文集库「${p.title}」已完成`,
        href: '/library',
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
      count: projects.filter(p => p.status === 'draft' || p.status === 'planning').length,
      items: planningItems,
    },
    writing: {
      count: projects.filter(p => p.status === 'writing').length,
      items: writingItems,
    },
    review: {
      count: projects.filter(p => p.status === 'reviewing').length,
      items: reviewItems,
    },
    library: {
      count:
        projects.filter(p => p.status === 'completed' || p.status === 'archived').length +
        collections.length,
      items: libraryItems,
    },
    activity: activity.slice(0, 8),
  }
}
