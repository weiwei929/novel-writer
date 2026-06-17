/** 616-C-A canonical chapterPlanning under Project.metadata */

import type { ChapterPlanItem, Project } from './api'

export type ChapterPlanningItem = {
  order: number
  title: string
  summary: string
}

export type ChapterPlanningReadiness = {
  chapterCount: number
  missingReasons: string[]
  ready: boolean
}

function readSummary(raw: Record<string, unknown>): string {
  if (typeof raw.summary === 'string') return raw.summary
  if (typeof raw.synopsisText === 'string') return raw.synopsisText
  return ''
}

function normalizeItem(raw: unknown, fallbackOrder: number): ChapterPlanningItem | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const o = raw as Record<string, unknown>
  const order =
    typeof o.order === 'number' && Number.isFinite(o.order) && o.order >= 1
      ? Math.floor(o.order)
      : fallbackOrder
  const title = typeof o.title === 'string' ? o.title : ''
  return { order, title, summary: readSummary(o) }
}

export function normalizeChapterPlanning(value: unknown): ChapterPlanningItem[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item, idx) => normalizeItem(item, idx + 1))
    .filter((item): item is ChapterPlanningItem => item !== null)
    .sort((a, b) => a.order - b.order)
    .map((item, idx) => ({ ...item, order: idx + 1 }))
}

export function getChapterPlanning(
  metadata: Record<string, unknown> | null | undefined
): ChapterPlanningItem[] {
  return normalizeChapterPlanning(metadata?.chapterPlanning)
}

export function getChapterPlanningReadiness(value: unknown): ChapterPlanningReadiness {
  const items = normalizeChapterPlanning(value)
  const missingReasons: string[] = []

  if (items.length === 0) {
    missingReasons.push('至少添加 1 章')
  }

  for (const item of items) {
    const label = `第 ${item.order} 章`
    if (!item.title.trim()) missingReasons.push(`${label} 缺少标题`)
    if (!item.summary.trim()) missingReasons.push(`${label} 缺少梗概`)
  }

  return {
    chapterCount: items.length,
    missingReasons,
    ready: items.length > 0 && missingReasons.length === 0,
  }
}

export function formatChapterPlanningReadinessError(
  readiness: ChapterPlanningReadiness
): string {
  return `请先完善章节规划：${readiness.missingReasons.join('；')}`
}

export function assertChapterPlanningReadyForConfirm(
  project: Pick<Project, 'metadata'>
): void {
  const metadata = (project.metadata ?? {}) as Record<string, unknown>
  const readiness = getChapterPlanningReadiness(metadata.chapterPlanning)
  if (!readiness.ready) {
    throw new Error(formatChapterPlanningReadinessError(readiness))
  }
}

const LEGACY_DEFAULT_STATUS: ChapterPlanItem['status'] = 'planned'
const LEGACY_DEFAULT_LENGTH = 2000

function readLegacySynopsis(raw: Record<string, unknown>): string {
  if (typeof raw.synopsisText === 'string') return raw.synopsisText
  if (typeof raw.summary === 'string') return raw.summary
  return ''
}

function readLegacyStatus(raw: Record<string, unknown>): ChapterPlanItem['status'] {
  if (raw.status === 'planned' || raw.status === 'started' || raw.status === 'completed') {
    return raw.status
  }
  return LEGACY_DEFAULT_STATUS
}

/** canonical / 混合格式 → legacy 编辑器状态（summary → synopsisText） */
export function toLegacyChapterPlanItem(raw: unknown, fallbackOrder: number): ChapterPlanItem | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const o = raw as Record<string, unknown>
  const order =
    typeof o.order === 'number' && Number.isFinite(o.order) && o.order >= 1
      ? Math.floor(o.order)
      : fallbackOrder
  const title = typeof o.title === 'string' ? o.title : ''
  const id = typeof o.id === 'string' && o.id ? o.id : Math.random().toString(36).slice(2)
  const plannedLength =
    typeof o.plannedLength === 'number' && Number.isFinite(o.plannedLength) && o.plannedLength >= 0
      ? Math.floor(o.plannedLength)
      : LEGACY_DEFAULT_LENGTH

  return {
    id,
    order,
    title,
    plannedLength,
    synopsisText: readLegacySynopsis(o),
    status: readLegacyStatus(o),
  }
}

export function toLegacyChapterPlanItems(value: unknown): ChapterPlanItem[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item, idx) => toLegacyChapterPlanItem(item, idx + 1))
    .filter((item): item is ChapterPlanItem => item !== null)
    .sort((a, b) => a.order - b.order)
    .map((item, idx) => ({ ...item, order: idx + 1 }))
}

/** legacy 编辑器保存：只读 synopsisText，显式构造 canonical payload */
export function legacyPlansToCanonical(plans: ChapterPlanItem[]): ChapterPlanningItem[] {
  return plans
    .map((plan, idx) => ({
      order: typeof plan.order === 'number' ? plan.order : idx + 1,
      title: plan.title ?? '',
      summary: plan.synopsisText ?? '',
    }))
    .sort((a, b) => a.order - b.order)
    .map((item, idx) => ({ ...item, order: idx + 1 }))
}
