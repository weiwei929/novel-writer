import express, { Request, Response } from 'express'
import { ImportService } from '../services/importService'
import { ExportService } from '../services/exportService'
import { requireAuth } from '../middleware/auth'
import fileUpload from 'express-fileupload'
import path from 'path'
import { fileURLToPath } from 'url'

// ES 模块中获取 __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 扩展 Request 接口以支持文件上传
declare global {
  namespace Express {
    interface Request {
      files?: fileUpload.FileArray
    }
  }
}

const router = express.Router()
const importService = new ImportService()
const exportService = new ExportService()

// 使用文件上传中间件
router.use(fileUpload({
  createParentPath: true,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  useTempFiles: true,
  tempFileDir: path.join(__dirname, '../../temp/uploads'),
  abortOnLimit: true,
  responseOnLimit: '文件大小超出限制（最大50MB）'
}))

/**
 * 上传并导入文件
 */
router.post('/import', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ error: '没有上传文件' })
    }

    const file = req.files.file as fileUpload.UploadedFile
    const collectionId = req.body.collectionId as string | undefined

    // 验证文件类型
    const allowedExtensions = ['.docx', '.txt', '.md', '.json', '.zip']
    const fileExtension = path.extname(file.name).toLowerCase()
    
    if (!allowedExtensions.includes(fileExtension)) {
      return res.status(400).json({ 
        error: `不支持的文件类型: ${fileExtension}。支持的类型: ${allowedExtensions.join(', ')}` 
      })
    }

    // 保存上传的文件到临时目录
    const tempPath = path.join(__dirname, '../../temp/uploads', `${Date.now()}-${file.name}`)
    await file.mv(tempPath)
    
    try {
      const result = await importService.importFromFile(tempPath, { 
        targetCollectionId: collectionId,
        validateContent: true
      })

      res.json({
        success: true,
        message: '导入成功',
        data: result
      })

    } finally {
      // 清理临时文件
      try {
        const fs = require('fs')
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath)
        }
      } catch (cleanupError) {
        console.error('清理临时文件失败:', cleanupError)
      }
    }

  } catch (error) {
    console.error('文件导入错误:', error)
    res.status(500).json({ 
      error: `文件导入失败: ${error instanceof Error ? error.message : '未知错误'}` 
    })
  }
})

/**
 * 统一导出接口 - 支持多种格式
 */
router.get('/export/:format/:projectId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { format, projectId } = req.params
    
    const validFormats = ['word', 'pdf', 'text', 'markdown', 'json']
    if (!validFormats.includes(format)) {
      return res.status(400).json({ 
        error: `不支持的导出格式: ${format}。支持的格式: ${validFormats.join(', ')}` 
      })
    }

    const result = await exportService.exportProject(projectId, { 
      format: format as any,
      includeMetadata: true
    })
    
    if (result.success && result.filePath) {
      res.download(result.filePath, (err) => {
        if (err) {
          console.error('文件下载错误:', err)
          if (!res.headersSent) {
            res.status(500).json({ error: '文件下载失败' })
          }
        }
        // 注意：清理文件应该在下载完成后进行，这里先不清理
      })
    } else {
      res.status(500).json({ error: '导出失败' })
    }

  } catch (error) {
    console.error('导出错误:', error)
    res.status(500).json({ 
      error: `导出失败: ${error instanceof Error ? error.message : '未知错误'}` 
    })
  }
})

/**
 * 导出合集
 */
router.get('/export-collection/:format/:collectionId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { format, collectionId } = req.params
    
    const validFormats = ['word', 'pdf', 'text', 'markdown', 'json', 'zip']
    if (!validFormats.includes(format)) {
      return res.status(400).json({ 
        error: `不支持的导出格式: ${format}。支持的格式: ${validFormats.join(', ')}` 
      })
    }

    const result = await exportService.exportCollection(collectionId, { 
      format: format as any,
      includeMetadata: true
    })
    
    if (result.success && result.filePath) {
      res.download(result.filePath, (err) => {
        if (err) {
          console.error('文件下载错误:', err)
          if (!res.headersSent) {
            res.status(500).json({ error: '文件下载失败' })
          }
        }
      })
    } else {
      res.status(500).json({ error: '导出失败' })
    }

  } catch (error) {
    console.error('合集导出错误:', error)
    res.status(500).json({ 
      error: `合集导出失败: ${error instanceof Error ? error.message : '未知错误'}` 
    })
  }
})

/**
 * 清理临时文件
 */
router.post('/cleanup', requireAuth, async (req: Request, res: Response) => {
  try {
    await importService.cleanupUploads()
    res.json({ success: true, message: '临时文件清理完成' })
  } catch (error) {
    console.error('清理临时文件失败:', error)
    res.status(500).json({ 
      error: `清理临时文件失败: ${error instanceof Error ? error.message : '未知错误'}` 
    })
  }
})

/**
 * 获取支持的文件格式信息
 */
router.get('/formats', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      import: {
        formats: [
          { extension: '.docx', name: 'Word 文档', description: '支持导入 Word 文档中的文本内容' },
          { extension: '.txt', name: '文本文件', description: '支持纯文本文件导入' },
          { extension: '.md', name: 'Markdown 文件', description: '支持 Markdown 格式文件导入' },
          { extension: '.json', name: '数据库文件', description: '支持从 JSON 格式的数据库备份导入' },
          { extension: '.zip', name: '备份压缩包', description: '支持从完整备份压缩包恢复' }
        ],
        maxFileSize: '50MB',
        notes: [
          'Word 文档将自动提取文本内容并按标题分割章节',
          'Markdown 文件支持标准格式，自动识别章节结构',
          '文本文件将作为单个章节导入',
          'JSON 和 ZIP 备份文件可完整恢复数据'
        ]
      },
      export: {
        formats: [
          { key: 'word', name: 'Word 文档', extension: '.docx', description: '导出为格式化的 Word 文档' },
          { key: 'pdf', name: 'PDF 文档', extension: '.pdf', description: '导出为 PDF 文档' },
          { key: 'text', name: '文本文件', extension: '.txt', description: '导出为纯文本文件' },
          { key: 'markdown', name: 'Markdown 文件', extension: '.md', description: '导出为 Markdown 格式' },
          { key: 'database', name: '数据库备份', extension: '.json', description: '导出完整数据库为 JSON 格式' },
          { key: 'backup', name: '完整备份', extension: '.zip', description: '创建包含所有数据的压缩备份' }
        ],
        batch: {
          supported: true,
          formats: ['word', 'pdf', 'text', 'markdown', 'zip'],
          description: '支持批量导出多个项目'
        }
      }
    }
  })
})

export default router