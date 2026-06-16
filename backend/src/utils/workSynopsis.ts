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

/** metadata / description 任一侧写入时，双轨同步 synopsis 与 description */
export function applySynopsisMetadataWrite(
  metadata: Record<string, unknown>,
  synopsisRaw: unknown,
): { metadata: Record<string, unknown>; description: string | null } {
  const text = normalizeSynopsisText(synopsisRaw)
  const nextMetadata = { ...metadata, synopsis: text ?? '' }
  return {
    metadata: nextMetadata,
    description: text,
  }
}

/**
 * PUT body：浅合并 metadata，并按 synopsis / description 保持双轨一致。
 *
 * 1. metadata 为对象时先与 existingMetadata 浅合并，避免局部更新覆盖旧字段。
 * 2. metadata 显式含 synopsis → 以 synopsis 为准，同步 description。
 * 3. metadata 不含 synopsis 但 description !== undefined → 以 description 为准，同步 metadata.synopsis。
 * 4. 既无 metadata 对象也无 description → 原样返回。
 */
export function mergeProjectUpdateWithSynopsis(
  updateData: Record<string, unknown>,
  existingMetadata: Record<string, unknown>,
): Record<string, unknown> {
  const incoming = updateData.metadata
  const hasMetadataObject =
    incoming != null && typeof incoming === 'object' && !Array.isArray(incoming)
  const hasDescription = Object.prototype.hasOwnProperty.call(updateData, 'description')

  if (!hasMetadataObject && !hasDescription) {
    return updateData
  }

  let mergedMeta = { ...existingMetadata }
  const result = { ...updateData }

  if (hasMetadataObject) {
    const incomingMeta = incoming as Record<string, unknown>
    mergedMeta = { ...existingMetadata, ...incomingMeta }
    result.metadata = mergedMeta

    if (Object.prototype.hasOwnProperty.call(incomingMeta, 'synopsis')) {
      const applied = applySynopsisMetadataWrite(mergedMeta, incomingMeta.synopsis)
      return {
        ...result,
        metadata: applied.metadata,
        description: applied.description,
      }
    }
  }

  if (hasDescription) {
    const applied = applySynopsisMetadataWrite(mergedMeta, updateData.description)
    return {
      ...result,
      metadata: applied.metadata,
      description: applied.description,
    }
  }

  return result
}
