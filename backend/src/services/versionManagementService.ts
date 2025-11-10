import * as fs from 'fs/promises'
import * as path from 'path'
import { v4 as uuidv4 } from 'uuid'
import {
  ProjectVersion,
  VersionType,
  VersionStatus,
  ProjectSnapshot,
  VersionStats,
  VersionComparison,
  VersionChange,
  CreateVersionRequest,
  UpdateVersionRequest,
  RestoreVersionRequest,
  VersionListQuery,
  VersionListResponse,
  VersionOperationResponse,
  Project,
  Chapter,
  ChapterSnapshot,
  PlanningSnapshot
} from '../types/index.js'
import DatabaseService from './database.js'

/**
 * 版本管理服务
 */
export class VersionManagementService {
  private dbService: DatabaseService
  private versionsDir: string

  constructor(dbService: DatabaseService) {
    this.dbService = dbService
    this.versionsDir = path.join(process.cwd(), 'data', 'versions')
    this.ensureVersionsDirectory()
  }

  /**
   * 确保版本目录存在
   */
  private async ensureVersionsDirectory(): Promise<void> {
    try {
      await fs.access(this.versionsDir)
    } catch {
      await fs.mkdir(this.versionsDir, { recursive: true })
    }
  }

  /**
   * 生成版本号（时间戳格式：YYYYMMDD-HHMMSS）
   */
  private generateVersionNumber(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    return `${year}${month}${day}-${hours}${minutes}${seconds}`
  }

  /**
   * 创建项目快照
   */
  private async createProjectSnapshot(projectId: string): Promise<ProjectSnapshot> {
    try {
      // 获取项目信息
      const project = await this.dbService.getProjectById(projectId)
      if (!project) {
        throw new Error('项目不存在')
      }

      // 获取所有章节
      const chapters = await this.dbService.getChapters(projectId)

      // 创建章节快照
      const chapterSnapshots: ChapterSnapshot[] = chapters.map(chapter => ({
        id: chapter.id,
        title: chapter.title,
        content: chapter.content,
        order: chapter.order,
        wordCount: chapter.wordCount,
        status: chapter.status,
        notes: chapter.notes,
        tags: chapter.tags,
        createdAt: chapter.createdAt,
        updatedAt: chapter.updatedAt
      }))

      // 创建规划数据快照
      const planning: PlanningSnapshot = {
        outline: project.settings?.plotOutline,
        characters: project.settings?.characters,
        worldBuilding: project.settings?.worldBuilding,
        timeline: project.settings?.timeline,
        plotPoints: []
      }

      // 计算统计信息
      const totalWordCount = chapters.reduce((sum, chapter) => sum + chapter.wordCount, 0)

      const snapshot: ProjectSnapshot = {
        project: {
          title: project.title,
          description: project.description,
          author: project.author,
          genre: project.genre,
          tags: project.tags,
          status: project.status,
          settings: project.settings,
          metadata: project.metadata
        },
        chapters: chapterSnapshots,
        planning,
        statistics: {
          totalWordCount,
          chapterCount: chapters.length,
          lastModified: project.updatedAt
        }
      }

      return snapshot
    } catch (error: any) {
      throw new Error(`创建项目快照失败: ${error?.message || '未知错误'}`)
    }
  }

  /**
   * 计算版本统计信息
   */
  private async calculateVersionStats(
    projectId: string, 
    snapshot: ProjectSnapshot,
    previousVersionId?: string
  ): Promise<VersionStats> {
    const stats: VersionStats = {
      totalWords: snapshot.statistics.totalWordCount,
      chapterCount: snapshot.statistics.chapterCount
    }

    if (previousVersionId) {
      try {
        const previousVersion = await this.getVersion(previousVersionId)
        if (previousVersion) {
          const prevStats = previousVersion.snapshot.statistics
          stats.changesSinceLastVersion = {
            addedWords: Math.max(0, stats.totalWords - prevStats.totalWordCount),
            removedWords: Math.max(0, prevStats.totalWordCount - stats.totalWords),
            modifiedChapters: 0, // TODO: 实现章节变更检测
            addedChapters: Math.max(0, stats.chapterCount - prevStats.chapterCount),
            removedChapters: Math.max(0, prevStats.chapterCount - stats.chapterCount)
          }
        }
      } catch (error: any) {
        console.warn(`计算版本变更统计失败: ${error?.message || '未知错误'}`)
      }
    }

    return stats
  }

  /**
   * 保存版本数据到文件
   */
  private async saveVersionData(version: ProjectVersion): Promise<void> {
    const versionFile = path.join(this.versionsDir, `${version.id}.json`)
    await fs.writeFile(versionFile, JSON.stringify(version, null, 2), 'utf-8')
  }

  /**
   * 从文件加载版本数据
   */
  private async loadVersionData(versionId: string): Promise<ProjectVersion | null> {
    try {
      const versionFile = path.join(this.versionsDir, `${versionId}.json`)
      const data = await fs.readFile(versionFile, 'utf-8')
      return JSON.parse(data) as ProjectVersion
    } catch (error) {
      return null
    }
  }

  /**
   * 创建新版本
   */
  async createVersion(
    projectId: string, 
    request: CreateVersionRequest
  ): Promise<VersionOperationResponse> {
    try {
      // 验证项目存在
      const project = await this.dbService.getProjectById(projectId)
      if (!project) {
        return {
          success: false,
          message: '项目不存在'
        }
      }

      // 创建项目快照
      const snapshot = await this.createProjectSnapshot(projectId)

      // 获取上一个版本（用于计算变更）
      const versions = await this.getVersions(projectId, { limit: 1, sortBy: 'createdAt', sortOrder: 'desc' })
      const previousVersionId = versions.versions.length > 0 ? versions.versions[0].id : undefined

      // 计算统计信息
      const stats = await this.calculateVersionStats(projectId, snapshot, previousVersionId)

      // 创建版本对象
      const version: ProjectVersion = {
        id: uuidv4(),
        projectId,
        versionNumber: this.generateVersionNumber(),
        type: request.type,
        status: VersionStatus.ACTIVE,
        title: request.title,
        description: request.description,
        tags: request.tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        snapshot,
        stats,
        metadata: {
          ...request.metadata,
          branchFrom: previousVersionId
        }
      }

      // 保存到文件
      await this.saveVersionData(version)

      return {
        success: true,
        message: '版本创建成功',
        version
      }
    } catch (error: any) {
      return {
        success: false,
        message: `创建版本失败: ${error?.message || '未知错误'}`
      }
    }
  }

  /**
   * 获取单个版本
   */
  async getVersion(versionId: string): Promise<ProjectVersion | null> {
    return await this.loadVersionData(versionId)
  }

  /**
   * 获取版本列表
   */
  async getVersions(
    projectId: string, 
    query: VersionListQuery = {}
  ): Promise<VersionListResponse> {
    try {
      // 获取版本目录下的所有文件
      const versionFiles = await fs.readdir(this.versionsDir)
      const versions: ProjectVersion[] = []

      // 加载所有版本并过滤
      for (const file of versionFiles) {
        if (file.endsWith('.json')) {
          const versionId = file.replace('.json', '')
          const version = await this.loadVersionData(versionId)
          if (version && version.projectId === projectId) {
            // 应用过滤条件
            if (query.type && version.type !== query.type) continue
            if (query.status && version.status !== query.status) continue
            if (query.tags && !query.tags.some(tag => version.tags.includes(tag))) continue
            if (query.search) {
              const searchLower = query.search.toLowerCase()
              const titleMatch = version.title?.toLowerCase().includes(searchLower)
              const descMatch = version.description?.toLowerCase().includes(searchLower)
              if (!titleMatch && !descMatch) continue
            }

            versions.push(version)
          }
        }
      }

      // 排序
      const sortBy = query.sortBy || 'createdAt'
      const sortOrder = query.sortOrder || 'desc'
      versions.sort((a, b) => {
        let aVal: any
        let bVal: any

        switch (sortBy) {
          case 'versionNumber':
            aVal = a.versionNumber
            bVal = b.versionNumber
            break
          case 'updatedAt':
            aVal = a.updatedAt
            bVal = b.updatedAt
            break
          default:
            aVal = a.createdAt
            bVal = b.createdAt
            break
        }

        if (sortOrder === 'asc') {
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
        } else {
          return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
        }
      })

      // 分页
      const page = query.page || 1
      const limit = query.limit || 20
      const total = versions.length
      const totalPages = Math.ceil(total / limit)
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedVersions = versions.slice(startIndex, endIndex)

      // 构建过滤器选项
      const availableTypes = [...new Set(versions.map(v => v.type))]
      const availableStatuses = [...new Set(versions.map(v => v.status))]
      const availableTags = [...new Set(versions.flatMap(v => v.tags))]

      return {
        versions: paginatedVersions,
        pagination: {
          page,
          limit,
          total,
          totalPages
        },
        filters: {
          availableTypes,
          availableStatuses,
          availableTags
        }
      }
    } catch (error: any) {
      throw new Error(`获取版本列表失败: ${error?.message || '未知错误'}`)
    }
  }

  /**
   * 更新版本信息
   */
  async updateVersion(
    versionId: string, 
    request: UpdateVersionRequest
  ): Promise<VersionOperationResponse> {
    try {
      const version = await this.loadVersionData(versionId)
      if (!version) {
        return {
          success: false,
          message: '版本不存在'
        }
      }

      // 更新版本信息
      const updatedVersion: ProjectVersion = {
        ...version,
        title: request.title !== undefined ? request.title : version.title,
        description: request.description !== undefined ? request.description : version.description,
        tags: request.tags !== undefined ? request.tags : version.tags,
        status: request.status !== undefined ? request.status : version.status,
        updatedAt: new Date().toISOString(),
        metadata: {
          ...version.metadata,
          ...request.metadata
        }
      }

      // 保存更新后的版本
      await this.saveVersionData(updatedVersion)

      return {
        success: true,
        message: '版本更新成功',
        version: updatedVersion
      }
    } catch (error: any) {
      return {
        success: false,
        message: `更新版本失败: ${error?.message || '未知错误'}`
      }
    }
  }

  /**
   * 删除版本（软删除）
   */
  async deleteVersion(versionId: string): Promise<VersionOperationResponse> {
    try {
      const version = await this.loadVersionData(versionId)
      if (!version) {
        return {
          success: false,
          message: '版本不存在'
        }
      }

      // 软删除：更新状态为已删除
      const updatedVersion: ProjectVersion = {
        ...version,
        status: VersionStatus.DELETED,
        updatedAt: new Date().toISOString()
      }

      await this.saveVersionData(updatedVersion)

      return {
        success: true,
        message: '版本删除成功'
      }
    } catch (error: any) {
      return {
        success: false,
        message: `删除版本失败: ${error?.message || '未知错误'}`
      }
    }
  }

  /**
   * 恢复到指定版本
   */
  async restoreVersion(
    projectId: string,
    versionId: string,
    request: RestoreVersionRequest
  ): Promise<VersionOperationResponse> {
    try {
      // 获取要恢复的版本
      const version = await this.loadVersionData(versionId)
      if (!version || version.projectId !== projectId) {
        return {
          success: false,
          message: '版本不存在或不属于指定项目'
        }
      }

      // 如果需要创建备份
      if (request.createBackup) {
        const backupResult = await this.createVersion(projectId, {
          type: VersionType.SNAPSHOT,
          title: request.backupTitle || `恢复前备份 - ${new Date().toLocaleString()}`,
          description: request.backupDescription || `恢复到版本 ${version.versionNumber} 前的自动备份`,
          tags: ['backup', 'auto-restore']
        })

        if (!backupResult.success) {
          return {
            success: false,
            message: `创建备份失败: ${backupResult.message}`
          }
        }
      }

      // 恢复项目数据
      const snapshot = version.snapshot

      // 更新项目基本信息
      await this.dbService.updateProject(projectId, {
        title: snapshot.project.title,
        description: snapshot.project.description,
        author: snapshot.project.author,
        genre: snapshot.project.genre,
        tags: snapshot.project.tags,
        status: snapshot.project.status as any,
        settings: snapshot.project.settings,
        metadata: snapshot.project.metadata,
        updatedAt: new Date().toISOString()
      })

      // 获取当前章节列表
      const currentChapters = await this.dbService.getChapters(projectId)

      // 删除当前所有章节
      for (const chapter of currentChapters) {
        await this.dbService.deleteChapter(chapter.id)
      }

      // 恢复快照中的章节
      for (const chapterSnapshot of snapshot.chapters) {
        await this.dbService.createChapter({
          title: chapterSnapshot.title,
          content: chapterSnapshot.content,
          projectId,
          order: chapterSnapshot.order
        })
      }

      return {
        success: true,
        message: `成功恢复到版本 ${version.versionNumber}`,
        version
      }
    } catch (error: any) {
      return {
        success: false,
        message: `恢复版本失败: ${error?.message || '未知错误'}`
      }
    }
  }

  /**
   * 比较两个版本
   */
  async compareVersions(
    sourceVersionId: string,
    targetVersionId: string
  ): Promise<VersionComparison | null> {
    try {
      const sourceVersion = await this.loadVersionData(sourceVersionId)
      const targetVersion = await this.loadVersionData(targetVersionId)

      if (!sourceVersion || !targetVersion) {
        throw new Error('版本不存在')
      }

      const changes: VersionChange[] = []
      let totalChanges = 0
      let addedWords = 0
      let removedWords = 0
      let modifiedChapters = 0
      let addedChapters = 0
      let removedChapters = 0

      // 比较项目基本信息
      const sourceProject = sourceVersion.snapshot.project
      const targetProject = targetVersion.snapshot.project

      if (sourceProject.title !== targetProject.title) {
        changes.push({
          type: 'modified',
          section: 'project',
          targetId: 'title',
          targetTitle: '项目标题',
          changes: [{
            field: 'title',
            oldValue: sourceProject.title,
            newValue: targetProject.title
          }]
        })
        totalChanges++
      }

      // 比较章节
      const sourceChapters = new Map(sourceVersion.snapshot.chapters.map(c => [c.id, c]))
      const targetChapters = new Map(targetVersion.snapshot.chapters.map(c => [c.id, c]))

      // 检查新增的章节
      for (const [id, chapter] of targetChapters) {
        if (!sourceChapters.has(id)) {
          changes.push({
            type: 'added',
            section: 'chapter',
            targetId: id,
            targetTitle: chapter.title,
            changes: [{
              field: 'content',
              newValue: chapter.content,
              wordCountDiff: chapter.wordCount
            }]
          })
          addedChapters++
          addedWords += chapter.wordCount
          totalChanges++
        }
      }

      // 检查删除和修改的章节
      for (const [id, chapter] of sourceChapters) {
        const targetChapter = targetChapters.get(id)
        
        if (!targetChapter) {
          // 章节被删除
          changes.push({
            type: 'removed',
            section: 'chapter',
            targetId: id,
            targetTitle: chapter.title,
            changes: [{
              field: 'content',
              oldValue: chapter.content,
              wordCountDiff: -chapter.wordCount
            }]
          })
          removedChapters++
          removedWords += chapter.wordCount
          totalChanges++
        } else {
          // 检查章节是否有修改
          const chapterChanges: any[] = []
          
          if (chapter.title !== targetChapter.title) {
            chapterChanges.push({
              field: 'title',
              oldValue: chapter.title,
              newValue: targetChapter.title
            })
          }

          if (chapter.content !== targetChapter.content) {
            const wordCountDiff = targetChapter.wordCount - chapter.wordCount
            chapterChanges.push({
              field: 'content',
              oldValue: chapter.content,
              newValue: targetChapter.content,
              wordCountDiff
            })

            if (wordCountDiff > 0) {
              addedWords += wordCountDiff
            } else {
              removedWords += Math.abs(wordCountDiff)
            }
          }

          if (chapterChanges.length > 0) {
            changes.push({
              type: 'modified',
              section: 'chapter',
              targetId: id,
              targetTitle: targetChapter.title,
              changes: chapterChanges
            })
            modifiedChapters++
            totalChanges++
          }
        }
      }

      const comparison: VersionComparison = {
        sourceVersion: sourceVersionId,
        targetVersion: targetVersionId,
        comparedAt: new Date().toISOString(),
        summary: {
          totalChanges,
          addedWords,
          removedWords,
          modifiedChapters,
          addedChapters,
          removedChapters
        },
        changes
      }

      return comparison
    } catch (error: any) {
      throw new Error(`版本比较失败: ${error?.message || '未知错误'}`)
    }
  }

  /**
   * 清理过期版本
   */
  async cleanupOldVersions(
    projectId: string, 
    keepCount: number = 50
  ): Promise<VersionOperationResponse> {
    try {
      const versions = await this.getVersions(projectId, {
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })

      if (versions.versions.length <= keepCount) {
        return {
          success: true,
          message: '无需清理版本'
        }
      }

      // 保留最新的版本，删除多余的
      const versionsToDelete = versions.versions.slice(keepCount)
      let deletedCount = 0

      for (const version of versionsToDelete) {
        // 跳过里程碑版本
        if (version.type === VersionType.MILESTONE) {
          continue
        }

        const result = await this.deleteVersion(version.id)
        if (result.success) {
          deletedCount++
        }
      }

      return {
        success: true,
        message: `清理完成，删除了 ${deletedCount} 个版本`,
        data: { deletedCount }
      }
    } catch (error: any) {
      return {
        success: false,
        message: `清理版本失败: ${error?.message || '未知错误'}`
      }
    }
  }

  /**
   * 获取版本统计信息
   */
  async getVersionStatistics(projectId: string): Promise<any> {
    try {
      const versions = await this.getVersions(projectId)
      
      const typeStats = versions.versions.reduce((acc, version) => {
        acc[version.type] = (acc[version.type] || 0) + 1
        return acc
      }, {} as Record<VersionType, number>)

      const statusStats = versions.versions.reduce((acc, version) => {
        acc[version.status] = (acc[version.status] || 0) + 1
        return acc
      }, {} as Record<VersionStatus, number>)

      return {
        totalVersions: versions.versions.length,
        typeDistribution: typeStats,
        statusDistribution: statusStats,
        oldestVersion: versions.versions[versions.versions.length - 1]?.createdAt,
        newestVersion: versions.versions[0]?.createdAt
      }
    } catch (error: any) {
      throw new Error(`获取版本统计失败: ${error?.message || '未知错误'}`)
    }
  }
}