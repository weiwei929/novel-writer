/**
 * Read a metadata field value from DB/storage shape (string or legacy { current }).
 */
export function readMetadataFieldValue(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value !== null && 'current' in value) {
    const current = (value as { current?: unknown }).current
    if (typeof current === 'string') return current
  }
  return ''
}
