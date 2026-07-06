import { mapProjectStatus } from '../services/status-migration'

/** v4.1.1 五部门桶 + pause */
export const STAGE_BUCKETS = {
  intake: ['imported'],
  planning: ['planning', 'planned'],
  studio: ['writing', 'written'],
  editorial: ['reviewing', 'reviewed'],
  terminal: ['archived'],
  pause: ['shelved'],
} as const

export type StageBucketKey = keyof typeof STAGE_BUCKETS

const STATUS_TO_BUCKET: Partial<Record<string, StageBucketKey>> = {}
for (const [bucket, statuses] of Object.entries(STAGE_BUCKETS)) {
  for (const status of statuses) {
    STATUS_TO_BUCKET[status] = bucket as StageBucketKey
  }
}

/**
 * 桶内白名单 — 替换 projects.ts ALLOWED_TRANSITIONS 跨桶项。
 * 跨桶应走语义端点或 accept-into-planning（#1 / evaluate approve）。
 * P2-11: written→writing 不在此表，仅 POST /undo-written。
 */
export const IN_BUCKET_TRANSITIONS: Record<string, readonly string[]> = {
  planning: ['planning'],
  writing: ['writing'],
  written: [],
  reviewing: ['reviewed', 'reviewing', 'completed'],
  reviewed: ['reviewing'],
  completed: ['reviewing'],
  imported: [],
  planned: ['planning'],   // 0608 原则#4：允许部门内退回 planned→planning
  archived: [],
}

export class StageTransitionError extends Error {
  readonly statusCode = 400

  constructor(
    readonly code: 'CROSS_STAGE_FORBIDDEN' | 'TRANSITION_NOT_ALLOWED',
    readonly from: string,
    readonly to: string,
    readonly fromBucket: StageBucketKey | null,
    readonly toBucket: StageBucketKey | null
  ) {
    super(code)
    this.name = 'StageTransitionError'
  }
}

export function bucketOf(status: string): StageBucketKey | null {
  const mapped = mapProjectStatus(status)
  return STATUS_TO_BUCKET[mapped] ?? null
}

export function allowedNextInBucket(from: string): readonly string[] {
  const mapped = mapProjectStatus(from)
  return IN_BUCKET_TRANSITIONS[mapped] ?? IN_BUCKET_TRANSITIONS[from] ?? []
}

/** 跨桶即抛 CROSS_STAGE_FORBIDDEN */
export function assertSameStage(from: string, to: string): void {
  const mappedFrom = mapProjectStatus(from)
  const mappedTo = mapProjectStatus(to)
  const fromBucket = bucketOf(mappedFrom)
  const toBucket = bucketOf(mappedTo)

  if (!fromBucket || !toBucket || fromBucket !== toBucket) {
    throw new StageTransitionError(
      'CROSS_STAGE_FORBIDDEN',
      mappedFrom,
      mappedTo,
      fromBucket,
      toBucket
    )
  }
}

/**
 * transition 专用：先 assertSameStage，再查桶内白名单（请求 to 字面量 + 映射后 to）。
 */
export function assertAllowedTransition(from: string, to: string): void {
  assertSameStage(from, to)

  const mappedFrom = mapProjectStatus(from)
  const mappedTo = mapProjectStatus(to)
  const allowed = allowedNextInBucket(mappedFrom)

  if (!allowed.includes(to) && !allowed.includes(mappedTo)) {
    throw new StageTransitionError(
      'TRANSITION_NOT_ALLOWED',
      mappedFrom,
      mappedTo,
      bucketOf(mappedFrom),
      bucketOf(mappedTo)
    )
  }
}
