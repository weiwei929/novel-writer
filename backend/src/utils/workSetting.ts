/** 616-B-A canonical workSetting keys under Project.metadata */

export const WORK_SETTING_KEYS = [
  'charactersAndRelations',
  'timeAndPlace',
  'eventsAndPlot',
  'narrativeStyle',
] as const

export type WorkSettingKey = (typeof WORK_SETTING_KEYS)[number]

export function pickWorkSettingPatch(value: unknown): Partial<Record<WorkSettingKey, string>> {
  const patch: Partial<Record<WorkSettingKey, string>> = {}
  if (!value || typeof value !== 'object' || Array.isArray(value)) return patch
  const o = value as Record<string, unknown>
  for (const k of WORK_SETTING_KEYS) {
    if (Object.prototype.hasOwnProperty.call(o, k) && typeof o[k] === 'string') {
      patch[k] = o[k]
    }
  }
  return patch
}

export function normalizeWorkSetting(value: unknown): Record<WorkSettingKey, string> {
  const base: Record<WorkSettingKey, string> = {
    charactersAndRelations: '',
    timeAndPlace: '',
    eventsAndPlot: '',
    narrativeStyle: '',
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return base
  const o = value as Record<string, unknown>
  for (const k of WORK_SETTING_KEYS) {
    if (typeof o[k] === 'string') base[k] = o[k]
  }
  return base
}

/**
 * PUT 双保险：仅当请求体 metadata 显式携带 workSetting 时 normalize 并浅合并。
 * 不全局拦截 legacy 六字段。
 */
export function mergeWorkSettingInProjectUpdate(
  updateData: Record<string, unknown>,
  existingMetadata: Record<string, unknown>
): Record<string, unknown> {
  const incoming = updateData.metadata
  if (incoming == null || typeof incoming !== 'object' || Array.isArray(incoming)) {
    return updateData
  }
  const incomingMeta = incoming as Record<string, unknown>
  if (!Object.prototype.hasOwnProperty.call(incomingMeta, 'workSetting')) {
    return updateData
  }

  const mergedWorkSetting = {
    ...normalizeWorkSetting(existingMetadata.workSetting),
    ...pickWorkSettingPatch(incomingMeta.workSetting),
  }

  const { workSetting: _ignored, ...incomingMetaRest } = incomingMeta

  return {
    ...updateData,
    metadata: {
      ...existingMetadata,
      ...incomingMetaRest,
      workSetting: mergedWorkSetting,
    },
  }
}
