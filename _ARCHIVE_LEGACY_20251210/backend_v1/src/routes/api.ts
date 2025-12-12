import { Router, Request, Response } from 'express'
import { db } from '../services/database.js'
import { ApiResponse, Collection, Project, Chapter } from '../types/index.js'

const router = Router()

// ==================== 通用路由 ====================
// 注意：collections、projects、chapters 路由已移至独立的路由器
// - collectionsRouter: /api/v1/collections
// - projectsRouter: /api/v1/projects
// - chaptersRouter: /api/v1/chapters
// 这些独立路由器已包含验证、统一响应格式等优化

/**
 * 搜索
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q: query, type } = req.query

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Search query is required',
        },
      })
    }

    type SearchType = 'collections' | 'projects' | 'chapters'
    const searchType: SearchType | undefined = type ? (type as SearchType) : undefined
    const results = await db.search(query, searchType)

    const response: ApiResponse = {
      success: true,
      data: results,
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    }

    res.json(response)
  } catch (error) {
    console.error('Error searching:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'SEARCH_ERROR',
        message: error instanceof Error ? error.message : 'Search failed',
      },
    })
  }
})

// 注意：stats 路由已移至独立的路由器 statsRouter
// 位置：/api/v1/stats

// ==================== Grok AI 路由 ====================

/**
 * 生成内容
 */
router.post('/ai/generate', async (req: Request, res: Response) => {
  try {
    const { grokService } = await import('../services/grok.js')
    const { prompt, context, maxTokens, temperature, systemPrompt } = req.body

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PROMPT',
          message: 'Prompt is required and must be a string',
        },
      })
    }

    if (!grokService.isConfigured()) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'API_NOT_CONFIGURED',
          message: 'Grok API not configured. Please set GROK_API_KEY environment variable.',
        },
      })
    }

    const response = await grokService.generate({
      prompt,
      context,
      maxTokens,
      temperature,
      systemPrompt,
    })

    res.json({
      success: true,
      data: response,
    })
  } catch (error) {
    console.error('Generate error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'AI_GENERATE_ERROR',
        message: error instanceof Error ? error.message : 'AI generation failed',
      },
    })
  }
})

/**
 * 获取写作建议
 */
router.post('/ai/writing-suggestion', async (req: Request, res: Response) => {
  try {
    const { grokService } = await import('../services/grok.js')
    const { content, type = 'continue' } = req.body

    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CONTENT',
          message: 'Content is required and must be a string',
        },
      })
    }

    if (!['continue', 'improve', 'brainstorm'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TYPE',
          message: 'Type must be one of: continue, improve, brainstorm',
        },
      })
    }

    if (!grokService.isConfigured()) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'API_NOT_CONFIGURED',
          message: 'Grok API not configured',
        },
      })
    }

    const suggestion = await grokService.getWritingSuggestion(content, type)

    res.json({
      success: true,
      data: {
        suggestion,
        type,
      },
    })
  } catch (error) {
    console.error('Writing suggestion error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'AI_SUGGESTION_ERROR',
        message: error instanceof Error ? error.message : 'Writing suggestion failed',
      },
    })
  }
})

/**
 * 生成角色设定
 */
router.post('/ai/generate-character', async (req: Request, res: Response) => {
  try {
    const { grokService } = await import('../services/grok.js')
    const { description } = req.body

    if (!description || typeof description !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DESCRIPTION',
          message: 'Description is required and must be a string',
        },
      })
    }

    if (!grokService.isConfigured()) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'API_NOT_CONFIGURED',
          message: 'Grok API not configured',
        },
      })
    }

    const character = await grokService.generateCharacter(description)

    res.json({
      success: true,
      data: {
        character,
      },
    })
  } catch (error) {
    console.error('Generate character error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'AI_CHARACTER_ERROR',
        message: error instanceof Error ? error.message : 'Character generation failed',
      },
    })
  }
})

/**
 * 测试 AI API 连接
 */
router.get('/ai/test', async (req: Request, res: Response) => {
  try {
    const { grokService } = await import('../services/grok.js')

    if (!grokService.isConfigured()) {
      return res.json({
        success: false,
        data: {
          configured: false,
          message: 'Grok API not configured. Please set GROK_API_KEY environment variable.',
        },
      })
    }

    const isWorking = await grokService.testConnection()

    res.json({
      success: isWorking,
      data: {
        configured: true,
        working: isWorking,
        message: isWorking ? 'Grok API is working properly' : 'Grok API connection failed',
      },
    })
  } catch (error) {
    console.error('Test connection error:', error)
    res.json({
      success: false,
      data: {
        configured: true,
        working: false,
        message: error instanceof Error ? error.message : 'Connection test failed',
      },
    })
  }
})

export default router
