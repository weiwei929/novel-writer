import { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { prisma } from '../utils/db'

const CreateChapterSchema = z.object({
  title: z.string().min(1, "标题不能为空"),
  projectId: z.string().uuid(),
  order: z.number().int().optional(),
  content: z.string().optional(),
  summary: z.string().optional(),
  metadata: z.any().optional(),
})

const UpdateChapterSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  order: z.number().int().optional(),
  status: z.enum(['draft', 'writing', 'completed']).optional(),
  wordCount: z.number().int().optional(),
  summary: z.string().optional(),
  metadata: z.any().optional(),
})

type CreateChapterBody = { Body: z.infer<typeof CreateChapterSchema> }
type UpdateChapterBody = { Params: { id: string }, Body: z.infer<typeof UpdateChapterSchema> }
type GetByIdParams = { Params: { id: string } }
type GetByProjectParams = { Params: { projectId: string } }

function countWords(text: string): number {
  // Simple word count logic (compatible with CJK)
  const cjk = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const nonCjk = (text.match(/[a-zA-Z0-9_\u0392-\u03c9\u0400-\u04FF]+|[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3040-\u309f\uac00-\ud7af\u0400-\u04FF]+|[\u00E0-\u00FC]+/g) || []).length;
  return cjk + nonCjk; // Approximate mix
}

export async function chapterRoutes(app: FastifyInstance) {
  // GET /chapters/project/:projectId
  app.get('/project/:projectId', async (req: FastifyRequest<GetByProjectParams>, reply) => {
    const chapters = await prisma.chapter.findMany({
      where: { projectId: req.params.projectId },
      orderBy: { order: 'asc' },
    })
    return { success: true, data: chapters }
  })

  // GET /chapters/:id
  app.get('/:id', async (req: FastifyRequest<GetByIdParams>, reply) => {
    const chapter = await prisma.chapter.findUnique({
      where: { id: req.params.id }
    })
    if (!chapter) return reply.status(404).send({ success: false, error: 'Chapter not found' })
    return { success: true, data: chapter }
  })

  // POST /chapters
  app.post('/', async (req: FastifyRequest<CreateChapterBody>, reply) => {
    const result = CreateChapterSchema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({ success: false, error: result.error.format() })
    }

    // Default order: Put it at the end
    let order = result.data.order;
    if (order === undefined) {
      const lastChapter = await prisma.chapter.findFirst({
        where: { projectId: result.data.projectId },
        orderBy: { order: 'desc' }
      })
      order = (lastChapter?.order || 0) + 1
    }

    const chapter = await prisma.chapter.create({
      data: {
        title: result.data.title,
        projectId: result.data.projectId,
        content: result.data.content || '',
        order: order,
        wordCount: countWords(result.data.content || '')
      }
    })

    // Update Project WordCount
    await updateProjectStats(result.data.projectId)

    return { success: true, data: chapter }
  })

  // PUT /chapters/:id
  app.put('/:id', async (req: FastifyRequest<UpdateChapterBody>, reply) => {
    const result = UpdateChapterSchema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({ success: false, error: result.error.format() })
    }

    const { id } = req.params;
    
    // Auto-calculate word count if content changes
    let updateData: any = { ...result.data };
    if (updateData.content !== undefined) {
        updateData.wordCount = countWords(updateData.content);
    }

    try {
      const chapter = await prisma.chapter.update({
        where: { id },
        data: updateData
      })
      
      // Update Project Word Count
      await updateProjectStats(chapter.projectId)

      return { success: true, data: chapter }
    } catch (e) {
      return reply.status(404).send({ success: false, error: 'Chapter not found' })
    }
  })

  // DELETE /chapters/:id
  app.delete('/:id', async (req: FastifyRequest<GetByIdParams>, reply) => {
    try {
      const chapter = await prisma.chapter.delete({
        where: { id: req.params.id }
      })
      await updateProjectStats(chapter.projectId)
      return { success: true, message: 'Chapter deleted' }
    } catch (e) {
      return reply.status(404).send({ success: false, error: 'Chapter not found' })
    }
  })
}

async function updateProjectStats(projectId: string) {
  const aggregations = await prisma.chapter.aggregate({
    where: { projectId },
    _sum: { wordCount: true }
  })
  
  await prisma.project.update({
    where: { id: projectId },
    data: { wordCount: aggregations._sum.wordCount || 0 }
  })
}

// Export utility functions for use in other routes
export { countWords, updateProjectStats }
