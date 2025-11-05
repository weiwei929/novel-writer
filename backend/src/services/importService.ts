/**
 * 数据导入服务
 * 支持从多种格式导入数据到系统中
 */

import fs from 'fs'
import path from 'path'
import { db } from './database.js'
import mammoth from 'mammoth'
import { Collection, Project, Chapter } from '../types/database.js'

// 导入数据的接口定义
export interface CreateCollectionData {
  name: string
  description?: string
  tags?: string[]
}

export interface CreateProjectData {
  title: string
  description?: string
  author: string
  genre?: string[]
  tags?: string[]
  status?: string
  collectionId?: string
  settings?: any
}

export interface CreateChapterData {
  title: string
  content?: string
  projectId: string
  order?: number
}

export interface ImportOptions {
  mergeStrategy?: 'replace' | 'merge' | 'skip'
  createNewCollection?: boolean
  targetCollectionId?: string
  preserveIds?: boolean
  validateContent?: boolean
}

export interface ImportResult {
  success: boolean
  data?: {
    collections?: number
    projects?: number
    chapters?: number
  }
  errors?: string[]
  warnings?: string[]
}

export interface ParsedContent {
  title: string
  content: string
  chapters?: {
    title: string
    content: string
    order?: number
  }[]
  author?: string
  description?: string
  metadata?: Record<string, any>
}

class ImportService {
  private uploadDir: string

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'data', 'uploads')
    this.ensureUploadDirectory()
  }

  /**
   * 确保上传目录存在
   */
  private ensureUploadDirectory() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true })
    }
  }

  /**
   * 从文件导入数据
   */
  async importFromFile(filePath: string, options: ImportOptions = {}): Promise<ImportResult> {
    try {
      const fileExt = path.extname(filePath).toLowerCase()
      const fileName = path.basename(filePath, fileExt)

      let parsedContent: ParsedContent

      switch (fileExt) {
        case '.json':
          parsedContent = await this.parseJSON(filePath)
          break
        case '.txt':
          parsedContent = await this.parseTXT(filePath)
          break
        case '.md':
          parsedContent = await this.parseMarkdown(filePath)
          break
        case '.docx':
          parsedContent = await this.parseWord(filePath)
          break
        default:
          throw new Error(`不支持的文件格式: ${fileExt}`)
      }

      // 验证内容
      if (options.validateContent) {
        this.validateContent(parsedContent)
      }

      // 导入到数据库
      return await this.importToDatabase(parsedContent, options)

    } catch (error) {
      console.error('文件导入失败:', error)
      return {
        success: false,
        errors: [error instanceof Error ? error.message : '导入失败']
      }
    }
  }

  /**
   * 批量导入多个文件
   */
  async importMultipleFiles(filePaths: string[], options: ImportOptions = {}): Promise<ImportResult> {
    const results: ImportResult[] = []
    const errors: string[] = []
    const warnings: string[] = []

    for (const filePath of filePaths) {
      try {
        const result = await this.importFromFile(filePath, options)
        results.push(result)
        
        if (result.errors) {
          errors.push(...result.errors)
        }
        if (result.warnings) {
          warnings.push(...result.warnings)
        }
      } catch (error) {
        errors.push(`文件 ${path.basename(filePath)} 导入失败: ${error instanceof Error ? error.message : '未知错误'}`)
      }
    }

    // 汇总结果
    const totalData = results.reduce((acc, result) => {
      if (result.data) {
        acc.collections += result.data.collections || 0
        acc.projects += result.data.projects || 0
        acc.chapters += result.data.chapters || 0
      }
      return acc
    }, { collections: 0, projects: 0, chapters: 0 })

    return {
      success: errors.length === 0,
      data: totalData,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    }
  }

  /**
   * 解析JSON文件
   */
  private async parseJSON(filePath: string): Promise<ParsedContent> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const data = JSON.parse(content)

      // 检查是否是导出的完整数据格式
      if (data.project && data.chapters) {
        return {
          title: data.project.title,
          content: data.project.description || '',
          author: data.project.author,
          description: data.project.description,
          chapters: data.chapters.map((chapter: any, index: number) => ({
            title: chapter.title,
            content: chapter.content,
            order: chapter.order || index
          })),
          metadata: data.metadata
        }
      }

      // 检查是否是文集格式
      if (data.collection && data.projects) {
        // 对于文集，返回第一个项目作为主要内容
        const firstProject = data.projects[0]
        if (firstProject) {
          return {
            title: firstProject.project.title,
            content: firstProject.project.description || '',
            author: firstProject.project.author,
            description: firstProject.project.description,
            chapters: firstProject.chapters.map((chapter: any, index: number) => ({
              title: chapter.title,
              content: chapter.content,
              order: chapter.order || index
            }))
          }
        }
      }

      // 通用JSON格式
      return {
        title: data.title || data.name || '未命名项目',
        content: data.content || data.description || '',
        author: data.author,
        description: data.description,
        chapters: data.chapters || [],
        metadata: data
      }
    } catch (error) {
      throw new Error(`JSON解析失败: ${error instanceof Error ? error.message : '格式错误'}`)
    }
  }

  /**
   * 解析TXT文件
   */
  private async parseTXT(filePath: string): Promise<ParsedContent> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const fileName = path.basename(filePath, '.txt')
      
      // 尝试按标题分章节
      const chapters = this.splitIntoChapters(content)
      
      if (chapters.length > 1) {
        return {
          title: fileName,
          content: `从 ${fileName} 导入的小说`,
          chapters: chapters.map((chapter, index) => ({
            title: chapter.title || `第${index + 1}章`,
            content: chapter.content,
            order: index
          }))
        }
      } else {
        return {
          title: fileName,
          content: content,
          chapters: [{
            title: '正文',
            content: content,
            order: 0
          }]
        }
      }
    } catch (error) {
      throw new Error(`TXT解析失败: ${error instanceof Error ? error.message : '读取错误'}`)
    }
  }

  /**
   * 解析Markdown文件
   */
  private async parseMarkdown(filePath: string): Promise<ParsedContent> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const fileName = path.basename(filePath, '.md')
      
      // 解析Markdown标题和内容
      const lines = content.split('\n')
      let title = fileName
      let description = ''
      let author = ''
      const chapters: { title: string; content: string; order: number }[] = []
      
      let currentChapter = { title: '', content: '', order: 0 }
      let inFrontmatter = false
      let chapterIndex = 0

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()

        // 处理YAML前言
        if (line === '---') {
          inFrontmatter = !inFrontmatter
          continue
        }

        if (inFrontmatter) {
          if (line.startsWith('title:')) {
            title = line.replace('title:', '').trim().replace(/['"]/g, '')
          } else if (line.startsWith('author:')) {
            author = line.replace('author:', '').trim().replace(/['"]/g, '')
          } else if (line.startsWith('description:')) {
            description = line.replace('description:', '').trim().replace(/['"]/g, '')
          }
          continue
        }

        // 处理一级标题（作为书名）
        if (line.startsWith('# ')) {
          title = line.replace('# ', '').trim()
          continue
        }

        // 处理二级标题（作为章节标题）
        if (line.startsWith('## ')) {
          // 保存之前的章节
          if (currentChapter.title && currentChapter.content.trim()) {
            chapters.push({ ...currentChapter })
            chapterIndex++
          }
          
          // 开始新章节
          currentChapter = {
            title: line.replace('## ', '').trim(),
            content: '',
            order: chapterIndex
          }
          continue
        }

        // 处理内容
        if (currentChapter.title) {
          currentChapter.content += line + '\n'
        } else if (!description && line && !line.startsWith('#')) {
          description += line + '\n'
        }
      }

      // 保存最后一个章节
      if (currentChapter.title && currentChapter.content.trim()) {
        chapters.push(currentChapter)
      }

      // 如果没有章节，将整个内容作为一个章节
      if (chapters.length === 0) {
        chapters.push({
          title: '正文',
          content: content,
          order: 0
        })
      }

      return {
        title: title || fileName,
        content: description,
        author,
        description,
        chapters
      }
    } catch (error) {
      throw new Error(`Markdown解析失败: ${error instanceof Error ? error.message : '读取错误'}`)
    }
  }

  /**
   * 解析Word文档
   */
  private async parseWord(filePath: string): Promise<ParsedContent> {
    try {
      const result = await mammoth.extractRawText({ path: filePath })
      const content = result.value
      const fileName = path.basename(filePath, '.docx')

      // 尝试按段落分章节
      const chapters = this.splitIntoChapters(content)

      if (chapters.length > 1) {
        return {
          title: fileName,
          content: `从 ${fileName} 导入的Word文档`,
          chapters: chapters.map((chapter, index) => ({
            title: chapter.title || `第${index + 1}章`,
            content: chapter.content,
            order: index
          }))
        }
      } else {
        return {
          title: fileName,
          content: content,
          chapters: [{
            title: '正文',
            content: content,
            order: 0
          }]
        }
      }
    } catch (error) {
      throw new Error(`Word文档解析失败: ${error instanceof Error ? error.message : '格式错误'}`)
    }
  }

  /**
   * 将文本分割为章节
   */
  private splitIntoChapters(content: string): { title: string; content: string }[] {
    const chapters: { title: string; content: string }[] = []
    
    // 常见的章节分割模式
    const chapterPatterns = [
      /^第[0-9一二三四五六七八九十百千万零壹贰叁肆伍陆柒捌玖拾佰仟萬]+[章节回]/gm,
      /^[0-9]+\.\s*.+$/gm,
      /^Chapter\s+[0-9]+/gim,
      /^[第].*[章]/gm
    ]

    let bestSplit: { title: string; content: string }[] = []
    let maxChapters = 0

    for (const pattern of chapterPatterns) {
      const matches = content.match(pattern)
      if (matches && matches.length > 1) {
        const splits = content.split(pattern)
        const tempChapters: { title: string; content: string }[] = []

        for (let i = 1; i < splits.length; i++) {
          const title = matches[i - 1] || `第${i}章`
          const chapterContent = splits[i].trim()
          
          if (chapterContent.length > 50) { // 章节内容至少50字符
            tempChapters.push({
              title: title.trim(),
              content: chapterContent
            })
          }
        }

        if (tempChapters.length > maxChapters) {
          maxChapters = tempChapters.length
          bestSplit = tempChapters
        }
      }
    }

    return bestSplit.length > 0 ? bestSplit : [{ title: '正文', content: content }]
  }

  /**
   * 验证内容
   */
  private validateContent(content: ParsedContent): void {
    if (!content.title || content.title.trim().length === 0) {
      throw new Error('缺少有效的标题')
    }

    if (!content.chapters || content.chapters.length === 0) {
      throw new Error('没有找到章节内容')
    }

    for (const chapter of content.chapters) {
      if (!chapter.title || chapter.title.trim().length === 0) {
        throw new Error('发现无标题的章节')
      }
      
      if (!chapter.content || chapter.content.trim().length < 10) {
        throw new Error(`章节"${chapter.title}"内容过少`)
      }
    }
  }

  /**
   * 导入到数据库
   */
  private async importToDatabase(content: ParsedContent, options: ImportOptions): Promise<ImportResult> {
    try {
      let collectionId = options.targetCollectionId
      let projectsCount = 0
      let chaptersCount = 0
      let collectionsCount = 0

      // 创建或使用现有文集
      if (options.createNewCollection && !collectionId) {
        const collectionData: CreateCollectionData = {
          name: `${content.title}的文集`,
          description: content.description || `包含《${content.title}》的文集`,
          tags: ['导入']
        }

        const collection = await db.createCollection(collectionData)
        collectionId = collection.id
        collectionsCount = 1
      }

      // 检查项目是否已存在
      if (options.mergeStrategy !== 'replace') {
        const existingProjects = collectionId ? 
          await db.getProjects(collectionId) : 
          await db.getProjects()
        
        const existingProject = existingProjects.find(p => 
          p.title.toLowerCase() === content.title.toLowerCase()
        )

        if (existingProject) {
          if (options.mergeStrategy === 'skip') {
            return {
              success: true,
              data: { collections: 0, projects: 0, chapters: 0 },
              warnings: [`项目"${content.title}"已存在，跳过导入`]
            }
          }
          // merge策略将在创建章节时处理
        }
      }

      // 创建项目
      const projectData: CreateProjectData = {
        title: content.title,
        description: content.description || '',
        author: content.author || '未知作者',
        collectionId: collectionId || undefined,
        status: 'draft',
        tags: ['导入'],
        settings: {
          autoSave: true,
          autoSaveInterval: 5,
          backupEnabled: true
        }
      }

      const project = await db.createProject(projectData)
      projectsCount = 1

      // 创建章节
      if (content.chapters) {
        for (const chapterData of content.chapters) {
        const chapterCreateData: CreateChapterData = {
          title: chapterData.title,
          content: chapterData.content,
          projectId: project.id,
          order: chapterData.order || 0
        }

        await db.createChapter(chapterCreateData)
        chaptersCount++
        }
      }

      return {
        success: true,
        data: {
          collections: collectionsCount,
          projects: projectsCount,
          chapters: chaptersCount
        }
      }

    } catch (error) {
      console.error('数据库导入失败:', error)
      throw new Error(`数据库导入失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 从备份恢复数据
   */
  async restoreFromBackup(backupPath: string): Promise<ImportResult> {
    try {
      // 检查备份文件是否存在
      if (!fs.existsSync(backupPath)) {
        throw new Error('备份文件不存在')
      }

      const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'))
      
      let collectionsCount = 0
      let projectsCount = 0
      let chaptersCount = 0

      // 恢复文集
      if (backupData.collections) {
        for (const collection of backupData.collections) {
          try {
            await db.createCollection({
              name: collection.name,
              description: collection.description,
              tags: collection.tags
            })
            collectionsCount++
          } catch (error) {
            console.warn(`跳过重复文集: ${collection.name}`)
          }
        }
      }

      // 恢复项目
      if (backupData.projects) {
        for (const project of backupData.projects) {
          try {
            const projectData: CreateProjectData = {
              title: project.title,
              description: project.description,
              author: project.author,
              collectionId: project.collectionId,
              status: project.status,
              tags: project.tags,
              settings: project.settings
            }
            await db.createProject(projectData)
            projectsCount++
          } catch (error) {
            console.warn(`跳过重复项目: ${project.title}`)
          }
        }
      }

      // 恢复章节
      if (backupData.chapters) {
        for (const chapter of backupData.chapters) {
          try {
            await db.createChapter({
              title: chapter.title,
              content: chapter.content,
              projectId: chapter.projectId,
              order: chapter.order
            })
            chaptersCount++
          } catch (error) {
            console.warn(`跳过重复章节: ${chapter.title}`)
          }
        }
      }

      return {
        success: true,
        data: {
          collections: collectionsCount,
          projects: projectsCount,
          chapters: chaptersCount
        }
      }

    } catch (error) {
      console.error('备份恢复失败:', error)
      return {
        success: false,
        errors: [error instanceof Error ? error.message : '恢复失败']
      }
    }
  }

  /**
   * 清理上传文件
   */
  async cleanupUploads(maxAge = 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const files = fs.readdirSync(this.uploadDir)
      const now = Date.now()

      for (const file of files) {
        const filePath = path.join(this.uploadDir, file)
        const stats = fs.statSync(filePath)
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath)
          console.log(`已清理过期上传文件: ${file}`)
        }
      }
    } catch (error) {
      console.error('清理上传文件失败:', error)
    }
  }
}

export const importService = new ImportService()
export { ImportService }