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
