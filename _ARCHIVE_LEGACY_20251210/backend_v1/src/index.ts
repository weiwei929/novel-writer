import express from 'express'
import cors from 'cors'
import compression from 'compression'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config()

// 导入独立路由
import collectionsRouter from './routes/collections.js'
import projectsRouter from './routes/projects.js'
import chaptersRouter from './routes/chapters.js'
import statsRouter from './routes/stats.js'
import apiRouter from './routes/api.js'
import authRouter from './routes/auth.js'
import fileRouter from './routes/fileRoutes.js'
import versionsRouter from './routes/versions.js'

// 导入中间件
import { errorHandler, notFoundHandler, requestLogger } from './middleware/errorHandler.js'
import { authenticateApp } from './middleware/auth.js'
import { securityHeaders, apiLimiter, authLimiter, uploadLimiter } from './middleware/security.js'

const app = express()
const PORT = parseInt(process.env.PORT || '5000', 10)

// 安全中间件（必须在最前面）
app.use(securityHeaders)

// 响应压缩中间件
app.use(compression())

// CORS 配置
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  })
)

// 请求体解析
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 请求日志中间件 - 恢复到原位置
if (process.env.NODE_ENV !== 'test') {
  app.use(requestLogger)
}

// 导入日志服务
import { log } from './utils/logger.js'

// 所有路由定义
app.get('/', (req: express.Request, res: express.Response) => {
  log.debug('Root path handler executed', { url: req.url, path: req.path, query: req.query })
  res.status(200).json({
    message: 'Novel Writer Backend API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/health',
      api: '/api/v1',
      collections: '/api/v1/collections',
      projects: '/api/v1/projects',
      chapters: '/api/v1/chapters',
      stats: '/api/v1/stats',
    },
  })
})

// 健康检查端点
app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  })
})

// 根健康检查（未认证）
// app.get('/health', (req: express.Request, res: express.Response) => {
//   res.json({
//     status: 'ok',
//     scope: 'public',
//     timestamp: new Date().toISOString(),
//     environment: process.env.NODE_ENV || 'development'
//   })
// })

// 版本化健康检查（可公开访问，已加入白名单）
app.get('/api/v1/health', (req: express.Request, res: express.Response) => {
  res.json({
    status: 'ok',
    scope: 'api',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  })
})

// 认证路由 (公开访问，使用严格速率限制)
app.use('/auth', authLimiter, authRouter)

// 应用认证中间件 (保护所有 API 路由)
app.use('/api', authenticateApp)

// API 路由 - 应用速率限制
// 注意：路由顺序很重要！/api/v1 必须放在 /api/v1/projects 之前
// 因为 versionsRouter 中有 /projects/:id/versions 路由
// 如果顺序反了，/api/v1/projects/:id/versions 会被 projectsRouter 捕获并返回 404
app.use('/api/v1', apiLimiter)
app.use('/api/v1', versionsRouter) // 这匹配 /api/v1/projects/:id/versions 等
app.use('/api/v1/collections', collectionsRouter)
app.use('/api/v1/projects', projectsRouter) // 这匹配 /api/v1/projects/:id
app.use('/api/v1/chapters', chaptersRouter)
app.use('/api/v1/stats', statsRouter)
app.use('/api/v1/files', uploadLimiter, fileRouter) // 文件路由使用上传速率限制

// 只有在路径是 '/api/' 或 '/api/v1' 开头时才使用 apiRouter
app.use('/api/v1', apiRouter)

// 初始化数据结构
function initializeDataStructure() {
  const dataPath = process.env.DATA_PATH || './data'

  const directories = [
    'collections',
    'projects',
    'backups',
    'media',
    'media/images',
    'media/videos',
  ]

  for (const dir of directories) {
    const fullPath = path.join(dataPath, dir)
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true })
    }
  }

  // 创建workspace配置文件
  const workspaceFile = path.join(dataPath, 'workspace.json')
  if (!fs.existsSync(workspaceFile)) {
    const initialWorkspace = {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      collections: [],
      settings: { theme: 'dark', language: 'zh-CN' },
    }
    fs.writeFileSync(workspaceFile, JSON.stringify(initialWorkspace, null, 2))
  }
}

// 404处理 - 必须在所有路由之后
app.use('*', notFoundHandler)

// 全局错误处理 - 必须在最后
app.use(errorHandler)

// 启动服务器
async function startServer() {
  try {
    log.info('Starting server initialization...')

    log.info('Initializing data structure...')
    initializeDataStructure()
    log.info('Data structure initialized')

    // 导入并初始化数据库
    log.info('Importing database service...')
    const { db } = await import('./services/database.js')
    log.info('Database service imported')

    log.info('Initializing database...')
    await db.init()
    log.info('Database initialized')

    log.info('Starting HTTP server...')
    const server = app.listen(PORT, '0.0.0.0', () => {
      log.info(`Novel-Writer Backend Server running on port ${PORT}`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        dataPath: process.env.DATA_PATH || './data',
        healthCheck: `http://localhost:${PORT}/health`,
      })
    })

    server.on('error', (error: unknown) => {
      log.error('Server error', { error })
      if (error && typeof error === 'object' && 'code' in error && error.code === 'EADDRINUSE') {
        log.error(`Port ${PORT} is already in use`)
      }
    })
  } catch (error) {
    log.error('Failed to start server', { error })
    process.exit(1)
  }
}

// 添加进程错误处理
process.on('uncaughtException', error => {
  log.error('Uncaught Exception', { error })
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled Rejection', { promise, reason })
  process.exit(1)
})

// 启动应用
startServer()
