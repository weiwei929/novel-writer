import { Router, Request, Response } from 'express'
import { grokService } from '../services/grok.js'
import {
  ApiErrorCode,
  createSuccessResponse,
  createErrorResponse,
  ErrorCodeToHttpStatus,
} from '../types/api.js'
import { log } from '../utils/logger.js'
import { validate } from '../middleware/validation.js'
import { grokSchemas } from '../validators/grokSchemas.js'

const router = Router()

/**
 * 生成内容
 * POST /api/v1/grok/generate
 */
router.post('/generate', validate(grokSchemas.generate), async (req: Request, res: Response) => {
  try {
    const { prompt, context, maxTokens, temperature, systemPrompt } = req.body

    if (!grokService.isConfigured()) {
      const response = createErrorResponse(
        ApiErrorCode.SERVICE_UNAVAILABLE,
        'Grok API not configured. Please set GROK_API_KEY environment variable.'
      )
      return res.status(ErrorCodeToHttpStatus[ApiErrorCode.SERVICE_UNAVAILABLE]).json(response)
    }

    const result = await grokService.generate({
      prompt,
      context,
      maxTokens,
      temperature,
      systemPrompt,
    })

    const response = createSuccessResponse(result)
    res.json(response)
  } catch (error) {
    log.error('Grok generate error', { error })
    const response = createErrorResponse(
      ApiErrorCode.INTERNAL_ERROR,
      error instanceof Error ? error.message : 'AI generation failed'
    )
    res.status(ErrorCodeToHttpStatus[ApiErrorCode.INTERNAL_ERROR]).json(response)
  }
})

/**
 * 流式生成内容
 * POST /api/v1/grok/generate-stream
 */
router.post(
  '/generate-stream',
  validate(grokSchemas.generateStream),
  async (req: Request, res: Response) => {
    try {
      const { prompt, context, maxTokens, temperature, systemPrompt } = req.body

      if (!grokService.isConfigured()) {
        const response = createErrorResponse(
          ApiErrorCode.SERVICE_UNAVAILABLE,
          'Grok API not configured'
        )
        return res.status(ErrorCodeToHttpStatus[ApiErrorCode.SERVICE_UNAVAILABLE]).json(response)
      }

      // 设置 SSE 头
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      res.setHeader('Access-Control-Allow-Origin', '*')

      try {
        const stream = grokService.generateStream({
          prompt,
          context,
          maxTokens,
          temperature,
          systemPrompt,
        })

        for await (const chunk of stream) {
          res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`)
        }

        res.write('data: [DONE]\n\n')
        res.end()
      } catch (streamError) {
        log.error('Grok stream error', { error: streamError })
        res.write(
          `data: ${JSON.stringify({
            error: streamError instanceof Error ? streamError.message : 'Stream error',
          })}\n\n`
        )
        res.end()
      }
    } catch (error) {
      log.error('Grok stream generate error', { error })
      const response = createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : 'Stream generation failed'
      )
      res.status(ErrorCodeToHttpStatus[ApiErrorCode.INTERNAL_ERROR]).json(response)
    }
  }
)

/**
 * 获取写作建议
 * POST /api/v1/grok/writing-suggestion
 */
router.post(
  '/writing-suggestion',
  validate(grokSchemas.writingSuggestion),
  async (req: Request, res: Response) => {
    try {
      const { content, type = 'continue' } = req.body

      if (!grokService.isConfigured()) {
        const response = createErrorResponse(
          ApiErrorCode.SERVICE_UNAVAILABLE,
          'Grok API not configured'
        )
        return res.status(ErrorCodeToHttpStatus[ApiErrorCode.SERVICE_UNAVAILABLE]).json(response)
      }

      const suggestion = await grokService.getWritingSuggestion(content, type)

      const response = createSuccessResponse({
        suggestion,
        type,
      })
      res.json(response)
    } catch (error) {
      log.error('Writing suggestion error', { error })
      const response = createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : 'Writing suggestion failed'
      )
      res.status(ErrorCodeToHttpStatus[ApiErrorCode.INTERNAL_ERROR]).json(response)
    }
  }
)

/**
 * 生成角色设定
 * POST /api/v1/grok/generate-character
 */
router.post(
  '/generate-character',
  validate(grokSchemas.generateCharacter),
  async (req: Request, res: Response) => {
    try {
      const { description } = req.body

      if (!grokService.isConfigured()) {
        const response = createErrorResponse(
          ApiErrorCode.SERVICE_UNAVAILABLE,
          'Grok API not configured'
        )
        return res.status(ErrorCodeToHttpStatus[ApiErrorCode.SERVICE_UNAVAILABLE]).json(response)
      }

      const character = await grokService.generateCharacter(description)

      const response = createSuccessResponse({
        character,
      })
      res.json(response)
    } catch (error) {
      log.error('Generate character error', { error })
      const response = createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : 'Character generation failed'
      )
      res.status(ErrorCodeToHttpStatus[ApiErrorCode.INTERNAL_ERROR]).json(response)
    }
  }
)

/**
 * 生成世界观设定
 * POST /api/v1/grok/generate-world
 */
router.post(
  '/generate-world',
  validate(grokSchemas.generateWorld),
  async (req: Request, res: Response) => {
    try {
      const { theme } = req.body

      if (!grokService.isConfigured()) {
        const response = createErrorResponse(
          ApiErrorCode.SERVICE_UNAVAILABLE,
          'Grok API not configured'
        )
        return res.status(ErrorCodeToHttpStatus[ApiErrorCode.SERVICE_UNAVAILABLE]).json(response)
      }

      const worldBuilding = await grokService.generateWorldBuilding(theme)

      const response = createSuccessResponse({
        worldBuilding,
      })
      res.json(response)
    } catch (error) {
      log.error('Generate world error', { error })
      const response = createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : 'World building generation failed'
      )
      res.status(ErrorCodeToHttpStatus[ApiErrorCode.INTERNAL_ERROR]).json(response)
    }
  }
)

/**
 * 生成对话
 * POST /api/v1/grok/generate-dialogue
 */
router.post(
  '/generate-dialogue',
  validate(grokSchemas.generateDialogue),
  async (req: Request, res: Response) => {
    try {
      const { characters, context } = req.body

      if (!grokService.isConfigured()) {
        const response = createErrorResponse(
          ApiErrorCode.SERVICE_UNAVAILABLE,
          'Grok API not configured'
        )
        return res.status(ErrorCodeToHttpStatus[ApiErrorCode.SERVICE_UNAVAILABLE]).json(response)
      }

      const dialogue = await grokService.generateDialogue(characters, context)

      const response = createSuccessResponse({
        dialogue,
      })
      res.json(response)
    } catch (error) {
      log.error('Generate dialogue error', { error })
      const response = createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : 'Dialogue generation failed'
      )
      res.status(ErrorCodeToHttpStatus[ApiErrorCode.INTERNAL_ERROR]).json(response)
    }
  }
)

/**
 * 测试 API 连接
 * GET /api/v1/grok/test
 */
router.get('/test', async (req: Request, res: Response) => {
  try {
    if (!grokService.isConfigured()) {
      const response = createSuccessResponse({
        configured: false,
        message: 'Grok API not configured. Please set GROK_API_KEY environment variable.',
      })
      return res.json(response)
    }

    const isWorking = await grokService.testConnection()

    const response = createSuccessResponse({
      configured: true,
      working: isWorking,
      message: isWorking ? 'Grok API is working properly' : 'Grok API connection failed',
    })
    res.json(response)
  } catch (error) {
    log.error('Test connection error', { error })
    const response = createSuccessResponse({
      configured: true,
      working: false,
      message: error instanceof Error ? error.message : 'Connection test failed',
    })
    res.json(response)
  }
})

export default router
