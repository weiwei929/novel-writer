import { mapProjectStatus, mapProposalStatus } from './status-migration'

export type PhaseContext = 'planning' | 'studio' | 'editorial' | 'library'

/**
 * 按阶段上下文返回 project 状态标签
 * §0 约定：同一 status 在不同阶段显示不同标签
 */
export function getProjectStatusLabel(status: string, phase: PhaseContext): string {
  const s = mapProjectStatus(status)

  if (phase === 'planning') {
    switch (s) {
      case 'planning':
        return '企划进行中'
      case 'planned':
        return '企划已完成'
      default:
        return s
    }
  }
  if (phase === 'studio') {
    switch (s) {
      case 'planned':
        return '待创作作品'
      case 'writing':
        return '创作中作品'
      case 'written':
        return '已创作作品'
      default:
        return s
    }
  }
  if (phase === 'editorial') {
    switch (s) {
      case 'written':
        return '待审阅作品'
      case 'reviewing':
        return '审阅中作品'
      case 'reviewed':
        return '已审阅作品'
      default:
        return s
    }
  }
  if (phase === 'library') {
    switch (s) {
      case 'reviewed':
        return '待归库作品'
      case 'archived':
        return '已归档作品'
      default:
        return s
    }
  }

  return s
}

export function getProposalStatusLabel(status: string): string {
  const s = mapProposalStatus(status)
  const labels: Record<string, string> = {
    creating: '待提交',
    created: '已提交',
    approved: '已通过评估',
    rejected: '已驳回',
    shelved: '作品暂存',
  }
  return labels[s] ?? s
}
