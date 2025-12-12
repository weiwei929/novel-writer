// 版本管理类型定义

/**
 * 版本类型枚举
 */
export enum VersionType {
  AUTO = 'auto', // 自动保存版本
  MANUAL = 'manual', // 手动保存版本
  MILESTONE = 'milestone', // 里程碑版本
  SNAPSHOT = 'snapshot', // 快照版本
}

/**
 * 版本状态枚举
 */
export enum VersionStatus {
  ACTIVE = 'active', // 活跃版本
  ARCHIVED = 'archived', // 已归档
  DELETED = 'deleted', // 已删除（软删除）
}

/**
 * 项目版本接口
 */
export interface ProjectVersion {
  id: string
  projectId: string
  versionNumber: string // 格式：YYYYMMDD-HHMMSS
  type: VersionType
  status: VersionStatus

  // 版本信息
  title?: string
  description?: string
  tags: string[]

  // 时间信息
  createdAt: string
  updatedAt: string

  // 快照数据
  snapshot: ProjectSnapshot

  // 统计信息
  stats: VersionStats

  // 元数据
  metadata?: {
    author?: string
    isPublic?: boolean
    branchFrom?: string // 基于哪个版本创建
    [key: string]: any
  }
}

/**
 * 项目快照 - 保存项目在某个时间点的完整状态
 */
export interface ProjectSnapshot {
  // 项目基本信息
  project: {
    title: string
    description?: string
    author: string
    genre: string[]
    tags: string[]
    status: string
    settings?: any
    metadata?: any
  }

  // 章节内容
  chapters: ChapterSnapshot[]

  // 规划数据
  planning?: PlanningSnapshot

  // 统计信息
  statistics: {
    totalWordCount: number
    chapterCount: number
    lastModified: string
  }
}

/**
 * 章节快照
 */
export interface ChapterSnapshot {
  id: string
  title: string
  content: string
  order: number
  wordCount: number
  status: string
  notes?: string
  tags?: string[]
  createdAt: string
  updatedAt: string
}

/**
 * 规划数据快照
 */
export interface PlanningSnapshot {
  outline?: string
  characters?: any[]
  worldBuilding?: string
  timeline?: any[]
  plotPoints?: any[]
}

/**
 * 版本统计信息
 */
export interface VersionStats {
  totalWords: number
  chapterCount: number
  changesSinceLastVersion?: {
    addedWords: number
    removedWords: number
    modifiedChapters: number
    addedChapters: number
    removedChapters: number
  }
}

/**
 * 版本比较结果
 */
export interface VersionComparison {
  sourceVersion: string
  targetVersion: string
  comparedAt: string

  // 变更概述
  summary: {
    totalChanges: number
    addedWords: number
    removedWords: number
    modifiedChapters: number
    addedChapters: number
    removedChapters: number
  }

  // 详细变更
  changes: VersionChange[]
}

/**
 * 版本变更记录
 */
export interface VersionChange {
  type: 'added' | 'removed' | 'modified'
  section: 'project' | 'chapter' | 'planning'

  // 变更目标
  targetId?: string // 章节ID等
  targetTitle?: string // 章节标题等

  // 变更详情
  changes: {
    field: string
    oldValue?: any
    newValue?: any
    wordCountDiff?: number
  }[]
}

/**
 * 版本创建请求
 */
export interface CreateVersionRequest {
  type: VersionType
  title?: string
  description?: string
  tags?: string[]
  metadata?: Record<string, any>
}

/**
 * 版本更新请求
 */
export interface UpdateVersionRequest {
  title?: string
  description?: string
  tags?: string[]
  status?: VersionStatus
  metadata?: Record<string, any>
}

/**
 * 版本恢复请求
 */
export interface RestoreVersionRequest {
  createBackup: boolean
  backupTitle?: string
  backupDescription?: string
}

/**
 * 版本列表查询参数
 */
export interface VersionListQuery {
  page?: number
  limit?: number
  type?: VersionType
  status?: VersionStatus
  tags?: string[]
  search?: string
  sortBy?: 'createdAt' | 'updatedAt' | 'versionNumber'
  sortOrder?: 'asc' | 'desc'
}

/**
 * 版本列表响应
 */
export interface VersionListResponse {
  versions: ProjectVersion[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  filters: {
    availableTypes: VersionType[]
    availableStatuses: VersionStatus[]
    availableTags: string[]
  }
}

/**
 * 版本操作响应
 */
export interface VersionOperationResponse {
  success: boolean
  message: string
  version?: ProjectVersion
  data?: any
}
