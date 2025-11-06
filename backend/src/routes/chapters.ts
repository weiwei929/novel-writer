import express from 'express'
import { db } from '../services/database.js'
import { Chapter } from '../types/index.js'
import { ApiResponse, ApiErrorCode, createSuccessResponse, createErrorResponse, ErrorCodeToHttpStatus } from '../types/api.js'

const router = express.Router()

/**
 * 获取项目的所有章节 (向后兼容)
 * GET /api/v1/chapters?projectId=xxx
 * 注意: 推荐使用 GET /api/v1/projects/:id/chapters
 */
router.get('/', async (req: express.Request, res: express.Response) => {
  try {
    const { projectId } = req.query
    
    if (!projectId || typeof projectId !== 'string') {
      const response = createErrorResponse(
        ApiErrorCode.VALIDATION_ERROR,
        'Project ID is required'
      )
      return res.status(ErrorCodeToHttpStatus[ApiErrorCode.VALIDATION_ERROR]).json(response)
    }
    
    const chapters = await db.getChapters(projectId)
    
    const response = createSuccessResponse(chapters, {
      projectId,
      note: 'This endpoint is deprecated. Please use GET /api/v1/projects/:id/chapters'
    })
    
    res.json(response)
  } catch (error) {
    const response = createErrorResponse(
      ApiErrorCode.DATABASE_ERROR,
      error instanceof Error ? error.message : 'Failed to fetch chapters'
    )
    res.status(ErrorCodeToHttpStatus[ApiErrorCode.DATABASE_ERROR]).json(response)
  }
})

/**
 * 根据ID获取章节
 * GET /api/v1/chapters/:id
 */
router.get('/:id', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params
    const chapter = await db.getChapterById(id)
    
    if (!chapter) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Chapter not found'
        }
      }
      return res.status(404).json(response)
    }
    
    const response: ApiResponse<Chapter> = {
      success: true,
      data: chapter
    }
    
    res.json(response)
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch chapter'
      }
    }
    res.status(500).json(response)
  }
})

/**
 * 创建章节
 * POST /api/v1/chapters
 */
router.post('/', async (req: express.Request, res: express.Response) => {
  try {
    const { projectId, title, content = '', order, notes } = req.body
    
    // 验证必需字段
    if (!projectId || !title) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Project ID and title are required'
        }
      }
      return res.status(400).json(response)
    }
    
    // 验证项目是否存在
    const project = await db.getProjectById(projectId)
    if (!project) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Project not found'
        }
      }
      return res.status(404).json(response)
    }
    
    const chapter = await db.createChapter({
      projectId,
      title: title.trim(),
      content: content.trim(),
      order
    })
    
    const response: ApiResponse<Chapter> = {
      success: true,
      data: chapter
    }
    
    res.status(201).json(response)
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create chapter'
      }
    }
    res.status(500).json(response)
  }
})

/**
 * 更新章节
 * PUT /api/v1/chapters/:id
 */
router.put('/:id', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params
    const updates = req.body
    
    // 验证章节是否存在
    const existingChapter = await db.getChapterById(id)
    if (!existingChapter) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Chapter not found'
        }
      }
      return res.status(404).json(response)
    }
    
    // 过滤掉不应该更新的字段
    const allowedUpdates = {
      title: updates.title,
      content: updates.content,
      order: updates.order,
      status: updates.status,
      notes: updates.notes,
      tags: updates.tags
    }
    
    // 移除 undefined 值
    Object.keys(allowedUpdates).forEach(key => {
      if (allowedUpdates[key as keyof typeof allowedUpdates] === undefined) {
        delete allowedUpdates[key as keyof typeof allowedUpdates]
      }
    })
    
    const updatedChapter = await db.updateChapter(id, allowedUpdates)
    
    if (!updatedChapter) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update chapter'
        }
      }
      return res.status(500).json(response)
    }
    
    const response: ApiResponse<Chapter> = {
      success: true,
      data: updatedChapter
    }
    
    res.json(response)
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update chapter'
      }
    }
    res.status(500).json(response)
  }
})

/**
 * 删除章节
 * DELETE /api/v1/chapters/:id
 */
router.delete('/:id', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params
    
    // 验证章节是否存在
    const existingChapter = await db.getChapterById(id)
    if (!existingChapter) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Chapter not found'
        }
      }
      return res.status(404).json(response)
    }
    
    const success = await db.deleteChapter(id)
    
    if (!success) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to delete chapter'
        }
      }
      return res.status(500).json(response)
    }
    
    const response: ApiResponse = {
      success: true,
      data: null
    }
    
    res.json(response)
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete chapter'
      }
    }
    res.status(500).json(response)
  }
})



/**
 * 更新章节元数据字段
 * PUT /api/v1/chapters/:id/metadata/:field
 */
router.put('/:id/metadata/:field', async (req: express.Request, res: express.Response) => {
  try {
    const { id, field } = req.params
    const { content } = req.body

    const item = await db.updateChapterMetadataField(id, field, content)
    const response = createSuccessResponse(item)
    res.status(200).json(response)
  } catch (error) {
    const response = createErrorResponse(
      ApiErrorCode.DATABASE_ERROR,
      error instanceof Error ? error.message : 'Failed to update chapter metadata'
    )
    res.status(ErrorCodeToHttpStatus[ApiErrorCode.DATABASE_ERROR]).json(response)
  }
})

/**
 * 获取章节元数据版本历史
 * GET /api/v1/chapters/:id/metadata/:field/versions
 */
router.get('/:id/metadata/:field/versions', async (req: express.Request, res: express.Response) => {
  try {
    const { id, field } = req.params

    const versions = await db.getChapterMetadataVersions(id, field)
    const response = createSuccessResponse(versions)
    res.status(200).json(response)
  } catch (error) {
    const response = createErrorResponse(
      ApiErrorCode.DATABASE_ERROR,
      error instanceof Error ? error.message : 'Failed to fetch chapter metadata versions'
    )
    res.status(ErrorCodeToHttpStatus[ApiErrorCode.DATABASE_ERROR]).json(response)
  }
})

/**
 * 获取章节元数据当前值
 * GET /api/v1/chapters/:id/metadata/:field
 */
router.get('/:id/metadata/:field', async (req: express.Request, res: express.Response) => {
  try {
    const { id, field } = req.params

    const item = await db.getChapterMetadataField(id, field)
    const response = createSuccessResponse(item)
    res.status(200).json(response)
  } catch (error) {
    const response = createErrorResponse(
      ApiErrorCode.DATABASE_ERROR,
      error instanceof Error ? error.message : 'Failed to fetch chapter metadata'
    )
    res.status(ErrorCodeToHttpStatus[ApiErrorCode.DATABASE_ERROR]).json(response)
  }
})

/**
 * 保存章节元数据版本
 * POST /api/v1/chapters/:id/metadata/:field/save-version
 */
router.post('/:id/metadata/:field/save-version', async (req: express.Request, res: express.Response) => {
  try {
    const { id, field } = req.params
    const { content, userNote, autoSaved } = req.body

    const version = await db.saveChapterMetadataVersion(id, field, content, userNote, autoSaved)
    const response = createSuccessResponse(version)
    res.status(201).json(response)
  } catch (error) {
    const response = createErrorResponse(
      ApiErrorCode.DATABASE_ERROR,
      error instanceof Error ? error.message : 'Failed to save chapter metadata version'
    )
    res.status(ErrorCodeToHttpStatus[ApiErrorCode.DATABASE_ERROR]).json(response)
  }
})

export default router