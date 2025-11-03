import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'

// 导入独立路由
import collectionsRouter from './routes/collections.js'
import projectsRouter from './routes/projects.js'
import statsRouter from './routes/stats.js'
import apiRouter from './routes/api.js'

const app = express()
const PORT = process.env.PORT || 5000

// 基础中间件
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 基础路由
app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  })
})

app.get('/api/v1/health', (req: express.Request, res: express.Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  })
})

// 健康检查
app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  })
})

// API路由
app.use('/api/v1/collections', collectionsRouter)
app.use('/api/v1/projects', projectsRouter)
app.use('/api/v1/stats', statsRouter)
app.use('/api', apiRouter)

// 初始化数据结构
function initializeDataStructure() {
  const dataPath = process.env.DATA_PATH || './data'
  
  const directories = [
    'collections', 'projects', 'backups', 
    'media', 'media/images', 'media/videos'
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
      settings: { theme: 'dark', language: 'zh-CN' }
    }
    fs.writeFileSync(workspaceFile, JSON.stringify(initialWorkspace, null, 2))
  }
}

// 错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' ? '内部服务器错误' : err.message
    }
  })
})

// 404处理
app.use('*', (req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: '接口不存在' }
  })
})

// 启动服务器
async function startServer() {
  try {
    initializeDataStructure()
    
    app.listen(PORT, () => {
      console.log(`🚀 Novel-Writer Backend Server running on port ${PORT}`)
      console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`💾 Data path: ${process.env.DATA_PATH || './data'}`)
      console.log(`🔗 Health check: http://localhost:${PORT}/health`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

startServer()