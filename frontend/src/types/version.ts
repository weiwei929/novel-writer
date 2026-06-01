// 项目版本管理系统 - 类型定义和接口

// 版本类型枚举
export enum VersionType {
  AUTO = 'auto', // 自动保存版本（每N分钟）
  MANUAL = 'manual', // 手动保存版本
  MILESTONE = 'milestone', // 里程碑版本（重要节点）
  SNAPSHOT = 'snapshot', // 快照版本（实验性分支）
}

// 版本状态枚举
export enum VersionStatus {
  ACTIVE = 'active', // 当前活跃版本
  ARCHIVED = 'archived', // 已归档版本
  DEPRECATED = 'deprecated', // 已废弃版本
}

// 项目版本接口
export interface ProjectVersion {
  id: string // 版本唯一标识
  projectId: string // 所属项目ID
  versionNumber: string // 版本号（时间戳格式：YYYYMMDD-HHMMSS）
  displayName?: string // 版本显示名称
  description?: string // 版本描述/变更日志
  type: VersionType // 版本类型
  status: VersionStatus // 版本状态

  // 版本内容快照
  snapshot: ProjectSnapshot // 项目完整快照

  // 元数据
  createdAt: string // 创建时间
  createdBy?: string // 创建者
  parentVersionId?: string // 父版本ID（用于版本链）
  branchName?: string // 分支名称（用于实验性开发）

  // 统计信息
  totalWordCount: number // 总字数
  totalChapters: number // 总章节数
  changesFromParent?: VersionChange[] // 相对父版本的变更
}

// 项目快照结构
export interface ProjectSnapshot {
  project: ProjectData // 项目基础信息
  chapters: ChapterData[] // 所有章节内容
  metadata?: Record<string, any> // 项目级元数据
  planning?: PlanningData // 规划数据（大纲、角色等）
}

// 版本中的项目数据
export interface ProjectData {
  id: string
  title: string
  description?: string
  author: string
  genre: string[]
  tags: string[]
  status: string
  collectionId: string
  metadata?: Record<string, any>
}

// 版本中的章节数据
export interface ChapterData {
  id: string
  projectId: string
  title: string
  content: string
  order: number
  status: string
  notes?: string
  tags?: string[]
  summary?: string
  wordCount: number
  createdAt: string
  updatedAt: string
}

// 规划数据结构
export interface PlanningData {
  outline?: string // 总体大纲
  characters?: CharacterInfo[] // 角色信息
  worldSetting?: string // 作品设定
  timeline?: TimelineEvent[] // 时间线
  plotPoints?: string[] // 情节要点
}

// 角色信息
export interface CharacterInfo {
  id: string
  name: string
  description?: string
  role?: string // 主角、配角、反派等
  traits?: string[] // 性格特征
  backstory?: string // 背景故事
  relationships?: Record<string, string> // 与其他角色的关系
}

// 时间线事件
export interface TimelineEvent {
  id: string
  title: string
  description?: string
  timestamp: string // 故事内时间点
  chapterRef?: string // 关联的章节ID
}

// 版本变更记录
export interface VersionChange {
  type: 'create' | 'update' | 'delete'
  target: 'project' | 'chapter' | 'planning'
  targetId: string // 变更对象的ID
  targetName: string // 变更对象的名称
  summary: string // 变更摘要
  details?: any // 详细变更内容
  timestamp: string // 变更时间
}

// 版本比较结果
export interface VersionComparison {
  fromVersion: ProjectVersion
  toVersion: ProjectVersion
  changes: VersionChange[]
  addedChapters: ChapterData[]
  removedChapters: ChapterData[]
  modifiedChapters: {
    chapter: ChapterData
    changes: {
      title?: { old: string; new: string }
      content?: { old: string; new: string }
      order?: { old: number; new: number }
      status?: { old: string; new: string }
    }
  }[]
  projectChanges: {
    title?: { old: string; new: string }
    description?: { old: string; new: string }
    status?: { old: string; new: string }
    genre?: { old: string[]; new: string[] }
    tags?: { old: string[]; new: string[] }
  }
}

// 版本创建参数
export interface CreateVersionParams {
  projectId: string
  type?: VersionType
  displayName?: string
  description?: string
  branchName?: string
}

// 版本恢复参数
export interface RestoreVersionParams {
  projectId: string
  versionId: string
  createBackup?: boolean // 是否在恢复前创建当前状态的备份版本
  backupDescription?: string // 备份版本描述
}

// 版本分支参数
export interface CreateBranchParams {
  projectId: string
  fromVersionId: string
  branchName: string
  description?: string
}

// 版本合并参数
export interface MergeVersionParams {
  projectId: string
  fromVersionId: string // 源版本
  toVersionId: string // 目标版本
  description?: string // 合并描述
  conflictResolution?: Record<string, any> // 冲突解决策略
}
