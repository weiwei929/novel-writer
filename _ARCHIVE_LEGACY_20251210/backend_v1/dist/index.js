import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
// 加载环境变量
dotenv.config();
// 导入独立路由
import collectionsRouter from './routes/collections.js';
import projectsRouter from './routes/projects.js';
import chaptersRouter from './routes/chapters.js';
import statsRouter from './routes/stats.js';
import apiRouter from './routes/api.js';
import authRouter from './routes/auth.js';
import fileRouter from './routes/fileRoutes.js';
// import versionsRouter from './routes/versions.js' // 暂时禁用版本管理路由
// 导入中间件
import { errorHandler, notFoundHandler, requestLogger } from './middleware/errorHandler.js';
import { authenticateApp } from './middleware/auth.js';
const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);
// 基础中间件
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// 请求日志中间件 - 恢复到原位置
if (process.env.NODE_ENV !== 'test') {
    app.use(requestLogger);
}
// 所有路由定义
app.get('/', (req, res) => {
    console.log('🏠 Root path handler executed:', { url: req.url, path: req.path, query: req.query });
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
            stats: '/api/v1/stats'
        }
    });
});
// 健康检查端点
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});
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
app.get('/api/v1/health', (req, res) => {
    res.json({
        status: 'ok',
        scope: 'api',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});
// 认证路由 (公开访问)
app.use('/auth', authRouter);
// 应用认证中间件 (保护所有 API 路由)
app.use('/api', authenticateApp);
// API 路由 - 更具体的路由在前面
app.use('/api/v1/collections', collectionsRouter);
app.use('/api/v1/projects', projectsRouter);
app.use('/api/v1/chapters', chaptersRouter);
app.use('/api/v1/stats', statsRouter);
app.use('/api/v1/files', fileRouter);
// app.use('/api/v1/versions', versionsRouter) // 暂时禁用版本管理路由
// 只有在路径是 '/api/' 或 '/api/v1' 开头时才使用 apiRouter
app.use('/api/v1', apiRouter);
// 初始化数据结构
function initializeDataStructure() {
    const dataPath = process.env.DATA_PATH || './data';
    const directories = [
        'collections', 'projects', 'backups',
        'media', 'media/images', 'media/videos'
    ];
    for (const dir of directories) {
        const fullPath = path.join(dataPath, dir);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
        }
    }
    // 创建workspace配置文件
    const workspaceFile = path.join(dataPath, 'workspace.json');
    if (!fs.existsSync(workspaceFile)) {
        const initialWorkspace = {
            version: '1.0.0',
            createdAt: new Date().toISOString(),
            collections: [],
            settings: { theme: 'dark', language: 'zh-CN' }
        };
        fs.writeFileSync(workspaceFile, JSON.stringify(initialWorkspace, null, 2));
    }
}
// 404处理 - 必须在所有路由之后
app.use('*', notFoundHandler);
// 全局错误处理 - 必须在最后
app.use(errorHandler);
// 启动服务器
async function startServer() {
    try {
        console.log('📌 Starting server initialization...');
        console.log('📌 Initializing data structure...');
        initializeDataStructure();
        console.log('✅ Data structure initialized');
        // 导入并初始化数据库
        console.log('📌 Importing database service...');
        const { db } = await import('./services/database.js');
        console.log('✅ Database service imported');
        console.log('📌 Initializing database...');
        await db.init();
        console.log('💾 Database initialized');
        console.log('📌 Starting HTTP server...');
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Novel-Writer Backend Server running on port ${PORT}`);
            console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`💾 Data path: ${process.env.DATA_PATH || './data'}`);
            console.log(`🔗 Health check: http://localhost:${PORT}/health`);
            console.log(`🔍 Server address: ${JSON.stringify(server.address())}`);
            console.log('✅ Server fully initialized and listening');
        });
        server.on('error', (error) => {
            console.error('❌ Server error:', error);
            if (error.code === 'EADDRINUSE') {
                console.error(`❌ Port ${PORT} is already in use`);
            }
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
// 添加进程错误处理
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
// 启动应用
startServer();
//# sourceMappingURL=index.js.map