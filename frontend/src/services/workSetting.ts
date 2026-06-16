import { projectsApi, type Project } from './api'

export interface WorkSetting {
  charactersAndRelations: string
  timeAndPlace: string
  eventsAndPlot: string
  narrativeStyle: string
}

export const WORK_SETTING_BLOCKS = [
  { key: 'charactersAndRelations' as const, label: '人物与关系', required: true },
  { key: 'timeAndPlace' as const, label: '时间与地点', required: true },
  { key: 'eventsAndPlot' as const, label: '事件与情节', required: true },
  { key: 'narrativeStyle' as const, label: '叙事风格 / 创作心流', required: false },
]

const EMPTY: WorkSetting = {
  charactersAndRelations: '',
  timeAndPlace: '',
  eventsAndPlot: '',
  narrativeStyle: '',
}

export function normalizeWorkSetting(partial?: Partial<WorkSetting> | null): WorkSetting {
  if (!partial || typeof partial !== 'object') return { ...EMPTY }
  return {
    charactersAndRelations:
      typeof partial.charactersAndRelations === 'string' ? partial.charactersAndRelations : '',
    timeAndPlace: typeof partial.timeAndPlace === 'string' ? partial.timeAndPlace : '',
    eventsAndPlot: typeof partial.eventsAndPlot === 'string' ? partial.eventsAndPlot : '',
    narrativeStyle: typeof partial.narrativeStyle === 'string' ? partial.narrativeStyle : '',
  }
}

export function getWorkSetting(
  metadata: Record<string, unknown> | null | undefined
): WorkSetting {
  const raw = metadata?.workSetting
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ...EMPTY }
  return normalizeWorkSetting(raw as Partial<WorkSetting>)
}

export function isWorkSettingBlockFilled(value: string): boolean {
  return value.trim().length > 0
}

export function countRequiredBlocksFilled(ws: WorkSetting): number {
  return WORK_SETTING_BLOCKS.filter(b => b.required && isWorkSettingBlockFilled(ws[b.key])).length
}

export function hasAnyWorkSettingContent(ws: WorkSetting): boolean {
  return WORK_SETTING_BLOCKS.some(b => isWorkSettingBlockFilled(ws[b.key]))
}

/** planning 主路径：仅 PATCH metadata.workSetting，由后端与 existing 合并 */
export async function saveWorkSetting(
  projectId: string,
  workSetting: WorkSetting
): Promise<Project> {
  return projectsApi.update(projectId, {
    metadata: {
      workSetting: normalizeWorkSetting(workSetting),
    },
  })
}
