/**
 * 数据导出服务
 * 支持多种格式的项目数据导出
 */

import fs from 'fs'
import path from 'path'
import archiver from 'archiver'
import { Document, Paragraph, TextRun, HeadingLevel, Packer } from 'docx'
import puppeteer from 'puppeteer'
import { db } from './database.js'
import { Project, Chapter, Collection } from '../types/database.js'

export interface ExportOptions {
  format: 'word' | 'pdf' | 'txt' | 'markdown' | 'json' | 'zip'
  includeMetadata?: boolean
  splitByChapter?: boolean
  includeCollectionInfo?: boolean
}

export interface ExportResult {
  success: boolean
  filePath?: string
  fileName?: string
  size?: number
  error?: string
}

class ExportService {
  private exportDir: string

  constructor() {
    this.exportDir = path.join(process.cwd(), 'data', 'exports')
    this.ensureExportDirectory()
  }

  /**
   * 确保导出目录存在
   */
  private ensureExportDirectory() {
    if (!fs.existsSync(this.exportDir)) {
      fs.mkdirSync(this.exportDir, { recursive: true })
    }
  }

  /**
   * 导出单个项目
   */
  async exportProject(projectId: string, options: ExportOptions): Promise<ExportResult> {
    try {
      const project = await db.getProjectById(projectId)
      if (!project) {
        throw new Error('项目不存在')
      }

      const chapters = await db.getChapters(projectId)
      const collection = project.collectionId ? await db.getCollectionById(project.collectionId) : null

      const data = {
        project,
        chapters: chapters.sort((a, b) => (a.order || 0) - (b.order || 0)),
        collection: options.includeCollectionInfo ? collection : null,
        exportTime: new Date().toISOString(),
        metadata: options.includeMetadata ? {
          totalChapters: chapters.length,
          totalWords: this.calculateWordCount(chapters),
          createdAt: project.createdAt,
          updatedAt: project.updatedAt
        } : null
      }

      switch (options.format) {
        case 'word':
          return await this.exportToWord(data, project.title)
        case 'pdf':
          return await this.exportToPDF(data, project.title)
        case 'txt':
          return await this.exportToTXT(data, project.title)
        case 'markdown':
          return await this.exportToMarkdown(data, project.title)
        case 'json':
          return await this.exportToJSON(data, project.title)
        case 'zip':
          return await this.exportToZip(data, project.title)
        default:
          throw new Error('不支持的导出格式')
      }
    } catch (error) {
      console.error('导出项目失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '导出失败'
      }
    }
  }

  /**
   * 导出文集
   */
  async exportCollection(collectionId: string, options: ExportOptions): Promise<ExportResult> {
    try {
      const collection = await db.getCollectionById(collectionId)
      if (!collection) {
        throw new Error('文集不存在')
      }

      const projects = await db.getProjects(collectionId)
      const allData: Array<{
        project: any
        chapters: any[]
      }> = []

      for (const project of projects) {
        const chapters = await db.getChapters(project.id)
        allData.push({
          project,
          chapters: chapters.sort((a, b) => (a.order || 0) - (b.order || 0))
        })
      }

      const data = {
        collection,
        projects: allData,
        exportTime: new Date().toISOString(),
        metadata: options.includeMetadata ? {
          totalProjects: projects.length,
          totalChapters: allData.reduce((sum, p) => sum + p.chapters.length, 0),
          totalWords: allData.reduce((sum, p) => sum + this.calculateWordCount(p.chapters), 0)
        } : null
      }

      // 文集导出默认使用ZIP格式
      return await this.exportCollectionToZip(data, collection.name)
    } catch (error) {
      console.error('导出文集失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '导出失败'
      }
    }
  }

  /**
   * 导出为Word文档
   */
  private async exportToWord(data: any, fileName: string): Promise<ExportResult> {
    try {
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // 标题
            new Paragraph({
              text: data.project.title,
              heading: HeadingLevel.TITLE,
              alignment: 'center'
            }),

            // 项目信息
            ...(data.metadata ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `作者：${data.project.author || '未知'}\n`,
                    break: 1
                  }),
                  new TextRun({
                    text: `字数：${data.metadata.totalWords} 字\n`,
                    break: 1
                  }),
                  new TextRun({
                    text: `章节数：${data.metadata.totalChapters} 章\n`,
                    break: 1
                  }),
                  new TextRun({
                    text: `创建时间：${new Date(data.project.createdAt).toLocaleDateString()}\n`,
                    break: 2
                  })
                ]
              })
            ] : []),

            // 项目描述
            ...(data.project.description ? [
              new Paragraph({
                text: "内容简介",
                heading: HeadingLevel.HEADING_1
              }),
              new Paragraph({
                text: data.project.description
              }),
              new Paragraph({ text: "" })
            ] : []),

            // 章节内容
            ...data.chapters.flatMap((chapter: Chapter) => [
              new Paragraph({
                text: chapter.title,
                heading: HeadingLevel.HEADING_1,
                pageBreakBefore: true
              }),
              new Paragraph({ text: "" }),
              ...chapter.content.split('\n').map((line: string) => 
                new Paragraph({ text: line || " " })
              ),
              new Paragraph({ text: "" })
            ])
          ]
        }]
      })

      const buffer = await Packer.toBuffer(doc)
      const filePath = path.join(this.exportDir, `${fileName}.docx`)
      fs.writeFileSync(filePath, buffer)

      return {
        success: true,
        filePath,
        fileName: `${fileName}.docx`,
        size: buffer.length
      }
    } catch (error) {
      throw new Error(`Word导出失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 导出为PDF
   */
  private async exportToPDF(data: any, fileName: string): Promise<ExportResult> {
    let browser: any = null
    try {
      // 先生成HTML内容
      const htmlContent = this.generateHTML(data)
      
      // 使用Puppeteer生成PDF
      browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })
      const page = await browser.newPage()
      
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' })
      
      const pdfPath = path.join(this.exportDir, `${fileName}.pdf`)
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        margin: {
          top: '1in',
          right: '1in',
          bottom: '1in',
          left: '1in'
        },
        printBackground: true
      })

      const stats = fs.statSync(pdfPath)
      
      return {
        success: true,
        filePath: pdfPath,
        fileName: `${fileName}.pdf`,
        size: stats.size
      }
    } catch (error) {
      throw new Error(`PDF导出失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  }

  /**
   * 导出为TXT
   */
  private async exportToTXT(data: any, fileName: string): Promise<ExportResult> {
    try {
      let content = `${data.project.title}\n`
      content += '='.repeat(data.project.title.length) + '\n\n'

      if (data.metadata) {
        content += `作者：${data.project.author || '未知'}\n`
        content += `字数：${data.metadata.totalWords} 字\n`
        content += `章节数：${data.metadata.totalChapters} 章\n`
        content += `创建时间：${new Date(data.project.createdAt).toLocaleDateString()}\n\n`
      }

      if (data.project.description) {
        content += `内容简介\n${'='.repeat(8)}\n${data.project.description}\n\n`
      }

      for (const chapter of data.chapters) {
        content += `\n\n${chapter.title}\n`
        content += '-'.repeat(chapter.title.length) + '\n\n'
        content += chapter.content + '\n'
      }

      const filePath = path.join(this.exportDir, `${fileName}.txt`)
      fs.writeFileSync(filePath, content, 'utf-8')

      const stats = fs.statSync(filePath)

      return {
        success: true,
        filePath,
        fileName: `${fileName}.txt`,
        size: stats.size
      }
    } catch (error) {
      throw new Error(`TXT导出失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 导出为Markdown
   */
  private async exportToMarkdown(data: any, fileName: string): Promise<ExportResult> {
    try {
      let content = `# ${data.project.title}\n\n`

      if (data.metadata) {
        content += `**作者：** ${data.project.author || '未知'}  \n`
        content += `**字数：** ${data.metadata.totalWords} 字  \n`
        content += `**章节数：** ${data.metadata.totalChapters} 章  \n`
        content += `**创建时间：** ${new Date(data.project.createdAt).toLocaleDateString()}  \n\n`
      }

      if (data.project.description) {
        content += `## 内容简介\n\n${data.project.description}\n\n`
      }

      content += `## 目录\n\n`
      for (let i = 0; i < data.chapters.length; i++) {
        const chapter = data.chapters[i]
        content += `${i + 1}. [${chapter.title}](#${this.slugify(chapter.title)})\n`
      }
      content += '\n---\n\n'

      for (const chapter of data.chapters) {
        content += `## ${chapter.title} {#${this.slugify(chapter.title)}}\n\n`
        content += chapter.content + '\n\n'
      }

      const filePath = path.join(this.exportDir, `${fileName}.md`)
      fs.writeFileSync(filePath, content, 'utf-8')

      const stats = fs.statSync(filePath)

      return {
        success: true,
        filePath,
        fileName: `${fileName}.md`,
        size: stats.size
      }
    } catch (error) {
      throw new Error(`Markdown导出失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 导出为JSON
   */
  private async exportToJSON(data: any, fileName: string): Promise<ExportResult> {
    try {
      const filePath = path.join(this.exportDir, `${fileName}.json`)
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')

      const stats = fs.statSync(filePath)

      return {
        success: true,
        filePath,
        fileName: `${fileName}.json`,
        size: stats.size
      }
    } catch (error) {
      throw new Error(`JSON导出失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 导出为ZIP压缩包
   */
  private async exportToZip(data: any, fileName: string): Promise<ExportResult> {
    try {
      return new Promise((resolve, reject) => {
        const zipPath = path.join(this.exportDir, `${fileName}.zip`)
        const output = fs.createWriteStream(zipPath)
        const archive = archiver('zip', { zlib: { level: 9 } })

        output.on('close', () => {
          resolve({
            success: true,
            filePath: zipPath,
            fileName: `${fileName}.zip`,
            size: archive.pointer()
          })
        })

        archive.on('error', (err) => {
          reject(new Error(`ZIP压缩失败: ${err.message}`))
        })

        archive.pipe(output)

        // 添加各种格式的文件
        const tempFiles: string[] = []

        // 添加JSON数据
        const jsonContent = JSON.stringify(data, null, 2)
        archive.append(jsonContent, { name: 'data.json' })

        // 添加TXT文件
        const txtContent = this.generateTXTContent(data)
        archive.append(txtContent, { name: `${fileName}.txt` })

        // 添加Markdown文件
        const mdContent = this.generateMarkdownContent(data)
        archive.append(mdContent, { name: `${fileName}.md` })

        archive.finalize()
      })
    } catch (error) {
      throw new Error(`ZIP导出失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 导出文集为ZIP
   */
  private async exportCollectionToZip(data: any, fileName: string): Promise<ExportResult> {
    try {
      return new Promise((resolve, reject) => {
        const zipPath = path.join(this.exportDir, `${fileName}_文集.zip`)
        const output = fs.createWriteStream(zipPath)
        const archive = archiver('zip', { zlib: { level: 9 } })

        output.on('close', () => {
          resolve({
            success: true,
            filePath: zipPath,
            fileName: `${fileName}_文集.zip`,
            size: archive.pointer()
          })
        })

        archive.on('error', (err) => {
          reject(new Error(`文集ZIP压缩失败: ${err.message}`))
        })

        archive.pipe(output)

        // 添加文集信息
        const collectionInfo = {
          name: data.collection.name,
          description: data.collection.description,
          exportTime: data.exportTime,
          metadata: data.metadata
        }
        archive.append(JSON.stringify(collectionInfo, null, 2), { name: 'collection.json' })

        // 为每个项目创建文件夹
        for (const projectData of data.projects) {
          const project = projectData.project
          const chapters = projectData.chapters
          
          const projectFolder = this.sanitizeFileName(project.title)
          
          // 项目信息文件
          archive.append(JSON.stringify(project, null, 2), { name: `${projectFolder}/project.json` })
          
          // 各章节文件
          for (const chapter of chapters) {
            const chapterFileName = this.sanitizeFileName(chapter.title)
            archive.append(chapter.content, { name: `${projectFolder}/chapters/${chapterFileName}.txt` })
          }
          
          // 项目完整文档
          const fullContent = this.generateProjectFullContent(project, chapters)
          archive.append(fullContent, { name: `${projectFolder}/${project.title}_完整版.txt` })
        }

        archive.finalize()
      })
    } catch (error) {
      throw new Error(`文集导出失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 辅助方法：计算字数
   */
  private calculateWordCount(chapters: Chapter[]): number {
    return chapters.reduce((total, chapter) => {
      return total + (chapter.content ? chapter.content.length : 0)
    }, 0)
  }

  /**
   * 辅助方法：生成HTML内容
   */
  private generateHTML(data: any): string {
    let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${data.project.title}</title>
    <style>
        body { font-family: 'Microsoft YaHei', Arial, sans-serif; line-height: 1.6; margin: 40px; }
        h1 { text-align: center; font-size: 24px; margin-bottom: 30px; }
        h2 { font-size: 18px; margin-top: 30px; margin-bottom: 15px; }
        .metadata { background-color: #f5f5f5; padding: 15px; margin: 20px 0; }
        .chapter { page-break-before: always; margin-top: 30px; }
        p { margin: 10px 0; text-indent: 2em; }
    </style>
</head>
<body>
    <h1>${data.project.title}</h1>
`

    if (data.metadata) {
      html += `
    <div class="metadata">
        <p><strong>作者：</strong>${data.project.author || '未知'}</p>
        <p><strong>字数：</strong>${data.metadata.totalWords} 字</p>
        <p><strong>章节数：</strong>${data.metadata.totalChapters} 章</p>
        <p><strong>创建时间：</strong>${new Date(data.project.createdAt).toLocaleDateString()}</p>
    </div>
`
    }

    if (data.project.description) {
      html += `
    <h2>内容简介</h2>
    <p>${data.project.description}</p>
`
    }

    for (const chapter of data.chapters) {
      html += `
    <div class="chapter">
        <h2>${chapter.title}</h2>
        ${chapter.content.split('\n').map((line: string) => `<p>${line || '&nbsp;'}</p>`).join('')}
    </div>
`
    }

    html += `
</body>
</html>
`
    return html
  }

  /**
   * 辅助方法：生成TXT内容
   */
  private generateTXTContent(data: any): string {
    let content = `${data.project.title}\n`
    content += '='.repeat(data.project.title.length) + '\n\n'

    if (data.metadata) {
      content += `作者：${data.project.author || '未知'}\n`
      content += `字数：${data.metadata.totalWords} 字\n`
      content += `章节数：${data.metadata.totalChapters} 章\n\n`
    }

    if (data.project.description) {
      content += `内容简介\n${data.project.description}\n\n`
    }

    for (const chapter of data.chapters) {
      content += `\n${chapter.title}\n`
      content += '-'.repeat(chapter.title.length) + '\n\n'
      content += chapter.content + '\n'
    }

    return content
  }

  /**
   * 辅助方法：生成Markdown内容
   */
  private generateMarkdownContent(data: any): string {
    let content = `# ${data.project.title}\n\n`

    if (data.metadata) {
      content += `**作者：** ${data.project.author || '未知'}  \n`
      content += `**字数：** ${data.metadata.totalWords} 字  \n`
      content += `**章节数：** ${data.metadata.totalChapters} 章  \n\n`
    }

    if (data.project.description) {
      content += `## 内容简介\n\n${data.project.description}\n\n`
    }

    for (const chapter of data.chapters) {
      content += `## ${chapter.title}\n\n${chapter.content}\n\n`
    }

    return content
  }

  /**
   * 辅助方法：生成项目完整内容
   */
  private generateProjectFullContent(project: any, chapters: Chapter[]): string {
    let content = `${project.title}\n`
    content += '='.repeat(project.title.length) + '\n\n'
    
    if (project.description) {
      content += `${project.description}\n\n`
    }

    for (const chapter of chapters) {
      content += `\n${chapter.title}\n`
      content += '-'.repeat(chapter.title.length) + '\n\n'
      content += chapter.content + '\n'
    }

    return content
  }

  /**
   * 辅助方法：URL友好的slug生成
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  /**
   * 辅助方法：文件名安全化
   */
  private sanitizeFileName(name: string): string {
    return name.replace(/[<>:"/\\|?*]/g, '_').trim()
  }

  /**
   * 清理导出目录
   */
  async cleanupExports(maxAge = 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const files = fs.readdirSync(this.exportDir)
      const now = Date.now()

      for (const file of files) {
        const filePath = path.join(this.exportDir, file)
        const stats = fs.statSync(filePath)
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath)
          console.log(`已清理过期导出文件: ${file}`)
        }
      }
    } catch (error) {
      console.error('清理导出文件失败:', error)
    }
  }
}

export const exportService = new ExportService()
export { ExportService }