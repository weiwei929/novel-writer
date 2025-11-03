import express from 'express'
import { db } from '../services/database.js'

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

const router = express.Router()

/**
 * 获取数据库统计信息
 * GET /api/v1/stats
 */
router.get('/', async (req: express.Request, res: express.Response) => {
  try {
    const stats = await db.getStats()
    
    const response: ApiResponse = {
      success: true,
      data: stats
    }
    
    res.json(response)
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch statistics'
      }
    }
    res.status(500).json(response)
  }
})

export default router