import type { Scrap } from '../../services/api'

export type ScrapProcessingType = 'complete' | 'partial' | 'none'

const PT_PREFIX = '__pt:'

export function getScrapProcessingType(tags?: string[] | string): ScrapProcessingType {
  const hit = normalizeTagsField(tags).find(t => t.startsWith(PT_PREFIX))
  if (hit === `${PT_PREFIX}complete`) return 'complete'
  if (hit === `${PT_PREFIX}partial`) return 'partial'
  return 'none'
}

export function setScrapProcessingType(tags: string[], type: ScrapProcessingType): string[] {
  const rest = (tags || []).filter(t => !t.startsWith(PT_PREFIX))
  if (type === 'none') return rest
  return [...rest, `${PT_PREFIX}${type}`]
}

export function normalizeTagsField(tags?: string[] | string): string[] {
  if (!tags) return []
  if (Array.isArray(tags)) return tags
  return []
}

export function displayScrapTags(tags?: string[] | string): string[] {
  return normalizeTagsField(tags).filter(t => !t.startsWith(PT_PREFIX))
}

export function parseScrapContent(content: string): { title: string; body: string } {
  const sep = content.indexOf('\n---\n')
  if (sep >= 0) {
    return {
      title: content.slice(0, sep).trim() || '未命名灵感',
      body: content.slice(sep + 5).trim(),
    }
  }
  const lines = content.split('\n')
  if (lines[0] && lines[0].length <= 100) {
    return { title: lines[0].trim(), body: lines.slice(1).join('\n').trim() }
  }
  return { title: '未命名灵感', body: content.trim() }
}

export function formatScrapContent(title: string, body: string): string {
  return `${title.trim()}\n---\n${body.trim()}`
}

export function scrapPreview(scrap: Scrap, maxLen = 48): string {
  const { title, body } = parseScrapContent(scrap.content)
  const text = body || title
  return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text
}

export function collectAllTags(items: { tags?: string[] | string }[]): string[] {
  const set = new Set<string>()
  for (const item of items) {
    for (const t of displayScrapTags(item.tags)) {
      if (t) set.add(t)
    }
  }
  return [...set].sort()
}
