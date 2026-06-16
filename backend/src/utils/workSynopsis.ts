/**
 * 616 §7.1 — 作品梗概写入：后端单点双写 metadata.synopsis 与 description。
 *
 * 空值策略：
 * - 立项等「无梗概」：不写 synopsis 键、不写 description。
 * - 用户编辑为空：双清 synopsis 与 description，避免 fallback 读回旧 description。
 */

export function normalizeSynopsisText(value: unknown): string | null {
  if (value == null) return null
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

/** 立项写入：仅在有非空梗概时双写 */
export function synopsisFieldsForCreate(synopsis: string | null | undefined): {
  description?: string
  metadataSynopsis?: string
} {
  const text = normalizeSynopsisText(synopsis)
  if (!text) return {}
  return { description: text, metadataSynopsis: text }
}

/** PUT / confirm-metadata：metadata 含 synopsis 键时同步 description */
export function applySynopsisMetadataWrite(
  metadata: Record<string, unknown>,
  synopsisRaw: unknown,
): { metadata: Record<string, unknown>; description: string | null | undefined } {
  const text = normalizeSynopsisText(synopsisRaw)
  const nextMetadata = { ...metadata, synopsis: text ?? '' }
  return {
    metadata: nextMetadata,
    description: text,
  }
}

/** PUT body：检测 metadata.synopsis 并合并到 update payload */
export function mergeProjectUpdateWithSynopsis(
  updateData: Record<string, unknown>,
  existingMetadata: Record<string, unknown>,
): Record<string, unknown> {
  const incoming = updateData.metadata
  if (incoming == null || typeof incoming !== 'object' || Array.isArray(incoming)) {
    return updateData
  }
  const incomingMeta = incoming as Record<string, unknown>
  if (!Object.prototype.hasOwnProperty.call(incomingMeta, 'synopsis')) {
    return updateData
  }

  const mergedMeta = {
    ...existingMetadata,
    ...incomingMeta,
  }
  const { metadata, description } = applySynopsisMetadataWrite(
    mergedMeta,
    incomingMeta.synopsis,
  )

  return {
    ...updateData,
    metadata,
    description,
  }
}
