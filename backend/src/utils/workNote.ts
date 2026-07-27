/**
 * TASK-700-F — 创作手记静默记录
 * kind: edit = 真实变更时刻；initial = 上线补拍（recordedAt 不可信为创作时刻）
 */

import type { PrismaClient } from '@prisma/client'
import { normalizeChapterPlanning } from './chapterPlanning'
import { WORK_SETTING_KEYS, normalizeWorkSetting } from './workSetting'
import { normalizeSynopsisText } from './workSynopsis'

export const WORK_NOTE_KINDS = ['edit', 'initial'] as const
export type WorkNoteKind = (typeof WORK_NOTE_KINDS)[number]

export const WORK_NOTE_TRACKED_FIELDS = [
  'origin',
  'synopsis',
  'charactersAndRelations',
  'timeAndPlace',
  'eventsAndPlot',
  'narrativeStyle',
  'chapterPlanning',
] as const

export type WorkNoteTrackedField = (typeof WORK_NOTE_TRACKED_FIELDS)[number]

export type WorkNoteFieldSnapshot = Partial<Record<WorkNoteTrackedField, string>>

/** PrismaClient 与 TransactionClient 均暴露 workNote */
type DbClient = Pick<PrismaClient, 'workNote'>

/** canonical JSON：normalize 后按 order 的数组，键序固定为 order/title/summary；无章则空串 */
export function serializeChapterPlanningContent(value: unknown): string {
  const items = normalizeChapterPlanning(value).map(item => ({
    order: item.order,
    title: item.title,
    summary: item.summary,
  }))
  if (items.length === 0) return ''
  return JSON.stringify(items)
}

/** synopsis：metadata.synopsis 优先，空则 fallback description（与读模型一致） */
export function readSynopsisContent(
  metadata: Record<string, unknown> | null | undefined,
  description?: string | null
): string {
  const fromMeta = normalizeSynopsisText(metadata?.synopsis)
  if (fromMeta) return fromMeta
  return normalizeSynopsisText(description) ?? ''
}

export function extractTrackedFields(
  metadata: Record<string, unknown> | null | undefined,
  description?: string | null
): WorkNoteFieldSnapshot {
  const meta = metadata ?? {}
  const ws = normalizeWorkSetting(meta.workSetting)
  const snap: WorkNoteFieldSnapshot = {
    synopsis: readSynopsisContent(meta, description),
    charactersAndRelations: ws.charactersAndRelations,
    timeAndPlace: ws.timeAndPlace,
    eventsAndPlot: ws.eventsAndPlot,
    narrativeStyle: ws.narrativeStyle,
    chapterPlanning: serializeChapterPlanningContent(meta.chapterPlanning),
  }
  return snap
}

export type OriginProposalInput = {
  title: string
  synopsis: string | null
  metadata: unknown
}

/** 立项缘起快照：title + synopsis + _sourceNote + 非空 sketch */
export function buildOriginContent(proposal: OriginProposalInput): string {
  const meta =
    proposal.metadata && typeof proposal.metadata === 'object' && !Array.isArray(proposal.metadata)
      ? (proposal.metadata as Record<string, unknown>)
      : {}
  const lines: string[] = []
  lines.push(`标题：${proposal.title.trim() || '（未命名）'}`)
  const syn = normalizeSynopsisText(proposal.synopsis)
  if (syn) lines.push(`梗概：${syn}`)
  if (typeof meta._sourceNote === 'string' && meta._sourceNote.trim()) {
    lines.push(`来源：${meta._sourceNote.trim()}`)
  }
  const sketch = normalizeWorkSetting(meta._settingSketch)
  const sketchParts = WORK_SETTING_KEYS.map(k => {
    const v = sketch[k].trim()
    return v ? `${k}=${v}` : null
  }).filter((x): x is string => x != null)
  if (sketchParts.length > 0) {
    lines.push(`设定雏形：${sketchParts.join('；')}`)
  }
  return lines.join('\n')
}

async function latestContent(
  db: DbClient,
  projectId: string,
  field: string
): Promise<string | null> {
  const row = await db.workNote.findFirst({
    where: { projectId, field },
    orderBy: { recordedAt: 'desc' },
    select: { content: true },
  })
  return row?.content ?? null
}

export type RecordWorkNoteDiffOptions = {
  kind?: WorkNoteKind
  /** 额外强制写入的 field（如 origin），不受 extract 限制 */
  extra?: WorkNoteFieldSnapshot
  /** initial 快照时：跳过空 content */
  skipEmpty?: boolean
}

/**
 * 比较 before/after（及 extra），按 field 去重后插入。
 * 与该 projectId+field 最新一条 content 相同则跳过。
 */
export async function recordWorkNoteDiff(
  db: DbClient,
  projectId: string,
  before: WorkNoteFieldSnapshot,
  after: WorkNoteFieldSnapshot,
  options: RecordWorkNoteDiffOptions = {}
): Promise<number> {
  const kind: WorkNoteKind = options.kind ?? 'edit'
  const skipEmpty = options.skipEmpty ?? false
  const fields = new Set<WorkNoteTrackedField>([
    ...WORK_NOTE_TRACKED_FIELDS.filter(f => f !== 'origin'),
    ...(options.extra ? (Object.keys(options.extra) as WorkNoteTrackedField[]) : []),
  ])

  let inserted = 0
  for (const field of fields) {
    const next =
      options.extra && Object.prototype.hasOwnProperty.call(options.extra, field)
        ? (options.extra[field] ?? '')
        : (after[field] ?? '')
    const prev = before[field] ?? ''

    if (options.extra && Object.prototype.hasOwnProperty.call(options.extra, field)) {
      // extra 路径：只看 next vs latest
    } else if (prev === next) {
      continue
    }

    if (skipEmpty && !next.trim()) continue

    const latest = await latestContent(db, projectId, field)
    if (latest !== null && latest === next) continue

    await db.workNote.create({
      data: {
        projectId,
        field,
        content: next,
        kind,
        // note 留给作者；「初始快照」文案由 UI 凭 kind 展示，不写进 note
      },
    })
    inserted += 1
  }
  return inserted
}

/** 存量 initial：已有 kind=initial 则跳过该 field；否则按当前快照写入（去重） */
export async function seedInitialWorkNotesForProject(
  db: DbClient,
  projectId: string,
  metadata: Record<string, unknown> | null | undefined,
  description?: string | null
): Promise<number> {
  const snap = extractTrackedFields(metadata, description)
  const existing = await db.workNote.findMany({
    where: { projectId, kind: 'initial' },
    select: { field: true },
  })
  const already = new Set(existing.map(r => r.field))

  let inserted = 0
  const emptyBefore: WorkNoteFieldSnapshot = {}
  const after: WorkNoteFieldSnapshot = {}
  for (const field of WORK_NOTE_TRACKED_FIELDS) {
    if (field === 'origin') continue
    if (already.has(field)) continue
    const content = snap[field] ?? ''
    if (!content.trim()) continue
    after[field] = content
  }
  if (Object.keys(after).length === 0) return 0
  inserted = await recordWorkNoteDiff(db, projectId, emptyBefore, after, {
    kind: 'initial',
    skipEmpty: true,
  })
  return inserted
}
