import express from 'express'
import { db } from '../services/database'
import { Collection } from '../types/index'

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
 * 获取所有文集
 * GET /api/v1/collections
 */
router.get('/', async (req: express.Request, res: express.Response) => {
  try {
    const collections = await db.getCollections()
    
    const response: ApiResponse<Collection[]> = {
      success: true,
      data: collections
    }
    
    res.json(response)
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch collections'
      }
    }
    res.status(500).json(response)
  }
})

/**
 * 根据ID获取文集
 * GET /api/v1/collections/:id
 */
router.get('/:id', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params
    const collection = await db.getCollectionById(id)
    
    if (!collection) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Collection not found'
        }
      }
      return res.status(404).json(response)
    }
    
    const response: ApiResponse<Collection> = {
      success: true,
      data: collection
    }
    
    res.json(response)
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch collection'
      }
    }
    res.status(500).json(response)
  }
})

/**
 * 创建新文集
 * POST /api/v1/collections
 */
router.post('/', async (req: express.Request, res: express.Response) => {
  try {
    const { name, description, tags = [], isPublic = false } = req.body
    
    // 验证必填字段
    if (!name || name.trim() === '') {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Collection name is required'
        }
      }
      return res.status(400).json(response)
    }
    
    const collectionData = {
      name: name.trim(),
      description: description?.trim() || '',
      tags: Array.isArray(tags) ? tags : [],
      isPublic: Boolean(isPublic)
    }
    
    const collection = await db.createCollection(collectionData)
    
    const response: ApiResponse<Collection> = {
      success: true,
      data: collection
    }
    
    res.status(201).json(response)
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create collection'
      }
    }
    res.status(500).json(response)
  }
})

/**
 * 更新文集
 * PUT /api/v1/collections/:id
 */
router.put('/:id', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params
    const { name, description, tags, isPublic } = req.body
    
    const updates: any = {}
    
    if (name !== undefined) {
      if (!name || name.trim() === '') {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Collection name cannot be empty'
          }
        }
        return res.status(400).json(response)
      }
      updates.name = name.trim()
    }
    
    if (description !== undefined) {
      updates.description = description?.trim() || ''
    }
    
    if (tags !== undefined) {
      updates.tags = Array.isArray(tags) ? tags : []
    }
    
    if (isPublic !== undefined) {
      updates.isPublic = Boolean(isPublic)
    }
    
    const collection = await db.updateCollection(id, updates)
    
    if (!collection) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Collection not found'
        }
      }
      return res.status(404).json(response)
    }
    
    const response: ApiResponse<Collection> = {
      success: true,
      data: collection
    }
    
    res.json(response)
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update collection'
      }
    }
    res.status(500).json(response)
  }
})

/**
 * 删除文集
 * DELETE /api/v1/collections/:id
 */
router.delete('/:id', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params
    
    const deleted = await db.deleteCollection(id)
    
    if (!deleted) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Collection not found'
        }
      }
      return res.status(404).json(response)
    }
    
    const response: ApiResponse = {
      success: true,
      data: { message: 'Collection deleted successfully' }
    }
    
    res.json(response)
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete collection'
      }
    }
    res.status(500).json(response)
  }
})

export default router