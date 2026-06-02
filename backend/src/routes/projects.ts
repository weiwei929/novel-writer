import { Prisma } from '@prisma/client'
import { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { prisma } from '../utils/db'
import { countWords, updateProjectStats } from './chapters'
import { promptManager } from '../services/ai/PromptManager'
import { aiService } from '../services/ai/AIService'
import type { FastifyBaseLogger } from 'fastify'
import { ApiResponse } from '../utils/response'
import type { ProjectMetadata } from '../types/metadata'
import { mapProjectStatus, withMappedProjectStatus } from '../services/status-migration'

const PROJECT_STATUSES = ['draft', 'planning', 'writing', 'reviewing', 'completed', 'archived', 'shelved'] as const

// ===== 项目规模限制常量 =====
const LIMITS = {
  MAX_CHAPTERS: 50,           // 最多 50 章
  MIN_CHAPTER_WORDS: 100,     // 单章最少 100 字
  MAX_CHAPTER_WORDS: 8000,    // 单章最多 8000 字
  MAX_METADATA_LENGTH: 10000, // 元数据字段最长 10k 字符
}

/**
 * 验证导入的 Markdown 格式
 * 强硬限定：一级标题=作品名，二级标题=章节名
 */
function validateImportFormat(content: string): {
  valid: boolean
  error?: string
  title?: string
  chapters?: Array<{ title: string; content: string }>
} {
  const lines = content.split('\n')
  
  // 1. 检查一级标题（作品标题）
  const h1Lines = lines.filter(l => l.trim().startsWith('# ') && !l.trim().startsWith('## '))
  if (h1Lines.length === 0) {
    return { 
      valid: false, 
      error: '❌ 缺少作品标题\n\n必须有一个一级标题（# 作品名）作为作品标题' 
    }
  }
  if (h1Lines.length > 1) {
    return { 
      valid: false, 
      error: `❌ 作品标题过多（${h1Lines.length} 个）\n\n只能有一个一级标题（# 作品名）` 
    }
  }
  
  const title = h1Lines[0].replace(/^#\s+/, '').trim()
  
  // 2. 提取章节（二级标题）
  const chapters: Array<{ title: string; content: string }> = []
  let currentChapter: { title: string; content: string } | null = null
  let inH1 = false
  
  for (const line of lines) {
    const trimmed = line.trim()
    
    // 跳过一级标题行
    if (trimmed.startsWith('# ') && !trimmed.startsWith('## ')) {
      inH1 = true
      continue
    }
    
    // 检测到二级标题，开始新章节
    if (trimmed.startsWith('## ')) {
      inH1 = false
      // 保存上一章
      if (currentChapter) {
        chapters.push(currentChapter)
      }
      // 开始新章
      currentChapter = {
        title: trimmed.replace(/^##\s+/, '').trim(),
        content: ''
      }
    } 
    // 累积章节内容（排除一级标题后的内容）
    else if (currentChapter && !inH1) {
      currentChapter.content += line + '\n'
    }
  }
  
  // 保存最后一章
  if (currentChapter) {
    chapters.push(currentChapter)
  }
  
  // 3. 验证章节数量
  if (chapters.length === 0) {
    return { 
      valid: false, 
      error: '❌ 没有找到章节\n\n必须使用二级标题（## 章节名）标记章节' 
    }
  }
  
  if (chapters.length > LIMITS.MAX_CHAPTERS) {
    return { 
      valid: false, 
      error: `❌ 章节数量过多（${chapters.length} 章）\n\n建议拆分为多部作品：\n` +
             `• 《${title}·上》(1-${Math.ceil(chapters.length / 3)} 章)\n` +
             `• 《${title}·中》(${Math.ceil(chapters.length / 3) + 1}-${Math.ceil(chapters.length * 2 / 3)} 章)\n` +
             `• 《${title}·下》(${Math.ceil(chapters.length * 2 / 3) + 1}-${chapters.length} 章)\n\n` +
             `或拆分为正传和续集，每部不超过 ${LIMITS.MAX_CHAPTERS} 章`
    }
  }
  
  // 4. 验证单章字数
  for (let i = 0; i < chapters.length; i++) {
    const wordCount = countWords(chapters[i].content.trim())
    
    if (wordCount < LIMITS.MIN_CHAPTER_WORDS) {
      return { 
        valid: false, 
        error: `❌ 第 ${i + 1} 章「${chapters[i].title}」字数过少（${wordCount} 字）\n\n` +
               `建议至少 ${LIMITS.MIN_CHAPTER_WORDS} 字，或合并到其他章节`
      }
    }
    
    if (wordCount > LIMITS.MAX_CHAPTER_WORDS) {
      return { 
        valid: false, 
        error: `❌ 第 ${i + 1} 章「${chapters[i].title}」字数过多（${wordCount} 字）\n\n` +
               `建议拆分为多章，每章不超过 ${LIMITS.MAX_CHAPTER_WORDS} 字\n` +
               `这样可以：\n` +
               `• 降低 AI 处理负担\n` +
               `• 提高写作和审阅效率\n` +
               `• 更好的章节节奏控制`
      }
    }
  }
  
  return { valid: true, title, chapters }
}

/**
 * 后台提取元数据函数
 * 分析导入的章节内容，提取项目元数据
 */
async function extractMetadataInBackground(
  projectId: string,
  chapters: Array<{ title: string; content: string }>,
  logger: FastifyBaseLogger
): Promise<void> {
  try {
    // 1. 合并所有章节内容（限制长度避免 token 超限）
    const maxContentLength = 50000 // 约 50k 字符
    let combinedContent = ''
    
    for (const chapter of chapters) {
      if (combinedContent.length >= maxContentLength) break
      combinedContent += `## ${chapter.title}\n\n${chapter.content}\n\n`
    }
    
    if (combinedContent.length > maxContentLength) {
      combinedContent = combinedContent.substring(0, maxContentLength) + '\n\n[内容过长，已截断...]'
    }

    // 2. 调用 AI 提取元数据
    const systemPrompt = await promptManager.getMetadataExtractPrompt('project', combinedContent)
    
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: '请分析以上内容并提取元数据' }
    ]

    const response = await aiService.chat(messages)
    
    // 3. 解析 JSON
    let extractedMetadata: any
    try {
      const jsonMatch = response.match(/```(?:json)?\n([\s\S]*?)\n```/) || response.match(/\{[\s\S]*\}/)
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response
      extractedMetadata = JSON.parse(jsonStr)
    } catch (parseError) {
      logger.error(parseError, 'Failed to parse extracted metadata JSON')
      return
    }

    // 4. 保存到临时字段（待用户确认）
    const currentProject = await prisma.project.findUnique({ where: { id: projectId } })
    const existingMetadata = (currentProject?.metadata as ProjectMetadata) || {}
    
    await prisma.project.update({
      where: { id: projectId },
      data: {
        metadata: {
          ...existingMetadata,
          _draft: extractedMetadata,  // 临时字段，待确认
          _extractedAt: new Date().toISOString()
        }
      }
    })

    logger.info({ projectId }, 'Metadata extraction completed, saved to draft')
  } catch (error: any) {
    logger.error(error, 'Metadata extraction failed')
    throw error
  }
}

// Validation Schemas
const CreateProjectSchema = z.object({
  title: z.string().min(1, "标题不能为空"),
  description: z.string().optional(),
  author: z.string().optional(),
})

const UpdateProjectSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  author: z.string().optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  collectionId: z.string().nullable().optional(),
  coverImage: z.string().optional(),
  metadata: z.any().optional(), // Allow any JSON object/value
  tags: z.any().optional(),     // Allow any JSON array/value
})

// 修改导入 Schema：接收原始 Markdown 内容
const ImportProjectSchema = z.object({
  content: z.string().min(1, "内容不能为空"),  // 原始 Markdown 内容
  createdAt: z.string().optional(), // ISO Date string
})

const ConfirmMetadataSchema = z.object({
  confirmed: z.boolean(),
  editedMetadata: z.record(z.string(), z.any()).optional()  // 允许用户编辑后的元数据
})

const ShelveProjectSchema = z.object({
  source: z.string().optional(),
})

const TransitionTargetSchema = z.enum([
  'draft',
  'planning',
  'writing',
  'reviewing',
  'completed',
  'shelved',
])

const TransitionRequestSchema = z.object({
  to: TransitionTargetSchema,
  note: z.string().optional(),
})

const ALLOWED_TRANSITIONS: Record<string, readonly z.infer<typeof TransitionTargetSchema>[]> = {
  draft: ['planning', 'shelved'],
  planning: ['writing', 'draft', 'shelved'],
  writing: ['reviewing', 'planning', 'shelved'],
  reviewing: ['completed', 'writing', 'shelved'],
  completed: ['reviewing', 'shelved'],
  shelved: [],
}

function appendLastTransition(
  metadata: Record<string, unknown>,
  from: string,
  to: string,
  note?: string
): Record<string, unknown> {
  return {
    ...metadata,
    _lastTransition: {
      from,
      to,
      ...(note?.trim() ? { note: note.trim() } : {}),
      timestamp: new Date().toISOString(),
    },
  }
}

function appendShelvedMetadata(
  metadata: Record<string, unknown>,
  previousStatus: string,
  source: string
): Record<string, unknown> {
  return {
    ...metadata,
    _shelved: {
      previousStatus,
      shelvedAt: new Date().toISOString(),
      source,
    },
  }
}

// Chapter Planning Schemas
const ChapterPlanItemSchema = z.object({
  id: z.string(),
  order: z.number().int().min(1),
  title: z.string().min(1, "标题不可为空"),
  plannedLength: z.number().int().min(0),
  synopsisText: z.string().optional(),
  keyPlotPoints: z.array(z.string()).optional(),
  status: z.enum(['planned', 'started', 'completed']),
})

const UpdateChapterPlanningSchema = z.array(ChapterPlanItemSchema)

type GetByIdParams = { Params: { id: string } }
type CreateProjectBody = { Body: z.infer<typeof CreateProjectSchema> }
type UpdateProjectBody = { Params: { id: string }, Body: z.infer<typeof UpdateProjectSchema> }
type ImportProjectBody = { Body: z.infer<typeof ImportProjectSchema> }
type ConfirmMetadataBody = { Params: { id: string }, Body: z.infer<typeof ConfirmMetadataSchema> }

export async function projectRoutes(app: FastifyInstance) {
  // GET /projects/:id/export - Export project as Markdown
  app.get('/:id/export', async (req: FastifyRequest<GetByIdParams>, reply) => {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        chapters: {
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!project) return reply.status(404).send({ success: false, error: 'Project not found' })

    // Build Markdown
    let content = `# ${project.title}\n`
    if (project.author) content += `作者: ${project.author}\n`
    if (project.description) content += `简介: ${project.description}\n`
    content += `\n---\n\n`

    project.chapters.forEach(ch => {
      content += `## ${ch.title}\n\n`
      content += `${ch.content}\n\n`
    })

    const filename = `${project.title}.md`
    
    reply.header('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
    reply.header('Content-Type', 'text/markdown; charset=utf-8')
    return content
  })

  // POST /projects/import - Bulk import project with chapters
  app.post('/import', async (req: FastifyRequest<ImportProjectBody>, reply) => {
    const result = ImportProjectSchema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({ success: false, error: result.error.format() })
    }

    const { content, createdAt } = result.data
    
    // ===== 格式验证（强硬限定） =====
    const validation = validateImportFormat(content)
    if (!validation.valid) {
      return reply.status(400).send({ 
        success: false, 
        error: validation.error 
      })
    }
    
    const { title, chapters } = validation
    
    if (!title || !chapters) {
      return reply.status(500).send({ success: false, error: 'Validation failed unexpectedly' })
    }

    try {
      const project = await prisma.$transaction(async (tx) => {
        const newProject = await tx.project.create({
          data: {
            title,
            description: `导入于 ${new Date().toLocaleString('zh-CN')}`,
            status: 'draft',
            author: 'Unknown',
            createdAt: createdAt ? new Date(createdAt) : undefined,
          }
        })

        if (chapters.length > 0) {
          await tx.chapter.createMany({
            data: chapters.map((ch, index) => ({
              projectId: newProject.id,
              title: ch.title || `第 ${index + 1} 章`,
              content: ch.content,
              order: index + 1,
              status: 'draft',
              wordCount: countWords(ch.content)
            }))
          })
        }

        return newProject
      })

      await updateProjectStats(project.id)

      return ApiResponse.success(
        { project: withMappedProjectStatus(project) },
        '作品已导入，状态为草稿'
      )
    } catch (e: any) {
      req.log.error(e)
      return reply.status(500).send({ success: false, error: 'Import failed: ' + e.message })
    }
  })

  // POST /projects/:id/confirm-metadata - 确认或拒绝 AI 提取的元数据
  app.post('/:id/confirm-metadata', async (req: FastifyRequest<ConfirmMetadataBody>, reply) => {
    const { id } = req.params
    req.log.info({ id, body: req.body }, 'Confirm metadata request received')
    
    const result = ConfirmMetadataSchema.safeParse(req.body)
    
    if (!result.success) {
      return reply.status(400).send({ success: false, error: result.error.format() })
    }
    
    const { confirmed, editedMetadata } = result.data
    
    try {
      const project = await prisma.project.findUnique({ where: { id } })
      if (!project) {
        return reply.status(404).send({ success: false, error: 'Project not found' })
      }
      
      const metadata = (project.metadata as ProjectMetadata) || {}
      const draft = metadata._draft
      
      if (!draft) {
        req.log.warn({ projectId: id }, 'No draft metadata found for confirmation')
        return reply.status(400).send({ 
          success: false, 
          error: '没有待确认的元数据。可能已经确认过，或元数据提取尚未完成。' 
        })
      }
      
      if (confirmed) {
        // 确认：使用编辑后的元数据（如果有）或原始 draft
        const finalMetadata = editedMetadata || draft
        const { _draft, _extractedAt, ...rest } = metadata
        
        // 将 AI 生成的元数据转换为字符串格式（如果是对象）
        const processedMetadata: any = {}
        for (const [key, value] of Object.entries(finalMetadata)) {
          if (typeof value === 'object' && value !== null) {
            // 如果是对象，转换为 JSON 字符串
            processedMetadata[key] = JSON.stringify(value, null, 2)
          } else {
            processedMetadata[key] = value
          }
        }
        
        await prisma.project.update({
          where: { id },
          data: {
            metadata: { ...rest, ...processedMetadata },
            author: processedMetadata.author || project.author,
            description: typeof processedMetadata.synopsis === 'string' 
              ? processedMetadata.synopsis 
              : (processedMetadata.description || project.description)
          }
        })
        req.log.info({ projectId: id }, 'Metadata confirmed and saved')
        return reply.send(ApiResponse.success(null, '元数据已确认并保存'))
      } else {
        // 拒绝：删除 draft
        const { _draft, _extractedAt, ...rest } = metadata
        await prisma.project.update({
          where: { id },
          data: { metadata: rest }
        })
        req.log.info({ projectId: id }, 'Metadata draft rejected and removed')
        return reply.send(ApiResponse.success(null, '已拒绝提取的元数据'))
      }
    } catch (e: any) {
      req.log.error(e, 'Error confirming metadata')
      return reply.status(500).send(ApiResponse.error(e.message, 500))
    }
  })

  // POST /projects/:id/move-to-draft — 已废弃（导入作品直接进入 draft）
  app.post('/:id/move-to-draft', async (_req: FastifyRequest<GetByIdParams>, reply) => {
    return reply.status(410).send(
      ApiResponse.error('该接口已废弃，导入作品直接进入草稿状态', 410)
    )
  })

  // POST /projects/:id/extract-metadata
  // 用户手动触发元数据提取
  app.post('/:id/extract-metadata', async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const { id } = req.params
    
    try {
      const project = await prisma.project.findUnique({ where: { id } })
      if (!project) {
        return reply.status(404).send(ApiResponse.error('Project not found', 404))
      }
      
      // 获取章节内容
      const chapters = await prisma.chapter.findMany({
        where: { projectId: id },
        orderBy: { order: 'asc' },
        select: { title: true, content: true }
      })
      
      if (chapters.length === 0) {
        return reply.status(400).send(
          ApiResponse.error('项目没有章节内容，无法提取元数据', 400)
        )
      }
      
      // 在后台异步提取元数据
      extractMetadataInBackground(id, chapters, req.log).catch(err => {
        req.log.error(err, 'Manual metadata extraction failed')
      })
      
      return ApiResponse.success(
        { hasPendingMetadata: true },
        'AI 正在分析元数据，请稍候...'
      )
    } catch (e: any) {
      req.log.error(e)
      return reply.status(500).send(ApiResponse.error(e.message, 500))
    }
  })


  // GET /projects
  app.get('/', async (req, reply) => {
    const statusFilter =
      typeof (req.query as { status?: string }).status === 'string'
        ? (req.query as { status: string }).status
        : undefined

    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { chapters: true, characters: true, scraps: true }
        }
      }
    })

    let data = projects.map(p => {
      const mapped = withMappedProjectStatus(p)
      const count = (p as { _count?: { chapters?: number } })._count
      return {
        ...mapped,
        chapterCount: count?.chapters ?? 0,
      }
    })
    if (statusFilter) {
      const statuses = statusFilter
        .split(',')
        .map(s => mapProjectStatus(s.trim()))
        .filter(Boolean)
      if (statuses.length === 1) {
        data = data.filter(p => p.status === statuses[0])
      } else if (statuses.length > 1) {
        data = data.filter(p => statuses.includes(p.status))
      }
    }

    return { success: true, data }
  })

  // POST /projects/:id/shelve — 移入作品暂存
  app.post('/:id/shelve', async (req: FastifyRequest<GetByIdParams>, reply) => {
    const { id } = req.params
    const parsed = ShelveProjectSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: parsed.error.format() })
    }

    try {
      const project = await prisma.project.findUnique({ where: { id } })
      if (!project) {
        return reply.status(404).send(ApiResponse.error('Project not found', 404))
      }

      const currentStatus = mapProjectStatus(project.status)
      if (currentStatus === 'shelved') {
        return reply.status(400).send(ApiResponse.error('作品已在暂存中', 400))
      }

      const metadata = (project.metadata as Record<string, unknown>) || {}
      const updated = await prisma.project.update({
        where: { id },
        data: {
          status: 'shelved',
          metadata: {
            ...metadata,
            _shelved: {
              previousStatus: currentStatus,
              shelvedAt: new Date().toISOString(),
              source: parsed.data.source,
            },
          } as Prisma.InputJsonValue,
        },
      })

      return ApiResponse.success(withMappedProjectStatus(updated), '已移入作品暂存')
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Shelve failed'
      req.log.error(e)
      return reply.status(500).send(ApiResponse.error(message, 500))
    }
  })

  // POST /projects/:id/transition — 相邻阶段流转（推进/回退/暂存）
  app.post('/:id/transition', async (req: FastifyRequest<GetByIdParams>, reply) => {
    const { id } = req.params
    const parsed = TransitionRequestSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: parsed.error.format() })
    }

    try {
      const project = await prisma.project.findUnique({ where: { id } })
      if (!project) {
        return reply.status(404).send(ApiResponse.error('Project not found', 404))
      }

      const from = mapProjectStatus(project.status)
      const { to, note } = parsed.data

      if (from === 'shelved') {
        return reply.status(422).send(ApiResponse.error('暂存中的作品请使用还原接口', 422))
      }

      const allowed = ALLOWED_TRANSITIONS[from] ?? []
      if (!allowed.includes(to)) {
        return reply.status(422).send(
          ApiResponse.error(`不允许从「${from}」流转到「${to}」`, 422)
        )
      }

      const baseMetadata = (project.metadata as Record<string, unknown>) || {}
      let metadata = appendLastTransition(baseMetadata, from, to, note)

      if (to === 'shelved') {
        metadata = appendShelvedMetadata(metadata, from, 'stage_transition')
      }

      const updated = await prisma.project.update({
        where: { id },
        data: {
          status: to,
          metadata: metadata as Prisma.InputJsonValue,
        },
      })

      return ApiResponse.success(withMappedProjectStatus(updated), '状态已更新')
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Transition failed'
      req.log.error(e)
      return reply.status(500).send(ApiResponse.error(message, 500))
    }
  })

  // POST /projects/:id/restore — 从作品暂存还原
  app.post('/:id/restore', async (req: FastifyRequest<GetByIdParams>, reply) => {
    const { id } = req.params

    try {
      const project = await prisma.project.findUnique({ where: { id } })
      if (!project) {
        return reply.status(404).send(ApiResponse.error('Project not found', 404))
      }

      const metadata = (project.metadata as Record<string, unknown>) || {}
      const shelvedMeta = metadata._shelved as
        | { previousStatus?: string; shelvedAt?: string; source?: string }
        | undefined
      const previousStatus = shelvedMeta?.previousStatus
        ? mapProjectStatus(shelvedMeta.previousStatus)
        : 'draft'

      const { _shelved: _removed, ...rest } = metadata

      const updated = await prisma.project.update({
        where: { id },
        data: {
          status: previousStatus,
          metadata: rest as Prisma.InputJsonValue,
        },
      })

      return ApiResponse.success(withMappedProjectStatus(updated), '作品已还原')
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Restore failed'
      req.log.error(e)
      return reply.status(500).send(ApiResponse.error(message, 500))
    }
  })

  // GET /projects/:id
  app.get('/:id', async (req: FastifyRequest<GetByIdParams>, reply) => {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        _count: { select: { chapters: true } }
      }
    })
    if (!project) return reply.status(404).send(ApiResponse.error('Project not found', 404))
    return ApiResponse.success(withMappedProjectStatus(project))
  })

  // POST /projects
  app.post('/', async (req: FastifyRequest<CreateProjectBody>, reply) => {
    const result = CreateProjectSchema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({ success: false, error: result.error.format() })
    }
    
    const project = await prisma.project.create({
      data: {
        title: result.data.title,
        description: result.data.description,
        author: result.data.author,
      }
    })
    return { success: true, data: project }
  })

  // PUT /projects/:id
  app.put('/:id', async (req: FastifyRequest<UpdateProjectBody>, reply) => {
    const result = UpdateProjectSchema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({ success: false, error: result.error.format() })
    }

    const updateData = { ...result.data }
    if (updateData.status) {
      updateData.status = mapProjectStatus(updateData.status) as typeof updateData.status
    }

    try {
      const project = await prisma.project.update({
        where: { id: req.params.id },
        data: updateData
      })
      return { success: true, data: withMappedProjectStatus(project) }
    } catch (e) {
      return reply.status(404).send({ success: false, error: 'Project not found' })
    }
  })

  // DELETE /projects/:id
  app.delete('/:id', async (req: FastifyRequest<GetByIdParams>, reply) => {
    try {
      await prisma.project.delete({
        where: { id: req.params.id }
      })
      return { success: true, message: 'Project deleted' }
    } catch (e) {
      return reply.status(404).send({ success: false, error: 'Project not found' })
    }
  })

  // GET /projects/:id/chapter-planning - 获取章节规划
  app.get('/:id/chapter-planning', async (req: FastifyRequest<GetByIdParams>, reply) => {
    try {
      const project = await prisma.project.findUnique({
        where: { id: req.params.id },
        select: { id: true, metadata: true }
      })

      if (!project) {
        return reply.status(404).send(ApiResponse.error('Project not found', 404))
      }

      const metadata = (project.metadata as Record<string, any>) || {}
      const plans = metadata.chapterPlanning || []

      return ApiResponse.success(plans)
    } catch (e: any) {
      req.log.error(e)
      return reply.status(500).send(ApiResponse.error(e.message, 500))
    }
  })

  // PUT /projects/:id/chapter-planning - 保存章节规划
  app.put('/:id/chapter-planning', async (req: FastifyRequest<GetByIdParams>, reply) => {
    const result = UpdateChapterPlanningSchema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 400, message: 'Invalid chapter planning data', details: result.error.format() }
      })
    }

    try {
      const project = await prisma.project.findUnique({
        where: { id: req.params.id },
        select: { id: true, metadata: true }
      })

      if (!project) {
        return reply.status(404).send(ApiResponse.error('Project not found', 404))
      }

      const metadata = (project.metadata as Record<string, any>) || {}
      const updatedMetadata = { ...metadata, chapterPlanning: result.data }

      await prisma.project.update({
        where: { id: req.params.id },
        data: { metadata: updatedMetadata }
      })

      return ApiResponse.success(result.data, '章节规划已保存')
    } catch (e: any) {
      req.log.error(e)
      return reply.status(500).send(ApiResponse.error(e.message, 500))
    }
  })
}
