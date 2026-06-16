import { readMetadataFieldValue } from './metadataField'

/**
 * 616 §7.1 — 作品梗概读模型：metadata.synopsis → description (legacy fallback).
 */
export function getWorkSynopsis(
  description: string | undefined | null,
  metadata: Record<string, unknown> | null | undefined,
): string {
  const fromMeta = readMetadataFieldValue(metadata?.synopsis)
  if (fromMeta) return fromMeta
  if (description?.trim()) return description.trim()
  return ''
}
