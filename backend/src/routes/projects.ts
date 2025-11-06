import express from 'express'
import { db } from '../services/database.js'
import { Project, Chapter } from '../types/index.js'
import { ApiResponse, ApiErrorCode, createSuccessResponse, createErrorResponse, ErrorCodeToHttpStatus } from '../types/api.js'

const router = express.Router()

// ===== 项目元数据端点 =====
router.put('/:id/metadata/:field', async (req: express.Request, res: express.Response) => {
  try {
    const { id, field } = req.params
    const { content } = req.body || {}

    const item = await db.updateProjectMetadataField(id, field, content || '')
    const response = createSuccessResponse(item, { projectId: id, field })
    res.json(response)
  } catch (error) {
    const response = createErrorResponse(
      ApiErrorCode.DATABASE_ERROR,
      error instanceof Error ? error.message : 'Failed to update project metadata'
    )
    res.status(ErrorCodeToHttpStatus[ApiErrorCode.DATABASE_ERROR]).json(response)
  }
})

router.get('/:id/metadata/:field', async (req: express.Request, res: express.Response) => {
  try {
    const { id, field } = req.params
    const item = await db.getProjectMetadataField(id, field)
    const response = createSuccessResponse(item, { projectId: id, field })
    res.json(response)
  } catch (error) {
    const response = createErrorResponse(
      ApiErrorCode.DATABASE_ERROR,
      error instanceof Error ? error.message : 'Failed to fetch project metadata'
    )
    res.status(ErrorCodeToHttpStatus[ApiErrorCode.DATABASE_ERROR]).json(response)
  }
})

router.get('/:id/metadata/:field/versions', async (req: express.Request, res: express.Response) => {
  try {
    const { id, field } = req.params
    const versions = await db.getProjectMetadataVersions(id, field)
    const response = createSuccessResponse(versions, { projectId: id, field })
    res.json(response)
  } catch (error) {
    const response = createErrorResponse(
      ApiErrorCode.DATABASE_ERROR,
      error instanceof Error ? error.message : 'Failed to fetch metadata versions'
    )
    res.status(ErrorCodeToHttpStatus[ApiErrorCode.DATABASE_ERROR]).json(response)
  }
})

// ===== 章节规划（Project级结构化数据） =====
router.put('/:id/chapter-planning', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params
    const { plans } = req.body || {}

    // 校验项目存在
    const project = await db.getProjectById(id)
    if (!project) {
      const response = createErrorResponse(
        ApiErrorCode.NOT_FOUND,
        'Project not found'
      )
      return res.status(ErrorCodeToHttpStatus[ApiErrorCode.NOT_FOUND]).json(response)
    }

    const updated = await db.updateProjectChapterPlanning(id, Array.isArray(plans) ? plans : [])
    const response = createSuccessResponse(updated, { projectId: id })
    res.json(response)
  } catch (error) {
    const response = createErrorResponse(
      ApiErrorCode.DATABASE_ERROR,
      error instanceof Error ? error.message : 'Failed to update chapter planning'
    )
    res.status(ErrorCodeToHttpStatus[ApiErrorCode.DATABASE_ERROR]).json(response)
  }
})

router.post('/:id/metadata/:field/save-version', async (req: express.Request, res: express.Response) => {
  try {
    const { id, field } = req.params
    const { content, userNote, autoSaved } = req.body || {}
    const version = await db.saveProjectMetadataVersion(id, field, content || '', userNote || '', !!autoSaved)
    const response = createSuccessResponse(version, { projectId: id, field })
    res.status(201).json(response)
  } catch (error) {
    const response = createErrorResponse(
      ApiErrorCode.DATABASE_ERROR,
      error instanceof Error ? error.message : 'Failed to save metadata version'
    )
    res.status(ErrorCodeToHttpStatus[ApiErrorCode.DATABASE_ERROR]).json(response)
  }
})

/**
 * 获取所有项目
 * GET /api/v1/projects?collectionId=xxx
 */
router.get('/', async (req: express.Request, res: express.Response) => {
  try {
    const { collectionId } = req.query
    const projects = await db.getProjects(collectionId as string)
    
    const response = createSuccessResponse(projects, {
      collectionId: collectionId || 'all'
    })
    
    res.json(response)
  } catch (error) {
    const response = createErrorResponse(
      ApiErrorCode.DATABASE_ERROR,
      error instanceof Error ? error.message : 'Failed to fetch projects'
    )
    res.status(ErrorCodeToHttpStatus[ApiErrorCode.DATABASE_ERROR]).json(response)
  }
})

/**
 * 根据ID获取项目
 * GET /api/v1/projects/:id
 */
router.get('/:id', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params
    const project = await db.getProjectById(id)
    
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
    
    const response: ApiResponse<Project> = {
      success: true,
      data: project
    }
    
    res.json(response)
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch project'
      }
    }
    res.status(500).json(response)
  }
})

/**
 * 创建新项目
 * POST /api/v1/projects
 */
router.post('/', async (req: express.Request, res: express.Response) => {
  try {
    const { 
      title, 
      description, 
      author, 
      genre = [], 
      tags = [], 
      status = 'draft',
      collectionId 
    } = req.body
    
    // 验证必填字段
    if (!title || title.trim() === '') {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Project title is required'
        }
      }
      return res.status(400).json(response)
    }
    
    if (!author || author.trim() === '') {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Author is required'
        }
      }
      return res.status(400).json(response)
    }
    
    // 如果指定了文集ID，验证文集是否存在
    if (collectionId) {
      const collection = await db.getCollectionById(collectionId)
      if (!collection) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Collection not found'
          }
        }
        return res.status(400).json(response)
      }
    }
    
    const projectData = {
      title: title.trim(),
      description: description?.trim() || '',
      author: author.trim(),
      genre: Array.isArray(genre) ? genre : [],
      tags: Array.isArray(tags) ? tags : [],
      status,
      collectionId
    }
    
    const project = await db.createProject(projectData)
    
    const response: ApiResponse<Project> = {
      success: true,
      data: project
    }
    
    res.status(201).json(response)
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create project'
      }
    }
    res.status(500).json(response)
  }
})

/**
 * 更新项目
 * PUT /api/v1/projects/:id
 */
router.put('/:id', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params
    const { title, description, author, genre, tags, status, collectionId } = req.body
    
    const updates: any = {}
    
    if (title !== undefined) {
      if (!title || title.trim() === '') {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Project title cannot be empty'
          }
        }
        return res.status(400).json(response)
      }
      updates.title = title.trim()
    }
    
    if (author !== undefined) {
      if (!author || author.trim() === '') {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Author cannot be empty'
          }
        }
        return res.status(400).json(response)
      }
      updates.author = author.trim()
    }
    
    if (description !== undefined) {
      updates.description = description?.trim() || ''
    }
    
    if (genre !== undefined) {
      updates.genre = Array.isArray(genre) ? genre : []
    }
    
    if (tags !== undefined) {
      updates.tags = Array.isArray(tags) ? tags : []
    }
    
    if (status !== undefined) {
      updates.status = status
    }
    
    if (collectionId !== undefined) {
      updates.collectionId = collectionId
    }
    
    const project = await db.updateProject(id, updates)
    
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
    
    const response: ApiResponse<Project> = {
      success: true,
      data: project
    }
    
    res.json(response)
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update project'
      }
    }
    res.status(500).json(response)
  }
})

/**
 * 删除项目
 * DELETE /api/v1/projects/:id
 */
router.delete('/:id', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params
    
    const deleted = await db.deleteProject(id)
    
    if (!deleted) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Project not found'
        }
      }
      return res.status(404).json(response)
    }
    
    const response: ApiResponse = {
      success: true,
      data: { message: 'Project deleted successfully' }
    }
    
    res.json(response)
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete project'
      }
    }
    res.status(500).json(response)
  }
})

/**
 * 搜索项目（暂时实现为获取所有项目）
 * GET /api/v1/projects/search?q=xxx
 */
router.get('/search', async (req: express.Request, res: express.Response) => {
  try {
    const { q } = req.query
    
    if (!q || typeof q !== 'string' || q.trim() === '') {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Search query is required'
        }
      }
      return res.status(400).json(response)
    }
    
    // 暂时返回所有项目，后续实现搜索逻辑
    const projects = await db.getProjects()
    const filteredProjects = projects.filter(p => 
      p.title.toLowerCase().includes(q.toLowerCase()) ||
      p.description?.toLowerCase().includes(q.toLowerCase()) ||
      p.author.toLowerCase().includes(q.toLowerCase())
    )
    
    const response: ApiResponse<Project[]> = {
      success: true,
      data: filteredProjects
    }
    
    res.json(response)
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to search projects'
      }
    }
    res.status(500).json(response)
  }
})

/**
 * 完成项目
 * PUT /api/v1/projects/:id/complete
 */
router.put('/:id/complete', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params
    const project = await db.getProjectById(id)
    
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
    
    // 更新项目状态为已完成
    const updatedProject = await db.updateProject(id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    
    if (!updatedProject) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update project'
        }
      }
      return res.status(500).json(response)
    }
    
    const response: ApiResponse<Project> = {
      success: true,
      data: updatedProject
    }
    
    res.json(response)
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to complete project'
      }
    }
    res.status(500).json(response)
  }
})

/**
 * 归档项目到文集
 * PUT /api/v1/projects/:id/archive
 */
router.put('/:id/archive', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params
    const { collectionId } = req.body
    
    if (!collectionId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Collection ID is required'
        }
      }
      return res.status(400).json(response)
    }
    
    const project = await db.getProjectById(id)
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
    
    // 验证文集是否存在
    const collection = await db.getCollectionById(collectionId)
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
    
    // 更新项目状态为已归档，并关联到文集
    const updatedProject = await db.updateProject(id, {
      status: 'archived',
      collectionId,
      updatedAt: new Date().toISOString()
    })
    
    if (!updatedProject) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update project'
        }
      }
      return res.status(500).json(response)
    }
    
    const response: ApiResponse<Project> = {
      success: true,
      data: updatedProject
    }
    
    res.json(response)
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to archive project'
      }
    }
    res.status(500).json(response)
  }
})

// ============ 章节相关端点 (RESTful) ============

/**
 * 获取项目的所有章节 (RESTful)
 * GET /api/v1/projects/:id/chapters
 */
router.get('/:id/chapters', async (req: express.Request, res: express.Response) => {
  try {
    const { id: projectId } = req.params
    
    // 验证项目是否存在
    const project = await db.getProjectById(projectId)
    if (!project) {
      const response = createErrorResponse(
        ApiErrorCode.NOT_FOUND,
        'Project not found'
      )
      return res.status(ErrorCodeToHttpStatus[ApiErrorCode.NOT_FOUND]).json(response)
    }
    
    const chapters = await db.getChapters(projectId)
    
    const response = createSuccessResponse(chapters, {
      projectId,
      projectTitle: project.title
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
 * 为项目创建新章节 (RESTful)
 * POST /api/v1/projects/:id/chapters
 */
router.post('/:id/chapters', async (req: express.Request, res: express.Response) => {
  try {
    const { id: projectId } = req.params
    const chapterData = req.body
    
    // 验证项目是否存在
    const project = await db.getProjectById(projectId)
    if (!project) {
      const response = createErrorResponse(
        ApiErrorCode.NOT_FOUND,
        'Project not found'
      )
      return res.status(ErrorCodeToHttpStatus[ApiErrorCode.NOT_FOUND]).json(response)
    }
    
    // 验证必需字段
    if (!chapterData.title) {
      const response = createErrorResponse(
        ApiErrorCode.VALIDATION_ERROR,
        'Chapter title is required'
      )
      return res.status(ErrorCodeToHttpStatus[ApiErrorCode.VALIDATION_ERROR]).json(response)
    }
    
    // 设置项目ID
    chapterData.projectId = projectId
    
    const newChapter = await db.createChapter(chapterData)
    
    const response = createSuccessResponse(newChapter, {
      projectId,
      projectTitle: project.title
    })
    
    res.status(201).json(response)
  } catch (error) {
    const response = createErrorResponse(
      ApiErrorCode.DATABASE_ERROR,
      error instanceof Error ? error.message : 'Failed to create chapter'
    )
    res.status(ErrorCodeToHttpStatus[ApiErrorCode.DATABASE_ERROR]).json(response)
  }
})

export default router