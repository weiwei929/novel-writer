/**
 * Day 1 metadata JSON 键契约（M1-A TASK-200/201/202 唯一命名源）
 * 禁止在路由/迁移脚本中硬编码字符串字面量。
 */
export const META_KEYS_DAY1 = {
  FROM_EVALUATE: '_fromEvaluate',
  SOURCE_FROM: '_sourceFrom',
  PROPOSAL_ID_LEGACY: '_proposalId',
  PLANNING_PHASE: '_planningPhase',
  DISCUSSION_SUBMITTED: '_discussionSubmitted',
  /** 嵌套在 metadata._shelved.previousStatus */
  SHELVED: '_shelved',
  REJECTED_AT: '_rejectedAt',
} as const

export type PlanningPhase = 'evaluating' | 'setup' | 'deferred'
export type SourceFrom = 'proposal' | 'import' | 'seed'
