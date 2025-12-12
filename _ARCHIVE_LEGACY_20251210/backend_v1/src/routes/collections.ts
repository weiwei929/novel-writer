import { Router, Request, Response } from 'express'
import { db } from '../services/database.js'
import { Collection } from '../types/index.js'
import {
  ApiErrorCode,
  createSuccessResponse,
  createErrorResponse,
  ErrorCodeToHttpStatus,
} from '../types/api.js'
import { log } from '../utils/logger.js'
import { validate } from '../middleware/validation.js'
import { collectionSchemas } from '../validators/collectionSchemas.js'

const router = Router()

/**
 * 获取所有文集
 * GET /api/v1/collections
 */
/**
 * 获取所有文集
 * GET /api/v1/collections
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const collections = await db.getCollections()
    const response = createSuccessResponse(collections)
    res.json(response)
  } catch (error) {
    log.error('Failed to fetch collections', { error })
    const response = createErrorResponse(
      ApiErrorCode.DATABASE_ERROR,
      error instanceof Error ? error.message : 'Failed to fetch collections'
    )
    res.status(ErrorCodeToHttpStatus[ApiErrorCode.DATABASE_ERROR]).json(response)
  }
})

/**
 * 根据ID获取文集
 * GET /api/v1/collections/:id
 */
/**
 * 根据ID获取文集
 * GET /api/v1/collections/:id
 */
router.get(
  '/:id',
  validate(collectionSchemas.id, 'params'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const collection = await db.getCollectionById(id)

      if (!collection) {
        const response = createErrorResponse(ApiErrorCode.NOT_FOUND, 'Collection not found')
        return res.status(ErrorCodeToHttpStatus[ApiErrorCode.NOT_FOUND]).json(response)
      }

      const response = createSuccessResponse(collection)
      res.json(response)
    } catch (error) {
      log.error('Failed to fetch collection', { error, collectionId: req.params.id })
      const response = createErrorResponse(
        ApiErrorCode.DATABASE_ERROR,
        error instanceof Error ? error.message : 'Failed to fetch collection'
      )
      res.status(ErrorCodeToHttpStatus[ApiErrorCode.DATABASE_ERROR]).json(response)
    }
  }
)

/**
 * 创建新文集
 * POST /api/v1/collections
 */
/**
 * 创建新文集
 * POST /api/v1/collections
 */
router.post('/', validate(collectionSchemas.create), async (req: Request, res: Response) => {
  try {
    const { name, description, tags = [], isPublic = false } = req.body

    const collectionData = {
      name,
      description: description || '',
      tags,
      isPublic,
    }

    const collection = await db.createCollection(collectionData)
    const response = createSuccessResponse(collection)
    res.status(201).json(response)
  } catch (error) {
    log.error('Failed to create collection', { error })
    const response = createErrorResponse(
      ApiErrorCode.DATABASE_ERROR,
      error instanceof Error ? error.message : 'Failed to create collection'
    )
    res.status(ErrorCodeToHttpStatus[ApiErrorCode.DATABASE_ERROR]).json(response)
  }
})

/**
 * 更新文集
 * PUT /api/v1/collections/:id
 */
/**
 * 更新文集
 * PUT /api/v1/collections/:id
 */
router.put(
  '/:id',
  validate(collectionSchemas.id, 'params'),
  validate(collectionSchemas.update),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const updates = req.body

      const collection = await db.updateCollection(id, updates)

      if (!collection) {
        const response = createErrorResponse(ApiErrorCode.NOT_FOUND, 'Collection not found')
        return res.status(ErrorCodeToHttpStatus[ApiErrorCode.NOT_FOUND]).json(response)
      }

      const response = createSuccessResponse(collection)
      res.json(response)
    } catch (error) {
      log.error('Failed to update collection', { error, collectionId: req.params.id })
      const response = createErrorResponse(
        ApiErrorCode.DATABASE_ERROR,
        error instanceof Error ? error.message : 'Failed to update collection'
      )
      res.status(ErrorCodeToHttpStatus[ApiErrorCode.DATABASE_ERROR]).json(response)
    }
  }
)

/**
 * 删除文集
 * DELETE /api/v1/collections/:id
 */
/**
 * 删除文集
 * DELETE /api/v1/collections/:id
 */
router.delete(
  '/:id',
  validate(collectionSchemas.id, 'params'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params

      const deleted = await db.deleteCollection(id)

      if (!deleted) {
        const response = createErrorResponse(ApiErrorCode.NOT_FOUND, 'Collection not found')
        return res.status(ErrorCodeToHttpStatus[ApiErrorCode.NOT_FOUND]).json(response)
      }

      const response = createSuccessResponse({ message: 'Collection deleted successfully' })
      res.json(response)
    } catch (error) {
      log.error('Failed to delete collection', { error, collectionId: req.params.id })
      const response = createErrorResponse(
        ApiErrorCode.DATABASE_ERROR,
        error instanceof Error ? error.message : 'Failed to delete collection'
      )
      res.status(ErrorCodeToHttpStatus[ApiErrorCode.DATABASE_ERROR]).json(response)
    }
  }
)

export default router
