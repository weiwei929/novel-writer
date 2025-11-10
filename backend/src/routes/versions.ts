import { Router } from 'express'
import { VersionManagementService } from '../services/versionManagementService.js'
import DatabaseService from '../services/database.js'
import {
  CreateVersionRequest,
  UpdateVersionRequest,
  RestoreVersionRequest,
  VersionListQuery,
  VersionType,
  VersionStatus
} from '../types/index.js'

const router = Router()
const dbService = new DatabaseService()
const versionService = new VersionManagementService(dbService)

/**
 * 创建新版本
 * POST /api/projects/:projectId/versions
 */
router.post('/projects/:projectId/versions', async (req, res) => {
  try {
    const { projectId } = req.params
    const request: CreateVersionRequest = req.body

    // 验证请求数据
    if (!request.type || !Object.values(VersionType).includes(request.type)) {
      return res.status(400).json({
        success: false,
        error: { message: '版本类型无效' }
      })
    }

    const result = await versionService.createVersion(projectId, request)
    
    if (result.success) {
      res.status(201).json({
        success: true,
        data: result.version,
        message: result.message
      })
    } else {
      res.status(400).json({
        success: false,
        error: { message: result.message }
      })
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { 
        message: '创建版本失败',
        details: error?.message || '未知错误'
      }
    })
  }
})

/**
 * 获取版本列表
 * GET /api/projects/:projectId/versions
 */
router.get('/projects/:projectId/versions', async (req, res) => {
  try {
    const { projectId } = req.params
    const query: VersionListQuery = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      type: req.query.type as VersionType,
      status: req.query.status as VersionStatus,
      tags: req.query.tags ? String(req.query.tags).split(',') : undefined,
      search: req.query.search as string,
      sortBy: req.query.sortBy as any || 'createdAt',
      sortOrder: req.query.sortOrder as any || 'desc'
    }

    const result = await versionService.getVersions(projectId, query)
    
    res.json({
      success: true,
      data: result.versions,
      pagination: result.pagination,
      filters: result.filters
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { 
        message: '获取版本列表失败',
        details: error?.message || '未知错误'
      }
    })
  }
})

/**
 * 获取单个版本详情
 * GET /api/projects/:projectId/versions/:versionId
 */
router.get('/projects/:projectId/versions/:versionId', async (req, res) => {
  try {
    const { versionId } = req.params
    
    const version = await versionService.getVersion(versionId)
    
    if (version) {
      res.json({
        success: true,
        data: version
      })
    } else {
      res.status(404).json({
        success: false,
        error: { message: '版本不存在' }
      })
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { 
        message: '获取版本详情失败',
        details: error?.message || '未知错误'
      }
    })
  }
})

/**
 * 更新版本信息
 * PATCH /api/projects/:projectId/versions/:versionId
 */
router.patch('/projects/:projectId/versions/:versionId', async (req, res) => {
  try {
    const { versionId } = req.params
    const request: UpdateVersionRequest = req.body

    // 验证状态值
    if (request.status && !Object.values(VersionStatus).includes(request.status)) {
      return res.status(400).json({
        success: false,
        error: { message: '版本状态无效' }
      })
    }

    const result = await versionService.updateVersion(versionId, request)
    
    if (result.success) {
      res.json({
        success: true,
        data: result.version,
        message: result.message
      })
    } else {
      res.status(400).json({
        success: false,
        error: { message: result.message }
      })
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { 
        message: '更新版本失败',
        details: error?.message || '未知错误'
      }
    })
  }
})

/**
 * 删除版本（软删除）
 * DELETE /api/projects/:projectId/versions/:versionId
 */
router.delete('/projects/:projectId/versions/:versionId', async (req, res) => {
  try {
    const { versionId } = req.params
    
    const result = await versionService.deleteVersion(versionId)
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message
      })
    } else {
      res.status(400).json({
        success: false,
        error: { message: result.message }
      })
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { 
        message: '删除版本失败',
        details: error?.message || '未知错误'
      }
    })
  }
})

/**
 * 恢复到指定版本
 * POST /api/projects/:projectId/versions/:versionId/restore
 */
router.post('/projects/:projectId/versions/:versionId/restore', async (req, res) => {
  try {
    const { projectId, versionId } = req.params
    const request: RestoreVersionRequest = {
      createBackup: req.body.createBackup !== false, // 默认创建备份
      backupTitle: req.body.backupTitle,
      backupDescription: req.body.backupDescription
    }

    const result = await versionService.restoreVersion(projectId, versionId, request)
    
    if (result.success) {
      res.json({
        success: true,
        data: result.version,
        message: result.message
      })
    } else {
      res.status(400).json({
        success: false,
        error: { message: result.message }
      })
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { 
        message: '恢复版本失败',
        details: error?.message || '未知错误'
      }
    })
  }
})

/**
 * 比较两个版本
 * GET /api/versions/compare/:sourceVersionId/:targetVersionId
 */
router.get('/versions/compare/:sourceVersionId/:targetVersionId', async (req, res) => {
  try {
    const { sourceVersionId, targetVersionId } = req.params
    
    const comparison = await versionService.compareVersions(sourceVersionId, targetVersionId)
    
    if (comparison) {
      res.json({
        success: true,
        data: comparison
      })
    } else {
      res.status(404).json({
        success: false,
        error: { message: '版本不存在或比较失败' }
      })
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { 
        message: '版本比较失败',
        details: error?.message || '未知错误'
      }
    })
  }
})

/**
 * 清理过期版本
 * POST /api/projects/:projectId/versions/cleanup
 */
router.post('/projects/:projectId/versions/cleanup', async (req, res) => {
  try {
    const { projectId } = req.params
    const keepCount = parseInt(req.body.keepCount) || 50

    const result = await versionService.cleanupOldVersions(projectId, keepCount)
    
    res.json({
      success: result.success,
      message: result.message,
      data: result.data
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { 
        message: '清理版本失败',
        details: error?.message || '未知错误'
      }
    })
  }
})

/**
 * 获取版本统计信息
 * GET /api/projects/:projectId/versions/stats
 */
router.get('/projects/:projectId/versions/stats', async (req, res) => {
  try {
    const { projectId } = req.params
    
    const stats = await versionService.getVersionStatistics(projectId)
    
    res.json({
      success: true,
      data: stats
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { 
        message: '获取版本统计失败',
        details: error?.message || '未知错误'
      }
    })
  }
})

/**
 * 自动保存版本（定时任务或触发器使用）
 * POST /api/projects/:projectId/versions/auto-save
 */
router.post('/projects/:projectId/versions/auto-save', async (req, res) => {
  try {
    const { projectId } = req.params
    
    const result = await versionService.createVersion(projectId, {
      type: VersionType.AUTO,
      title: `自动保存 - ${new Date().toLocaleString()}`,
      description: '系统自动创建的保存版本',
      tags: ['auto-save']
    })
    
    if (result.success) {
      res.json({
        success: true,
        data: result.version,
        message: result.message
      })
    } else {
      res.status(400).json({
        success: false,
        error: { message: result.message }
      })
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { 
        message: '自动保存失败',
        details: error?.message || '未知错误'
      }
    })
  }
})

export default router

