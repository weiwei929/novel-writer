import type { Project } from './api'
import { getWorkSetting, isWorkSettingBlockFilled } from './workSetting'
import { getChapterPlanning } from './chapterPlanning'

function metadata(project: Pick<Project, 'metadata'>): Record<string, unknown> {
  return (project.metadata as Record<string, unknown>) ?? {}
}

function hasTimestamp(project: Pick<Project, 'metadata'>, key: string): boolean {
  const value = metadata(project)[key]
  return value != null && value !== ''
}

/** 企划课已提交创作室（metadata._releasedToStudioAt） */
export function hasReleasedToStudio(project: Pick<Project, 'metadata'>): boolean {
  return hasTimestamp(project, '_releasedToStudioAt')
}

/** 校验企划放行至创作室的放行条件 (3项必填设定 + 最低1章大纲) */
export function canReleaseToStudio(project: Pick<Project, 'metadata'>): {
  ready: boolean
  missing: string[]
} {
  const meta = metadata(project)
  const ws = getWorkSetting(meta)
  const chapterPlanning = getChapterPlanning(meta)

  const missing: string[] = []
  if (!isWorkSettingBlockFilled(ws.charactersAndRelations)) missing.push('人物与关系设定')
  if (!isWorkSettingBlockFilled(ws.timeAndPlace)) missing.push('时间与地点设定')
  if (!isWorkSettingBlockFilled(ws.eventsAndPlot)) missing.push('事件与情节设定')
  if (chapterPlanning.length === 0) missing.push('至少 1 章章节大纲')

  return {
    ready: missing.length === 0,
    missing,
  }
}

/** 创作室已提交编审部（metadata._releasedToEditorialAt） */
export function hasReleasedToEditorial(project: Pick<Project, 'metadata'>): boolean {
  return hasTimestamp(project, '_releasedToEditorialAt')
}

/** 编审部已提交文集库（metadata._releasedToLibraryAt） */
export function hasReleasedToLibrary(project: Pick<Project, 'metadata'>): boolean {
  return hasTimestamp(project, '_releasedToLibraryAt')
}
