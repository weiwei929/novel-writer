import { projectsApi, type Project } from './api'
import {
  formatPlanningReadinessError,
  getPlanningSettingReadiness,
} from './workSetting'
import {
  formatChapterPlanningReadinessError,
  getChapterPlanningReadiness,
} from './chapterPlanning'

/** B 三必 + C 最低章节 — 前端硬拦（与后端 confirm-greenlight 规则一致） */
export function assertPlanningConfirmReady(
  project: Pick<Project, 'metadata'>
): void {
  const metadata = (project.metadata ?? {}) as Record<string, unknown>
  const parts: string[] = []

  const setting = getPlanningSettingReadiness(metadata)
  if (!setting.ready) {
    parts.push(formatPlanningReadinessError(setting))
  }

  const chapter = getChapterPlanningReadiness(metadata.chapterPlanning)
  if (!chapter.ready) {
    parts.push(formatChapterPlanningReadinessError(chapter))
  }

  if (parts.length > 0) {
    throw new Error(parts.join(' '))
  }
}

/** 前端硬拦 + 调用 confirm-greenlight（后端必拦双保险） */
export async function confirmPlanningWithReadiness(
  project: Pick<Project, 'id' | 'metadata'>
): Promise<Project> {
  assertPlanningConfirmReady(project)
  return projectsApi.confirmGreenlight(project.id)
}
