import { Application } from 'express'
import versionRoutes from './versions'

export function setupRoutes(app: Application) {
  // 基础健康检查路由已在index.ts中定义
  
  // 版本管理API路由
  app.use('/api', versionRoutes)
  
  // TODO: 添加各种API路由
  // app.use('/api/v1/collections', collectionRoutes)
  // app.use('/api/v1/projects', projectRoutes)
  // app.use('/api/v1/generate', generateRoutes)
  // app.use('/api/v1/media', mediaRoutes)
  // app.use('/api/v1/backup', backupRoutes)
  
  console.log('API routes setup completed')
}