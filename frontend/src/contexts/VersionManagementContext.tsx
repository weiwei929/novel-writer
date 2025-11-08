import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { ProjectVersion, VersionType, VersionStatus, CreateVersionParams, VersionComparison } from '../types/version'
import { versionManagementApi, versionUtils } from '../services/versionApi'
import { useNotifications } from './UIContext'

// 版本管理状态接口
interface VersionManagementState {
  // 当前项目版本信息
  currentProjectId?: string
  currentVersion?: ProjectVersion | null
  versions: ProjectVersion[]
  
  // UI 状态
  isLoading: boolean
  error: string | null
  
  // 版本操作状态
  isSaving: boolean
  isRestoring: boolean
  isComparing: boolean
  
  // 比较数据
  comparisonResult?: VersionComparison | null
  
  // 版本统计
  versionStats?: {
    totalVersions: number
    autoSaveCount: number
    manualSaveCount: number
    milestoneCount: number
    snapshotCount: number
  }
}

// 版本管理上下文值接口
interface VersionManagementContextValue {
  state: VersionManagementState
  
  // ========== 初始化和数据加载 ==========
  initializeProject: (projectId: string) => Promise<void>
  refreshVersions: () => Promise<void>
  
  // ========== 版本创建 ==========
  createManualVersion: (params: Omit<CreateVersionParams, 'projectId' | 'type'>) => Promise<ProjectVersion | null>
  createAutoSave: () => Promise<ProjectVersion | null>
  createMilestone: (displayName: string, description?: string) => Promise<ProjectVersion | null>
  createSnapshot: (branchName: string, description?: string) => Promise<ProjectVersion | null>
  
  // ========== 版本操作 ==========
  restoreVersion: (versionId: string, createBackup?: boolean) => Promise<boolean>
  deleteVersion: (versionId: string) => Promise<boolean>
  archiveVersion: (versionId: string) => Promise<boolean>
  
  // ========== 版本比较 ==========
  compareVersions: (fromVersionId: string, toVersionId: string) => Promise<VersionComparison | null>
  compareWithCurrent: (versionId: string) => Promise<VersionComparison | null>
  clearComparison: () => void
  
  // ========== 版本管理 ==========
  updateVersionInfo: (versionId: string, updates: { displayName?: string; description?: string }) => Promise<boolean>
  setCurrentVersion: (versionId: string) => void
  
  // ========== 工具函数 ==========
  getVersionByType: (type: VersionType) => ProjectVersion[]
  getRecentVersions: (limit?: number) => ProjectVersion[]
  canRestoreVersion: (versionId: string) => boolean
  canDeleteVersion: (versionId: string) => boolean
}

// 创建上下文
const VersionManagementContext = createContext<VersionManagementContextValue | null>(null)

// Provider 组件
export const VersionManagementProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { error: notifyError, success: notifySuccess } = useNotifications()
  
  // 状态管理
  const [state, setState] = useState<VersionManagementState>({
    versions: [],
    isLoading: false,
    error: null,
    isSaving: false,
    isRestoring: false,
    isComparing: false
  })

  // ========== 辅助函数 ==========
  
  const updateState = useCallback((updates: Partial<VersionManagementState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  const handleError = useCallback((error: any, operation: string) => {
    const errorMessage = error?.response?.data?.message || error.message || '操作失败'
    console.error(`版本管理 - ${operation}:`, error)
    updateState({ error: errorMessage, isLoading: false })
    notifyError(`${operation}失败`, errorMessage)
    return null
  }, [notifyError, updateState])

  // ========== 数据加载 ==========

  const initializeProject = useCallback(async (projectId: string) => {
    updateState({ 
      isLoading: true, 
      error: null, 
      currentProjectId: projectId,
      versions: []
    })

    try {
      // 并行加载版本列表和当前版本
      const [versions, currentVersion, stats] = await Promise.all([
        versionManagementApi.getVersions(projectId),
        versionManagementApi.getCurrentVersion(projectId),
        versionManagementApi.getVersionStats(projectId).catch(() => null)
      ])

      updateState({
        versions: versions.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
        currentVersion,
        versionStats: stats || undefined,
        isLoading: false
      })

    } catch (error) {
      handleError(error, '加载项目版本')
    }
  }, [updateState, handleError])

  const refreshVersions = useCallback(async () => {
    if (!state.currentProjectId) return

    try {
      updateState({ isLoading: true })
      const versions = await versionManagementApi.getVersions(state.currentProjectId)
      
      updateState({
        versions: versions.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
        isLoading: false
      })
    } catch (error) {
      handleError(error, '刷新版本列表')
    }
  }, [state.currentProjectId, updateState, handleError])

  // ========== 版本创建 ==========

  const createManualVersion = useCallback(async (
    params: Omit<CreateVersionParams, 'projectId' | 'type'>
  ): Promise<ProjectVersion | null> => {
    if (!state.currentProjectId) return null

    try {
      updateState({ isSaving: true })
      
      const newVersion = await versionManagementApi.createVersion({
        ...params,
        projectId: state.currentProjectId,
        type: VersionType.MANUAL
      })

      updateState({
        versions: [newVersion, ...state.versions],
        currentVersion: newVersion,
        isSaving: false
      })

      notifySuccess('版本保存成功', `版本 "${newVersion.displayName || versionUtils.formatVersionName(newVersion)}" 已创建`)
      return newVersion

    } catch (error) {
      updateState({ isSaving: false })
      return handleError(error, '创建手动版本')
    }
  }, [state.currentProjectId, state.versions, updateState, handleError, notifySuccess])

  const createAutoSave = useCallback(async (): Promise<ProjectVersion | null> => {
    if (!state.currentProjectId) return null

    try {
      updateState({ isSaving: true })
      
      const newVersion = await versionManagementApi.createAutoSave(state.currentProjectId)
      
      updateState({
        versions: [newVersion, ...state.versions],
        isSaving: false
      })

      return newVersion

    } catch (error) {
      updateState({ isSaving: false })
      return handleError(error, '创建自动保存版本')
    }
  }, [state.currentProjectId, state.versions, updateState, handleError])

  const createMilestone = useCallback(async (
    displayName: string, 
    description?: string
  ): Promise<ProjectVersion | null> => {
    if (!state.currentProjectId) return null

    try {
      updateState({ isSaving: true })
      
      const newVersion = await versionManagementApi.createMilestone(
        state.currentProjectId, 
        displayName, 
        description
      )

      updateState({
        versions: [newVersion, ...state.versions],
        currentVersion: newVersion,
        isSaving: false
      })

      notifySuccess('里程碑创建成功', `里程碑 "${displayName}" 已创建`)
      return newVersion

    } catch (error) {
      updateState({ isSaving: false })
      return handleError(error, '创建里程碑版本')
    }
  }, [state.currentProjectId, state.versions, updateState, handleError, notifySuccess])

  const createSnapshot = useCallback(async (
    branchName: string, 
    description?: string
  ): Promise<ProjectVersion | null> => {
    if (!state.currentProjectId) return null

    try {
      updateState({ isSaving: true })
      
      const newVersion = await versionManagementApi.createSnapshot(
        state.currentProjectId, 
        branchName, 
        description
      )

      updateState({
        versions: [newVersion, ...state.versions],
        isSaving: false
      })

      notifySuccess('快照创建成功', `快照 "${branchName}" 已创建`)
      return newVersion

    } catch (error) {
      updateState({ isSaving: false })
      return handleError(error, '创建快照版本')
    }
  }, [state.currentProjectId, state.versions, updateState, handleError, notifySuccess])

  // ========== 版本操作 ==========

  const restoreVersion = useCallback(async (
    versionId: string, 
    createBackup: boolean = true
  ): Promise<boolean> => {
    if (!state.currentProjectId) return false

    try {
      updateState({ isRestoring: true })
      
      const restoredVersion = await versionManagementApi.restoreVersion({
        projectId: state.currentProjectId,
        versionId,
        createBackup,
        backupDescription: createBackup ? '恢复前自动备份' : undefined
      })

      // 刷新版本列表
      await refreshVersions()
      
      updateState({
        currentVersion: restoredVersion,
        isRestoring: false
      })

      notifySuccess('版本恢复成功', '项目已恢复到所选版本')
      return true

    } catch (error) {
      updateState({ isRestoring: false })
      handleError(error, '恢复版本')
      return false
    }
  }, [state.currentProjectId, updateState, handleError, notifySuccess, refreshVersions])

  const deleteVersion = useCallback(async (versionId: string): Promise<boolean> => {
    if (!state.currentProjectId) return false

    try {
      await versionManagementApi.deleteVersion(state.currentProjectId, versionId)
      
      updateState({
        versions: state.versions.filter(v => v.id !== versionId)
      })

      notifySuccess('版本删除成功', '版本已从历史记录中删除')
      return true

    } catch (error) {
      handleError(error, '删除版本')
      return false
    }
  }, [state.currentProjectId, state.versions, updateState, handleError, notifySuccess])

  const archiveVersion = useCallback(async (versionId: string): Promise<boolean> => {
    if (!state.currentProjectId) return false

    try {
      const archivedVersion = await versionManagementApi.archiveVersion(state.currentProjectId, versionId)
      
      updateState({
        versions: state.versions.map(v => 
          v.id === versionId ? archivedVersion : v
        )
      })

      notifySuccess('版本归档成功', '版本已归档')
      return true

    } catch (error) {
      handleError(error, '归档版本')
      return false
    }
  }, [state.currentProjectId, state.versions, updateState, handleError, notifySuccess])

  // ========== 版本比较 ==========

  const compareVersions = useCallback(async (
    fromVersionId: string, 
    toVersionId: string
  ): Promise<VersionComparison | null> => {
    if (!state.currentProjectId) return null

    try {
      updateState({ isComparing: true })
      
      const comparison = await versionManagementApi.compareVersions(
        state.currentProjectId, 
        fromVersionId, 
        toVersionId
      )

      updateState({
        comparisonResult: comparison,
        isComparing: false
      })

      return comparison

    } catch (error) {
      updateState({ isComparing: false })
      return handleError(error, '比较版本')
    }
  }, [state.currentProjectId, updateState, handleError])

  const compareWithCurrent = useCallback(async (versionId: string): Promise<VersionComparison | null> => {
    if (!state.currentProjectId) return null

    try {
      updateState({ isComparing: true })
      
      const comparison = await versionManagementApi.compareWithCurrent(
        state.currentProjectId, 
        versionId
      )

      updateState({
        comparisonResult: comparison,
        isComparing: false
      })

      return comparison

    } catch (error) {
      updateState({ isComparing: false })
      return handleError(error, '比较版本与当前状态')
    }
  }, [state.currentProjectId, updateState, handleError])

  const clearComparison = useCallback(() => {
    updateState({ comparisonResult: null })
  }, [updateState])

  // ========== 版本管理 ==========

  const updateVersionInfo = useCallback(async (
    versionId: string, 
    updates: { displayName?: string; description?: string }
  ): Promise<boolean> => {
    if (!state.currentProjectId) return false

    try {
      const updatedVersion = await versionManagementApi.updateVersion(
        state.currentProjectId, 
        versionId, 
        updates
      )

      updateState({
        versions: state.versions.map(v => 
          v.id === versionId ? updatedVersion : v
        )
      })

      notifySuccess('版本信息更新成功')
      return true

    } catch (error) {
      handleError(error, '更新版本信息')
      return false
    }
  }, [state.currentProjectId, state.versions, updateState, handleError, notifySuccess])

  const setCurrentVersion = useCallback((versionId: string) => {
    const version = state.versions.find(v => v.id === versionId)
    if (version) {
      updateState({ currentVersion: version })
    }
  }, [state.versions, updateState])

  // ========== 工具函数 ==========

  const getVersionByType = useCallback((type: VersionType): ProjectVersion[] => {
    return state.versions.filter(v => v.type === type)
  }, [state.versions])

  const getRecentVersions = useCallback((limit: number = 10): ProjectVersion[] => {
    return state.versions.slice(0, limit)
  }, [state.versions])

  const canRestoreVersion = useCallback((versionId: string): boolean => {
    const version = state.versions.find(v => v.id === versionId)
    return version?.status === VersionStatus.ACTIVE || version?.status === VersionStatus.ARCHIVED
  }, [state.versions])

  const canDeleteVersion = useCallback((versionId: string): boolean => {
    const version = state.versions.find(v => v.id === versionId)
    if (!version) return false
    
    // 不能删除当前版本
    if (version.id === state.currentVersion?.id) return false
    
    // 里程碑版本需要额外确认
    if (version.type === VersionType.MILESTONE) return true
    
    return version.status !== VersionStatus.ACTIVE
  }, [state.versions, state.currentVersion])

  // ========== 组装上下文值 ==========

  const contextValue: VersionManagementContextValue = {
    state,
    
    // 初始化和数据加载
    initializeProject,
    refreshVersions,
    
    // 版本创建
    createManualVersion,
    createAutoSave,
    createMilestone,
    createSnapshot,
    
    // 版本操作
    restoreVersion,
    deleteVersion,
    archiveVersion,
    
    // 版本比较
    compareVersions,
    compareWithCurrent,
    clearComparison,
    
    // 版本管理
    updateVersionInfo,
    setCurrentVersion,
    
    // 工具函数
    getVersionByType,
    getRecentVersions,
    canRestoreVersion,
    canDeleteVersion
  }

  return (
    <VersionManagementContext.Provider value={contextValue}>
      {children}
    </VersionManagementContext.Provider>
  )
}

// Hook for using version management
export const useVersionManagement = (): VersionManagementContextValue => {
  const context = useContext(VersionManagementContext)
  if (!context) {
    throw new Error('useVersionManagement must be used within a VersionManagementProvider')
  }
  return context
}

// 便捷 hooks
export const useCurrentVersion = () => {
  const { state } = useVersionManagement()
  return state.currentVersion
}

export const useVersionList = () => {
  const { state } = useVersionManagement()
  return {
    versions: state.versions,
    isLoading: state.isLoading,
    error: state.error
  }
}

export const useVersionOperations = () => {
  const context = useVersionManagement()
  return {
    createManualVersion: context.createManualVersion,
    createAutoSave: context.createAutoSave,
    createMilestone: context.createMilestone,
    createSnapshot: context.createSnapshot,
    restoreVersion: context.restoreVersion,
    deleteVersion: context.deleteVersion,
    isSaving: context.state.isSaving,
    isRestoring: context.state.isRestoring
  }
}