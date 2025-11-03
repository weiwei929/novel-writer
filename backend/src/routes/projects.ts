import express from 'express'
import { db } from '../services/database.js'
import { Project } from '../types/index.js'

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
 * 获取所有项目
 * GET /api/v1/projects?collectionId=xxx
 */
router.get('/', async (req: express.Request, res: express.Response) => {
  try {
    const { collectionId } = req.query
    const projects = await db.getProjects(collectionId as string)
    
    const response: ApiResponse<Project[]> = {
      success: true,
      data: projects
    }
    
    res.json(response)
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch projects'
      }
    }
    res.status(500).json(response)
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

export default router