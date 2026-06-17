/** 616-C-A canonical chapterPlanning under Project.metadata */

export type ChapterPlanningItem = {
  order: number
  title: string
  summary: string
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

export type ChapterPlanningReadiness = {
  chapterCount: number
  missingReasons: string[]
  ready: boolean
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

export function assertChapterPlanningReady(metadata: Record<string, unknown>): void {
  const readiness = getChapterPlanningReadiness(metadata.chapterPlanning)
  if (!readiness.ready) {
    throw new Error(formatChapterPlanningReadinessError(readiness))
  }
}
