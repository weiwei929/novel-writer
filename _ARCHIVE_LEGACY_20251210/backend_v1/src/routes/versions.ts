import { Router, Request, Response } from 'express'
import { VersionManagementService } from '../services/versionManagementService.js'
import DatabaseService from '../services/database.js'
import {
  CreateVersionRequest,
  UpdateVersionRequest,
  RestoreVersionRequest,
  VersionListQuery,
  VersionType,
  VersionStatus,
} from '../types/index.js'
import {
  ApiErrorCode,
  createSuccessResponse,
  createErrorResponse,
  ErrorCodeToHttpStatus,
} from '../types/api.js'
import { log } from '../utils/logger.js'
import { validate } from '../middleware/validation.js'
import { versionSchemas } from '../validators/versionSchemas.js'

const router = Router()
const dbService = new DatabaseService()
const versionService = new VersionManagementService(dbService)

/**
 * 创建新版本
 * POST /api/v1/projects/:projectId/versions
 */
router.post(
  '/projects/:projectId/versions',
  validate(versionSchemas.projectId, 'params'),
  validate(versionSchemas.create),
  async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params
      const request: CreateVersionRequest = req.body

      const result = await versionService.createVersion(projectId, request)

      if (result.success && result.version) {
        const response = createSuccessResponse(result.version, {
          message: result.message,
        })
        res.status(201).json(response)
      } else {
        const response = createErrorResponse(
          ApiErrorCode.BUSINESS_LOGIC_ERROR,
          result.message || '创建版本失败'
        )
        res.status(ErrorCodeToHttpStatus[ApiErrorCode.BUSINESS_LOGIC_ERROR]).json(response)
      }
    } catch (error) {
      log.error('Failed to create version', { error, projectId: req.params.projectId })
      const response = createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : '创建版本失败'
      )
      res.status(ErrorCodeToHttpStatus[ApiErrorCode.INTERNAL_ERROR]).json(response)
    }
  }
)

/**
 * 获取版本列表
 * GET /api/v1/projects/:projectId/versions
 */
router.get(
  '/projects/:projectId/versions',
  validate(versionSchemas.projectId, 'params'),
  validate(versionSchemas.listQuery, 'query'),
  async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params
      const queryParams = req.query as {
        page?: string
        limit?: string
        type?: string
        status?: string
        tags?: string
        search?: string
        sortBy?: string
        sortOrder?: string
      }

      const query: VersionListQuery = {
        page: parseInt(queryParams.page || '1', 10),
        limit: parseInt(queryParams.limit || '20', 10),
        type: queryParams.type as VersionType | undefined,
        status: queryParams.status as VersionStatus | undefined,
        tags: queryParams.tags ? queryParams.tags.split(',') : undefined,
        search: queryParams.search,
        sortBy: (queryParams.sortBy as 'createdAt' | 'updatedAt' | 'versionNumber') || 'createdAt',
        sortOrder: (queryParams.sortOrder as 'asc' | 'desc') || 'desc',
      }

      const result = await versionService.getVersions(projectId, query)

      const response = createSuccessResponse(
        result.versions,
        { filters: result.filters },
        result.pagination
      )
      res.json(response)
    } catch (error) {
      log.error('Failed to get versions', { error, projectId: req.params.projectId })
      const response = createErrorResponse(
        ApiErrorCode.DATABASE_ERROR,
        error instanceof Error ? error.message : '获取版本列表失败'
      )
      res.status(ErrorCodeToHttpStatus[ApiErrorCode.DATABASE_ERROR]).json(response)
    }
  }
)

/**
 * 获取单个版本详情
 * GET /api/v1/projects/:projectId/versions/:versionId
 */
router.get(
  '/projects/:projectId/versions/:versionId',
  validate(versionSchemas.projectAndVersionId, 'params'),
  async (req: Request, res: Response) => {
    try {
      const { versionId } = req.params

      const version = await versionService.getVersion(versionId)

      if (version) {
        const response = createSuccessResponse(version)
        res.json(response)
      } else {
        const response = createErrorResponse(ApiErrorCode.NOT_FOUND, '版本不存在')
        res.status(ErrorCodeToHttpStatus[ApiErrorCode.NOT_FOUND]).json(response)
      }
    } catch (error) {
      log.error('Failed to get version', { error, versionId: req.params.versionId })
      const response = createErrorResponse(
        ApiErrorCode.DATABASE_ERROR,
        error instanceof Error ? error.message : '获取版本详情失败'
      )
      res.status(ErrorCodeToHttpStatus[ApiErrorCode.DATABASE_ERROR]).json(response)
    }
  }
)

/**
 * 更新版本信息
 * PATCH /api/v1/projects/:projectId/versions/:versionId
 */
router.patch(
  '/projects/:projectId/versions/:versionId',
  validate(versionSchemas.projectAndVersionId, 'params'),
  validate(versionSchemas.update),
  async (req: Request, res: Response) => {
    try {
      const { versionId } = req.params
      const request: UpdateVersionRequest = req.body

      const result = await versionService.updateVersion(versionId, request)

      if (result.success && result.version) {
        const response = createSuccessResponse(result.version, {
          message: result.message,
        })
        res.json(response)
      } else {
        const response = createErrorResponse(
          ApiErrorCode.BUSINESS_LOGIC_ERROR,
          result.message || '更新版本失败'
        )
        res.status(ErrorCodeToHttpStatus[ApiErrorCode.BUSINESS_LOGIC_ERROR]).json(response)
      }
    } catch (error) {
      log.error('Failed to update version', { error, versionId: req.params.versionId })
      const response = createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : '更新版本失败'
      )
      res.status(ErrorCodeToHttpStatus[ApiErrorCode.INTERNAL_ERROR]).json(response)
    }
  }
)

/**
 * 删除版本（软删除）
 * DELETE /api/v1/projects/:projectId/versions/:versionId
 */
router.delete(
  '/projects/:projectId/versions/:versionId',
  validate(versionSchemas.projectAndVersionId, 'params'),
  async (req: Request, res: Response) => {
    try {
      const { versionId } = req.params

      const result = await versionService.deleteVersion(versionId)

      if (result.success) {
        const response = createSuccessResponse({ message: result.message })
        res.json(response)
      } else {
        const response = createErrorResponse(
          ApiErrorCode.BUSINESS_LOGIC_ERROR,
          result.message || '删除版本失败'
        )
        res.status(ErrorCodeToHttpStatus[ApiErrorCode.BUSINESS_LOGIC_ERROR]).json(response)
      }
    } catch (error) {
      log.error('Failed to delete version', { error, versionId: req.params.versionId })
      const response = createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : '删除版本失败'
      )
      res.status(ErrorCodeToHttpStatus[ApiErrorCode.INTERNAL_ERROR]).json(response)
    }
  }
)

/**
 * 恢复到指定版本
 * POST /api/v1/projects/:projectId/versions/:versionId/restore
 */
router.post(
  '/projects/:projectId/versions/:versionId/restore',
  validate(versionSchemas.projectAndVersionId, 'params'),
  validate(versionSchemas.restore),
  async (req: Request, res: Response) => {
    try {
      const { projectId, versionId } = req.params
      const request: RestoreVersionRequest = req.body

      const result = await versionService.restoreVersion(projectId, versionId, request)

      if (result.success && result.version) {
        const response = createSuccessResponse(result.version, {
          message: result.message,
        })
        res.json(response)
      } else {
        const response = createErrorResponse(
          ApiErrorCode.BUSINESS_LOGIC_ERROR,
          result.message || '恢复版本失败'
        )
        res.status(ErrorCodeToHttpStatus[ApiErrorCode.BUSINESS_LOGIC_ERROR]).json(response)
      }
    } catch (error) {
      log.error('Failed to restore version', {
        error,
        projectId: req.params.projectId,
        versionId: req.params.versionId,
      })
      const response = createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : '恢复版本失败'
      )
      res.status(ErrorCodeToHttpStatus[ApiErrorCode.INTERNAL_ERROR]).json(response)
    }
  }
)

/**
 * 比较两个版本
 * GET /api/v1/versions/compare/:sourceVersionId/:targetVersionId
 */
router.get(
  '/versions/compare/:sourceVersionId/:targetVersionId',
  validate(versionSchemas.compare, 'params'),
  async (req: Request, res: Response) => {
    try {
      const { sourceVersionId, targetVersionId } = req.params

      const comparison = await versionService.compareVersions(sourceVersionId, targetVersionId)

      if (comparison) {
        const response = createSuccessResponse(comparison)
        res.json(response)
      } else {
        const response = createErrorResponse(ApiErrorCode.NOT_FOUND, '版本不存在或比较失败')
        res.status(ErrorCodeToHttpStatus[ApiErrorCode.NOT_FOUND]).json(response)
      }
    } catch (error) {
      log.error('Failed to compare versions', {
        error,
        sourceVersionId: req.params.sourceVersionId,
        targetVersionId: req.params.targetVersionId,
      })
      const response = createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : '版本比较失败'
      )
      res.status(ErrorCodeToHttpStatus[ApiErrorCode.INTERNAL_ERROR]).json(response)
    }
  }
)

/**
 * 清理过期版本
 * POST /api/v1/projects/:projectId/versions/cleanup
 */
router.post(
  '/projects/:projectId/versions/cleanup',
  validate(versionSchemas.projectId, 'params'),
  validate(versionSchemas.cleanup),
  async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params
      const keepCount = req.body.keepCount as number

      const result = await versionService.cleanupOldVersions(projectId, keepCount)

      const response = createSuccessResponse(result.data || {}, {
        message: result.message,
      })
      res.json(response)
    } catch (error) {
      log.error('Failed to cleanup versions', { error, projectId: req.params.projectId })
      const response = createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : '清理版本失败'
      )
      res.status(ErrorCodeToHttpStatus[ApiErrorCode.INTERNAL_ERROR]).json(response)
    }
  }
)

/**
 * 获取版本统计信息
 * GET /api/v1/projects/:projectId/versions/stats
 */
router.get(
  '/projects/:projectId/versions/stats',
  validate(versionSchemas.projectId, 'params'),
  async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params

      const stats = await versionService.getVersionStatistics(projectId)

      const response = createSuccessResponse(stats)
      res.json(response)
    } catch (error) {
      log.error('Failed to get version statistics', { error, projectId: req.params.projectId })
      const response = createErrorResponse(
        ApiErrorCode.DATABASE_ERROR,
        error instanceof Error ? error.message : '获取版本统计失败'
      )
      res.status(ErrorCodeToHttpStatus[ApiErrorCode.DATABASE_ERROR]).json(response)
    }
  }
)

/**
 * 自动保存版本（定时任务或触发器使用）
 * POST /api/v1/projects/:projectId/versions/auto-save
 */
router.post(
  '/projects/:projectId/versions/auto-save',
  validate(versionSchemas.projectId, 'params'),
  async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params

      const result = await versionService.createVersion(projectId, {
        type: VersionType.AUTO,
        title: `自动保存 - ${new Date().toLocaleString()}`,
        description: '系统自动创建的保存版本',
        tags: ['auto-save'],
      })

      if (result.success && result.version) {
        const response = createSuccessResponse(result.version, {
          message: result.message,
        })
        res.json(response)
      } else {
        const response = createErrorResponse(
          ApiErrorCode.BUSINESS_LOGIC_ERROR,
          result.message || '自动保存失败'
        )
        res.status(ErrorCodeToHttpStatus[ApiErrorCode.BUSINESS_LOGIC_ERROR]).json(response)
      }
    } catch (error) {
      log.error('Failed to auto-save version', { error, projectId: req.params.projectId })
      const response = createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : '自动保存失败'
      )
      res.status(ErrorCodeToHttpStatus[ApiErrorCode.INTERNAL_ERROR]).json(response)
    }
  }
)

export default router
