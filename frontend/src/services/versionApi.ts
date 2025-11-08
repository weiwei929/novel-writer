import axios from 'axios'
import {
  ProjectVersion,
  CreateVersionParams,
  RestoreVersionParams,
  CreateBranchParams,
  MergeVersionParams,
  VersionComparison,
  VersionType,
  VersionStatus,
  ProjectSnapshot
} from '../types/version'

const API_BASE_URL = 'http://localhost:5000/api/v1'

// 创建 axios 实例用于版本管理
const versionApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 版本操作可能比较耗时
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
})

// 请求拦截器：添加认证令牌
versionApi.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('novel_auth_token') : null
  if (token) {
    config.headers = config.headers || {}
    ;(config.headers as Record<string, string>).Authorization = `Bearer ${token}`
    ;(config.headers as Record<string, string>)["x-auth-token"] = token
  }
  return config
})

// 响应拦截器：错误处理
versionApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('版本管理 API 错误:', error)
    return Promise.reject(error)
  }
)

// 项目版本管理 API 服务
export const versionManagementApi = {
  
  // ========== 版本列表和查询 ==========
  
  /**
   * 获取项目的所有版本
   */
  async getVersions(projectId: string): Promise<ProjectVersion[]> {
    const response = await versionApi.get(`/projects/${projectId}/versions`)
    return response.data || []
  },

  /**
   * 获取特定版本信息
   */
  async getVersion(projectId: string, versionId: string): Promise<ProjectVersion> {
    const response = await versionApi.get(`/projects/${projectId}/versions/${versionId}`)
    return response.data
  },

  /**
   * 获取当前活跃版本
   */
  async getCurrentVersion(projectId: string): Promise<ProjectVersion | null> {
    const response = await versionApi.get(`/projects/${projectId}/versions/current`)
    return response.data || null
  },

  /**
   * 根据版本类型筛选版本
   */
  async getVersionsByType(projectId: string, type: VersionType): Promise<ProjectVersion[]> {
    const response = await versionApi.get(`/projects/${projectId}/versions?type=${type}`)
    return response.data || []
  },

  // ========== 版本创建和保存 ==========

  /**
   * 创建新版本（手动保存）
   */
  async createVersion(params: CreateVersionParams): Promise<ProjectVersion> {
    const response = await versionApi.post(`/projects/${params.projectId}/versions`, {
      type: params.type || VersionType.MANUAL,
      displayName: params.displayName,
      description: params.description,
      branchName: params.branchName
    })
    return response.data
  },

  /**
   * 创建自动保存版本
   */
  async createAutoSave(projectId: string): Promise<ProjectVersion> {
    const response = await versionApi.post(`/projects/${projectId}/versions/auto-save`)
    return response.data
  },

  /**
   * 创建里程碑版本
   */
  async createMilestone(
    projectId: string, 
    displayName: string, 
    description?: string
  ): Promise<ProjectVersion> {
    const response = await versionApi.post(`/projects/${projectId}/versions/milestone`, {
      displayName,
      description
    })
    return response.data
  },

  /**
   * 创建快照版本
   */
  async createSnapshot(
    projectId: string,
    branchName: string,
    description?: string
  ): Promise<ProjectVersion> {
    const response = await versionApi.post(`/projects/${projectId}/versions/snapshot`, {
      branchName,
      description
    })
    return response.data
  },

  // ========== 版本恢复和回滚 ==========

  /**
   * 恢复到指定版本
   */
  async restoreVersion(params: RestoreVersionParams): Promise<ProjectVersion> {
    const response = await versionApi.post(`/projects/${params.projectId}/versions/${params.versionId}/restore`, {
      createBackup: params.createBackup || true,
      backupDescription: params.backupDescription || '恢复前自动备份'
    })
    return response.data
  },

  /**
   * 预览版本恢复（不实际执行）
   */
  async previewRestore(projectId: string, versionId: string): Promise<VersionComparison> {
    const response = await versionApi.get(`/projects/${projectId}/versions/${versionId}/restore-preview`)
    return response.data
  },

  // ========== 版本比较 ==========

  /**
   * 比较两个版本
   */
  async compareVersions(
    projectId: string, 
    fromVersionId: string, 
    toVersionId: string
  ): Promise<VersionComparison> {
    const response = await versionApi.get(
      `/projects/${projectId}/versions/compare?from=${fromVersionId}&to=${toVersionId}`
    )
    return response.data
  },

  /**
   * 比较版本与当前状态
   */
  async compareWithCurrent(projectId: string, versionId: string): Promise<VersionComparison> {
    const response = await versionApi.get(`/projects/${projectId}/versions/${versionId}/compare-current`)
    return response.data
  },

  // ========== 版本分支管理 ==========

  /**
   * 创建分支
   */
  async createBranch(params: CreateBranchParams): Promise<ProjectVersion> {
    const response = await versionApi.post(`/projects/${params.projectId}/branches`, {
      fromVersionId: params.fromVersionId,
      branchName: params.branchName,
      description: params.description
    })
    return response.data
  },

  /**
   * 获取项目的所有分支
   */
  async getBranches(projectId: string): Promise<ProjectVersion[]> {
    const response = await versionApi.get(`/projects/${projectId}/branches`)
    return response.data || []
  },

  /**
   * 合并分支
   */
  async mergeBranch(params: MergeVersionParams): Promise<ProjectVersion> {
    const response = await versionApi.post(`/projects/${params.projectId}/versions/merge`, {
      fromVersionId: params.fromVersionId,
      toVersionId: params.toVersionId,
      description: params.description,
      conflictResolution: params.conflictResolution
    })
    return response.data
  },

  // ========== 版本管理 ==========

  /**
   * 更新版本信息
   */
  async updateVersion(
    projectId: string, 
    versionId: string, 
    updates: {
      displayName?: string
      description?: string
      status?: VersionStatus
    }
  ): Promise<ProjectVersion> {
    const response = await versionApi.patch(`/projects/${projectId}/versions/${versionId}`, updates)
    return response.data
  },

  /**
   * 删除版本
   */
  async deleteVersion(projectId: string, versionId: string): Promise<void> {
    await versionApi.delete(`/projects/${projectId}/versions/${versionId}`)
  },

  /**
   * 归档版本
   */
  async archiveVersion(projectId: string, versionId: string): Promise<ProjectVersion> {
    const response = await versionApi.post(`/projects/${projectId}/versions/${versionId}/archive`)
    return response.data
  },

  // ========== 高级功能 ==========

  /**
   * 获取项目完整快照（用于版本创建）
   */
  async getProjectSnapshot(projectId: string): Promise<ProjectSnapshot> {
    const response = await versionApi.get(`/projects/${projectId}/snapshot`)
    return response.data
  },

  /**
   * 获取版本统计信息
   */
  async getVersionStats(projectId: string): Promise<{
    totalVersions: number
    autoSaveCount: number
    manualSaveCount: number
    milestoneCount: number
    snapshotCount: number
    currentSize: number
    totalSize: number
    oldestVersion: string
    newestVersion: string
  }> {
    const response = await versionApi.get(`/projects/${projectId}/versions/stats`)
    return response.data
  },

  /**
   * 清理旧版本（按策略删除）
   */
  async cleanupVersions(
    projectId: string,
    strategy: {
      keepAutoSaveDays?: number      // 保留自动保存版本天数
      keepManualVersions?: number    // 保留手动版本数量
      keepMilestones?: boolean       // 是否保留所有里程碑
      keepSnapshots?: boolean        // 是否保留所有快照
    }
  ): Promise<{
    deletedVersions: number
    freedSpace: number
  }> {
    const response = await versionApi.post(`/projects/${projectId}/versions/cleanup`, strategy)
    return response.data
  }
}

// 版本管理工具函数
export const versionUtils = {
  /**
   * 生成版本号（时间戳格式）
   */
  generateVersionNumber(date: Date = new Date()): string {
    return date.toISOString()
      .replace(/[-:T]/g, '')
      .replace(/\.\d{3}Z$/, '')
      .replace(/(\d{8})(\d{6})/, '$1-$2')
  },

  /**
   * 解析版本号为日期
   */
  parseVersionNumber(versionNumber: string): Date {
    const timestamp = versionNumber.replace('-', '') + '000'
    return new Date(
      parseInt(timestamp.substr(0, 4)),  // year
      parseInt(timestamp.substr(4, 2)) - 1,  // month (0-based)
      parseInt(timestamp.substr(6, 2)),  // day
      parseInt(timestamp.substr(8, 2)),  // hour
      parseInt(timestamp.substr(10, 2)), // minute
      parseInt(timestamp.substr(12, 2))  // second
    )
  },

  /**
   * 格式化版本显示名称
   */
  formatVersionName(version: ProjectVersion): string {
    if (version.displayName) {
      return version.displayName
    }
    
    const date = this.parseVersionNumber(version.versionNumber)
    const typeMap = {
      [VersionType.AUTO]: '自动保存',
      [VersionType.MANUAL]: '手动保存',
      [VersionType.MILESTONE]: '里程碑',
      [VersionType.SNAPSHOT]: '快照'
    }
    
    return `${typeMap[version.type]} - ${date.toLocaleString('zh-CN')}`
  },

  /**
   * 计算两个版本间的时间差
   */
  getVersionTimeDiff(fromVersion: ProjectVersion, toVersion: ProjectVersion): {
    days: number
    hours: number
    minutes: number
  } {
    const fromDate = this.parseVersionNumber(fromVersion.versionNumber)
    const toDate = this.parseVersionNumber(toVersion.versionNumber)
    const diffMs = Math.abs(toDate.getTime() - fromDate.getTime())
    
    return {
      days: Math.floor(diffMs / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    }
  }
}