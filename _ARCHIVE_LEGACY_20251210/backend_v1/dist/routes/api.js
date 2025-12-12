import { Router } from 'express';
import { db } from '../services/database.js';
const router = Router();
// ==================== 文集路由 ====================
/**
 * 获取所有文集
 */
router.get('/collections', async (req, res) => {
    try {
        const collections = await db.getCollections();
        const response = {
            success: true,
            data: collections,
            metadata: {
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            }
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching collections:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_COLLECTIONS_ERROR',
                message: error instanceof Error ? error.message : 'Failed to fetch collections'
            }
        });
    }
});
/**
 * 根据ID获取文集
 */
router.get('/collections/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const collection = await db.getCollectionById(id);
        if (!collection) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'COLLECTION_NOT_FOUND',
                    message: 'Collection not found'
                }
            });
        }
        const response = {
            success: true,
            data: collection,
            metadata: {
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            }
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching collection:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_COLLECTION_ERROR',
                message: error instanceof Error ? error.message : 'Failed to fetch collection'
            }
        });
    }
});
/**
 * 创建文集
 */
router.post('/collections', async (req, res) => {
    try {
        const { name, description, tags = [], coverImage, metadata } = req.body;
        // 验证必填字段
        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Collection name is required'
                }
            });
        }
        const collectionData = {
            name: name.trim(),
            description: description?.trim(),
            tags: Array.isArray(tags) ? tags : [],
            coverImage,
            metadata
        };
        const collection = await db.createCollection(collectionData);
        const response = {
            success: true,
            data: collection,
            metadata: {
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            }
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error('Error creating collection:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'CREATE_COLLECTION_ERROR',
                message: error instanceof Error ? error.message : 'Failed to create collection'
            }
        });
    }
});
/**
 * 更新文集
 */
router.put('/collections/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        // 移除不应该被更新的字段
        delete updates.id;
        delete updates.createdAt;
        delete updates.projectCount;
        const collection = await db.updateCollection(id, updates);
        if (!collection) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'COLLECTION_NOT_FOUND',
                    message: 'Collection not found'
                }
            });
        }
        const response = {
            success: true,
            data: collection,
            metadata: {
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            }
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error updating collection:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'UPDATE_COLLECTION_ERROR',
                message: error instanceof Error ? error.message : 'Failed to update collection'
            }
        });
    }
});
/**
 * 删除文集
 */
router.delete('/collections/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const success = await db.deleteCollection(id);
        if (!success) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'COLLECTION_NOT_FOUND',
                    message: 'Collection not found'
                }
            });
        }
        const response = {
            success: true,
            metadata: {
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            }
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error deleting collection:', error);
        if (error instanceof Error && error.message.includes('Cannot delete collection')) {
            return res.status(409).json({
                success: false,
                error: {
                    code: 'COLLECTION_HAS_PROJECTS',
                    message: error.message
                }
            });
        }
        res.status(500).json({
            success: false,
            error: {
                code: 'DELETE_COLLECTION_ERROR',
                message: error instanceof Error ? error.message : 'Failed to delete collection'
            }
        });
    }
});
// ==================== 项目路由 ====================
/**
 * 获取项目列表
 */
router.get('/projects', async (req, res) => {
    try {
        const { collectionId } = req.query;
        const projects = await db.getProjects(collectionId);
        const response = {
            success: true,
            data: projects,
            metadata: {
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            }
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_PROJECTS_ERROR',
                message: error instanceof Error ? error.message : 'Failed to fetch projects'
            }
        });
    }
});
/**
 * 根据ID获取项目
 */
router.get('/projects/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const project = await db.getProjectById(id);
        if (!project) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'PROJECT_NOT_FOUND',
                    message: 'Project not found'
                }
            });
        }
        const response = {
            success: true,
            data: project,
            metadata: {
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            }
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_PROJECT_ERROR',
                message: error instanceof Error ? error.message : 'Failed to fetch project'
            }
        });
    }
});
/**
 * 创建项目
 */
router.post('/projects', async (req, res) => {
    try {
        const { collectionId, title, description, author, genre = [], tags = [], status = 'draft', coverImage, settings, publishInfo, metadata } = req.body;
        // 验证必填字段
        if (!collectionId || !title || !author) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Collection ID, title, and author are required'
                }
            });
        }
        const projectData = {
            collectionId,
            title: title.trim(),
            description: description?.trim(),
            author: author.trim(),
            genre: Array.isArray(genre) ? genre : [],
            tags: Array.isArray(tags) ? tags : [],
            status,
            coverImage,
            settings,
            publishInfo,
            metadata
        };
        const project = await db.createProject(projectData);
        const response = {
            success: true,
            data: project,
            metadata: {
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            }
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error('Error creating project:', error);
        if (error instanceof Error && error.message.includes('Collection not found')) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'COLLECTION_NOT_FOUND',
                    message: error.message
                }
            });
        }
        res.status(500).json({
            success: false,
            error: {
                code: 'CREATE_PROJECT_ERROR',
                message: error instanceof Error ? error.message : 'Failed to create project'
            }
        });
    }
});
/**
 * 更新项目
 */
router.put('/projects/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        // 移除不应该被更新的字段
        delete updates.id;
        delete updates.createdAt;
        delete updates.wordCount;
        delete updates.chapterCount;
        const project = await db.updateProject(id, updates);
        if (!project) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'PROJECT_NOT_FOUND',
                    message: 'Project not found'
                }
            });
        }
        const response = {
            success: true,
            data: project,
            metadata: {
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            }
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'UPDATE_PROJECT_ERROR',
                message: error instanceof Error ? error.message : 'Failed to update project'
            }
        });
    }
});
/**
 * 删除项目
 */
router.delete('/projects/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const success = await db.deleteProject(id);
        if (!success) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'PROJECT_NOT_FOUND',
                    message: 'Project not found'
                }
            });
        }
        const response = {
            success: true,
            metadata: {
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            }
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'DELETE_PROJECT_ERROR',
                message: error instanceof Error ? error.message : 'Failed to delete project'
            }
        });
    }
});
// ==================== 章节路由 ====================
/**
 * 获取项目的章节列表
 */
router.get('/projects/:projectId/chapters', async (req, res) => {
    try {
        const { projectId } = req.params;
        const chapters = await db.getChapters(projectId);
        const response = {
            success: true,
            data: chapters,
            metadata: {
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            }
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching chapters:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_CHAPTERS_ERROR',
                message: error instanceof Error ? error.message : 'Failed to fetch chapters'
            }
        });
    }
});
/**
 * 根据ID获取章节
 */
router.get('/chapters/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const chapter = await db.getChapterById(id);
        if (!chapter) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'CHAPTER_NOT_FOUND',
                    message: 'Chapter not found'
                }
            });
        }
        const response = {
            success: true,
            data: chapter,
            metadata: {
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            }
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching chapter:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_CHAPTER_ERROR',
                message: error instanceof Error ? error.message : 'Failed to fetch chapter'
            }
        });
    }
});
/**
 * 创建章节
 */
router.post('/chapters', async (req, res) => {
    try {
        const { projectId, title, content = '', order, status = 'draft', notes, tags = [], aiPrompts, metadata } = req.body;
        // 验证必填字段
        if (!projectId || !title) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Project ID and title are required'
                }
            });
        }
        const chapterData = {
            projectId,
            title: title.trim(),
            content,
            order: order || 1,
            status,
            notes,
            tags: Array.isArray(tags) ? tags : [],
            aiPrompts,
            metadata
        };
        const chapter = await db.createChapter(chapterData);
        const response = {
            success: true,
            data: chapter,
            metadata: {
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            }
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error('Error creating chapter:', error);
        if (error instanceof Error && error.message.includes('Project not found')) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'PROJECT_NOT_FOUND',
                    message: error.message
                }
            });
        }
        res.status(500).json({
            success: false,
            error: {
                code: 'CREATE_CHAPTER_ERROR',
                message: error instanceof Error ? error.message : 'Failed to create chapter'
            }
        });
    }
});
/**
 * 更新章节
 */
router.put('/chapters/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        // 移除不应该被更新的字段
        delete updates.id;
        delete updates.createdAt;
        delete updates.wordCount; // 这个会自动计算
        const chapter = await db.updateChapter(id, updates);
        if (!chapter) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'CHAPTER_NOT_FOUND',
                    message: 'Chapter not found'
                }
            });
        }
        const response = {
            success: true,
            data: chapter,
            metadata: {
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            }
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error updating chapter:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'UPDATE_CHAPTER_ERROR',
                message: error instanceof Error ? error.message : 'Failed to update chapter'
            }
        });
    }
});
/**
 * 删除章节
 */
router.delete('/chapters/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const success = await db.deleteChapter(id);
        if (!success) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'CHAPTER_NOT_FOUND',
                    message: 'Chapter not found'
                }
            });
        }
        const response = {
            success: true,
            metadata: {
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            }
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error deleting chapter:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'DELETE_CHAPTER_ERROR',
                message: error instanceof Error ? error.message : 'Failed to delete chapter'
            }
        });
    }
});
// ==================== 通用路由 ====================
/**
 * 搜索
 */
router.get('/search', async (req, res) => {
    try {
        const { q: query, type } = req.query;
        if (!query || typeof query !== 'string') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Search query is required'
                }
            });
        }
        const results = await db.search(query, type);
        const response = {
            success: true,
            data: results,
            metadata: {
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            }
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error searching:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SEARCH_ERROR',
                message: error instanceof Error ? error.message : 'Search failed'
            }
        });
    }
});
/**
 * 获取统计信息
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = await db.getStats();
        const response = {
            success: true,
            data: stats,
            metadata: {
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            }
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_STATS_ERROR',
                message: error instanceof Error ? error.message : 'Failed to fetch statistics'
            }
        });
    }
});
// ==================== Grok AI 路由 ====================
/**
 * 生成内容
 */
router.post('/ai/generate', async (req, res) => {
    try {
        const { grokService } = await import('../services/grok.js');
        const { prompt, context, maxTokens, temperature, systemPrompt } = req.body;
        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_PROMPT',
                    message: 'Prompt is required and must be a string'
                }
            });
        }
        if (!grokService.isConfigured()) {
            return res.status(503).json({
                success: false,
                error: {
                    code: 'API_NOT_CONFIGURED',
                    message: 'Grok API not configured. Please set GROK_API_KEY environment variable.'
                }
            });
        }
        const response = await grokService.generate({
            prompt,
            context,
            maxTokens,
            temperature,
            systemPrompt
        });
        res.json({
            success: true,
            data: response
        });
    }
    catch (error) {
        console.error('Generate error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'AI_GENERATE_ERROR',
                message: error instanceof Error ? error.message : 'AI generation failed'
            }
        });
    }
});
/**
 * 获取写作建议
 */
router.post('/ai/writing-suggestion', async (req, res) => {
    try {
        const { grokService } = await import('../services/grok.js');
        const { content, type = 'continue' } = req.body;
        if (!content || typeof content !== 'string') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_CONTENT',
                    message: 'Content is required and must be a string'
                }
            });
        }
        if (!['continue', 'improve', 'brainstorm'].includes(type)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_TYPE',
                    message: 'Type must be one of: continue, improve, brainstorm'
                }
            });
        }
        if (!grokService.isConfigured()) {
            return res.status(503).json({
                success: false,
                error: {
                    code: 'API_NOT_CONFIGURED',
                    message: 'Grok API not configured'
                }
            });
        }
        const suggestion = await grokService.getWritingSuggestion(content, type);
        res.json({
            success: true,
            data: {
                suggestion,
                type
            }
        });
    }
    catch (error) {
        console.error('Writing suggestion error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'AI_SUGGESTION_ERROR',
                message: error instanceof Error ? error.message : 'Writing suggestion failed'
            }
        });
    }
});
/**
 * 生成角色设定
 */
router.post('/ai/generate-character', async (req, res) => {
    try {
        const { grokService } = await import('../services/grok.js');
        const { description } = req.body;
        if (!description || typeof description !== 'string') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_DESCRIPTION',
                    message: 'Description is required and must be a string'
                }
            });
        }
        if (!grokService.isConfigured()) {
            return res.status(503).json({
                success: false,
                error: {
                    code: 'API_NOT_CONFIGURED',
                    message: 'Grok API not configured'
                }
            });
        }
        const character = await grokService.generateCharacter(description);
        res.json({
            success: true,
            data: {
                character
            }
        });
    }
    catch (error) {
        console.error('Generate character error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'AI_CHARACTER_ERROR',
                message: error instanceof Error ? error.message : 'Character generation failed'
            }
        });
    }
});
/**
 * 测试 AI API 连接
 */
router.get('/ai/test', async (req, res) => {
    try {
        const { grokService } = await import('../services/grok.js');
        if (!grokService.isConfigured()) {
            return res.json({
                success: false,
                data: {
                    configured: false,
                    message: 'Grok API not configured. Please set GROK_API_KEY environment variable.'
                }
            });
        }
        const isWorking = await grokService.testConnection();
        res.json({
            success: isWorking,
            data: {
                configured: true,
                working: isWorking,
                message: isWorking ? 'Grok API is working properly' : 'Grok API connection failed'
            }
        });
    }
    catch (error) {
        console.error('Test connection error:', error);
        res.json({
            success: false,
            data: {
                configured: true,
                working: false,
                message: error instanceof Error ? error.message : 'Connection test failed'
            }
        });
    }
});
export default router;
//# sourceMappingURL=api.js.map