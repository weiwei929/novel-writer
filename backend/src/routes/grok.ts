import { Router, Request, Response } from 'express'
import { grokService } from '../services/grok.js'

const router = Router()

// 生成内容
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { prompt, context, maxTokens, temperature, systemPrompt } = req.body

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        error: 'Prompt is required and must be a string'
      })
    }

    if (!grokService.isConfigured()) {
      return res.status(503).json({
        error: 'Grok API not configured. Please set GROK_API_KEY environment variable.'
      })
    }

    const response = await grokService.generate({
      prompt,
      context,
      maxTokens,
      temperature,
      systemPrompt
    })

    res.json({
      success: true,
      data: response
    })
  } catch (error) {
    console.error('Generate error:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    })
  }
})

// 流式生成内容
router.post('/generate-stream', async (req: Request, res: Response) => {
  try {
    const { prompt, context, maxTokens, temperature, systemPrompt } = req.body

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        error: 'Prompt is required and must be a string'
      })
    }

    if (!grokService.isConfigured()) {
      return res.status(503).json({
        error: 'Grok API not configured'
      })
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
        systemPrompt
      })

      for await (const chunk of stream) {
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`)
      }

      res.write('data: [DONE]\n\n')
      res.end()
    } catch (streamError) {
      res.write(`data: ${JSON.stringify({ error: streamError instanceof Error ? streamError.message : 'Stream error' })}\n\n`)
      res.end()
    }
  } catch (error) {
    console.error('Stream generate error:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    })
  }
})

// 获取写作建议
router.post('/writing-suggestion', async (req: Request, res: Response) => {
  try {
    const { content, type = 'continue' } = req.body

    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        error: 'Content is required and must be a string'
      })
    }

    if (!['continue', 'improve', 'brainstorm'].includes(type)) {
      return res.status(400).json({
        error: 'Type must be one of: continue, improve, brainstorm'
      })
    }

    if (!grokService.isConfigured()) {
      return res.status(503).json({
        error: 'Grok API not configured'
      })
    }

    const suggestion = await grokService.getWritingSuggestion(content, type)

    res.json({
      success: true,
      data: {
        suggestion,
        type
      }
    })
  } catch (error) {
    console.error('Writing suggestion error:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    })
  }
})

// 生成角色设定
router.post('/generate-character', async (req: Request, res: Response) => {
  try {
    const { description } = req.body

    if (!description || typeof description !== 'string') {
      return res.status(400).json({
        error: 'Description is required and must be a string'
      })
    }

    if (!grokService.isConfigured()) {
      return res.status(503).json({
        error: 'Grok API not configured'
      })
    }

    const character = await grokService.generateCharacter(description)

    res.json({
      success: true,
      data: {
        character
      }
    })
  } catch (error) {
    console.error('Generate character error:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    })
  }
})

// 生成世界观设定
router.post('/generate-world', async (req: Request, res: Response) => {
  try {
    const { theme } = req.body

    if (!theme || typeof theme !== 'string') {
      return res.status(400).json({
        error: 'Theme is required and must be a string'
      })
    }

    if (!grokService.isConfigured()) {
      return res.status(503).json({
        error: 'Grok API not configured'
      })
    }

    const worldBuilding = await grokService.generateWorldBuilding(theme)

    res.json({
      success: true,
      data: {
        worldBuilding
      }
    })
  } catch (error) {
    console.error('Generate world error:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    })
  }
})

// 生成对话
router.post('/generate-dialogue', async (req: Request, res: Response) => {
  try {
    const { characters, context } = req.body

    if (!characters || !Array.isArray(characters) || characters.length === 0) {
      return res.status(400).json({
        error: 'Characters array is required and must not be empty'
      })
    }

    if (!context || typeof context !== 'string') {
      return res.status(400).json({
        error: 'Context is required and must be a string'
      })
    }

    if (!grokService.isConfigured()) {
      return res.status(503).json({
        error: 'Grok API not configured'
      })
    }

    const dialogue = await grokService.generateDialogue(characters, context)

    res.json({
      success: true,
      data: {
        dialogue
      }
    })
  } catch (error) {
    console.error('Generate dialogue error:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    })
  }
})

// 测试 API 连接
router.get('/test', async (req: Request, res: Response) => {
  try {
    if (!grokService.isConfigured()) {
      return res.json({
        success: false,
        configured: false,
        message: 'Grok API not configured. Please set GROK_API_KEY environment variable.'
      })
    }

    const isWorking = await grokService.testConnection()

    res.json({
      success: isWorking,
      configured: true,
      message: isWorking ? 'Grok API is working properly' : 'Grok API connection failed'
    })
  } catch (error) {
    console.error('Test connection error:', error)
    res.json({
      success: false,
      configured: true,
      message: error instanceof Error ? error.message : 'Connection test failed'
    })
  }
})

export default router