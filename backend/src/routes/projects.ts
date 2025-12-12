import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../utils/db'

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
  status: z.enum(['draft', 'writing', 'completed', 'archived']).optional(),
  coverImage: z.string().optional(),
  metadata: z.string().optional(),
})

const ImportProjectSchema = z.object({
  title: z.string().min(1, "标题不能为空"),
  chapters: z.array(z.object({
    title: z.string(),
    content: z.string(),
    order: z.number().optional()
  })),
  createdAt: z.string().optional(), // ISO Date string
})

export async function projectRoutes(app: FastifyInstance) {
  // GET /projects/:id/export - Export project as Markdown
  app.get('/:id/export', async (req: any, reply) => {
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
  app.post('/import', async (req: any, reply) => {
    const result = ImportProjectSchema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({ success: false, error: result.error.format() })
    }

    const { title, chapters, createdAt } = result.data

    try {
      const project = await prisma.$transaction(async (tx) => {
        // 1. Find or Create "Imported" Collection
        let collection = await tx.collection.findFirst({
          where: { name: '导入文集' }
        })

        if (!collection) {
          collection = await tx.collection.create({
            data: {
              name: '导入文集',
              description: '自动存放导入的外部作品'
            }
          })
        }

        // 2. Create Project
        const newProject = await tx.project.create({
          data: {
            title,
            description: `导入于 ${new Date().toLocaleString('zh-CN')}`,
            status: 'draft',
            author: 'Unknown', // Default author
            collectionId: collection.id,
            createdAt: createdAt ? new Date(createdAt) : undefined,
          }
        })

        // 3. Create Chapters
        if (chapters.length > 0) {
          await tx.chapter.createMany({
            data: chapters.map((ch, index) => ({
              projectId: newProject.id,
              title: ch.title || `第 ${index + 1} 章`,
              content: ch.content,
              order: ch.order ?? (index + 1),
              status: 'draft',
              wordCount: ch.content.length
            }))
          })
        }

        return newProject
      })

      return { success: true, data: project, message: '导入成功' }
    } catch (e: any) {
      req.log.error(e)
      return reply.status(500).send({ success: false, error: 'Import failed: ' + e.message })
    }
  })

  // GET /projects
  app.get('/', async (req, reply) => {
    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { chapters: true, characters: true, scraps: true }
        }
      }
    })
    return { success: true, data: projects }
  })

  // GET /projects/:id
  app.get('/:id', async (req: any, reply) => {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        _count: { select: { chapters: true } }
      }
    })
    if (!project) return reply.status(404).send({ success: false, error: 'Project not found' })
    return { success: true, data: project }
  })

  // POST /projects
  app.post('/', async (req: any, reply) => {
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
  app.put('/:id', async (req: any, reply) => {
    const result = UpdateProjectSchema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({ success: false, error: result.error.format() })
    }

    try {
      const project = await prisma.project.update({
        where: { id: req.params.id },
        data: result.data
      })
      return { success: true, data: project }
    } catch (e) {
      return reply.status(404).send({ success: false, error: 'Project not found' })
    }
  })

  // DELETE /projects/:id
  app.delete('/:id', async (req: any, reply) => {
    try {
      await prisma.project.delete({
        where: { id: req.params.id }
      })
      return { success: true, message: 'Project deleted' }
    } catch (e) {
      return reply.status(404).send({ success: false, error: 'Project not found' })
    }
  })
}
