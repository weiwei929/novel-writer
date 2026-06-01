// 存量数据兼容映射 — 集中管理，不散落在页面
const PROJECT_STATUS_MAP: Record<string, string> = {
  imported: 'draft',
  published: 'completed',
  pooled: 'shelved',
  trashed: 'shelved',
}

export function mapProjectStatus(status: string): string {
  return PROJECT_STATUS_MAP[status] || status
}

export function withMappedProjectStatus<T extends { status: string }>(project: T): T {
  return { ...project, status: mapProjectStatus(project.status) }
}
