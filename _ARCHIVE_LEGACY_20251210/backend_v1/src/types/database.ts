/**
 * 数据库类型定义
 */

// 基础实体接口
export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
}

// 文集接口
export interface Collection extends BaseEntity {
  name: string
  description?: string
  cover?: string
  tags: string[]
  isPublic: boolean
  projectCount: number
}

// 项目状态枚举
export enum ProjectStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  ARCHIVED = 'archived',
}

// 章节接口
export interface Chapter extends BaseEntity {
  title: string
  content: string
  wordCount: number
  order: number
  projectId: string
}

// 项目接口
export interface Project extends BaseEntity {
  title: string
  description?: string
  cover?: string
  author: string
  genre: string[]
  tags: string[]
  status: ProjectStatus
  collectionId?: string
  totalWordCount: number
  chapterCount: number
  lastChapterId?: string
  outline?: string
  characters: Character[]
  settings: ProjectSettings
}

// 人物角色接口
export interface Character extends BaseEntity {
  name: string
  description: string
  avatar?: string
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor'
  traits: string[]
  relationships: CharacterRelationship[]
}

// 人物关系接口
export interface CharacterRelationship {
  targetCharacterId: string
  relationshipType: string
  description?: string
}

// 项目设置接口
export interface ProjectSettings {
  autoSave: boolean
  autoSaveInterval: number // 分钟
  backupEnabled: boolean
  writingGoal?: {
    dailyWords?: number
    targetWordCount?: number
    deadline?: string
  }
}

// 媒体文件接口
export interface MediaFile extends BaseEntity {
  filename: string
  originalName: string
  mimeType: string
  size: number
  path: string
  projectId?: string
  collectionId?: string
  tags: string[]
}

// 备份记录接口
export interface BackupRecord extends BaseEntity {
  filename: string
  path: string
  size: number
  type: 'full' | 'incremental'
  description?: string
}

// 数据库架构接口
export interface DatabaseSchema {
  collections: Collection[]
  projects: Project[]
  chapters: Chapter[]
  mediaFiles: MediaFile[]
  backups: BackupRecord[]
  metadata: {
    version: string
    lastBackup?: string
    totalProjects: number
    totalCollections: number
  }
}

// API响应接口
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// 查询参数接口
export interface QueryParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: Record<string, any>
}
