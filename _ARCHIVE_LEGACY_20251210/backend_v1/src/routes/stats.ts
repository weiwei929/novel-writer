import { Router, Request, Response } from 'express'
import { db } from '../services/database.js'
import {
  ApiErrorCode,
  createSuccessResponse,
  createErrorResponse,
  ErrorCodeToHttpStatus,
} from '../types/api.js'
import { log } from '../utils/logger.js'

const router = Router()

/**
 * 获取数据库统计信息
 * GET /api/v1/stats
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const stats = await db.getStats()
    const response = createSuccessResponse(stats)
    res.json(response)
  } catch (error) {
    log.error('Failed to fetch statistics', { error })
    const response = createErrorResponse(
      ApiErrorCode.DATABASE_ERROR,
      error instanceof Error ? error.message : 'Failed to fetch statistics'
    )
    res.status(ErrorCodeToHttpStatus[ApiErrorCode.DATABASE_ERROR]).json(response)
  }
})

export default router
