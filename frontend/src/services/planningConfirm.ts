import { projectsApi, type Project } from './api'
import { assertPlanningSettingReadyForConfirm } from './workSetting'

/** 前端硬拦 + 调用 confirm-greenlight（后端必拦双保险） */
export async function confirmPlanningWithReadiness(
  project: Pick<Project, 'id' | 'metadata'>
): Promise<Project> {
  assertPlanningSettingReadyForConfirm(project)
  return projectsApi.confirmGreenlight(project.id)
}
