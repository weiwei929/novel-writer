// 新的统一服务层 - 桥接路由和仓库系统
import { LowDBRepositoryManager } from '../repositories/lowdb/RepositoryManager.js';
export class ApplicationService {
    constructor(dataPath) {
        this.initialized = false;
        this.repositoryManager = new LowDBRepositoryManager(dataPath);
    }
    async initialize() {
        if (this.initialized)
            return;
        await this.repositoryManager.initialize();
        this.initialized = true;
        console.log('🚀 Application Service initialized successfully');
    }
    ensureInitialized() {
        if (!this.initialized) {
            throw new Error('Application Service not initialized. Call initialize() first.');
        }
    }
    // ===== 文集相关方法 =====
    async getCollections() {
        this.ensureInitialized();
        return await this.repositoryManager.collections.findAll();
    }
    async getCollection(id) {
        this.ensureInitialized();
        return await this.repositoryManager.collections.findById(id);
    }
    async createCollection(data) {
        this.ensureInitialized();
        return await this.repositoryManager.collections.create(data);
    }
    async updateCollection(id, updates) {
        this.ensureInitialized();
        return await this.repositoryManager.collections.update(id, updates);
    }
    async deleteCollection(id) {
        this.ensureInitialized();
        return await this.repositoryManager.collections.delete(id);
    }
    async searchCollections(query) {
        this.ensureInitialized();
        return await this.repositoryManager.collections.search(query);
    }
    // ===== 项目相关方法 =====
    async getProjects(collectionId) {
        this.ensureInitialized();
        if (collectionId) {
            return await this.repositoryManager.projects.findByCollectionId(collectionId);
        }
        return await this.repositoryManager.projects.findAll();
    }
    async getProject(id) {
        this.ensureInitialized();
        return await this.repositoryManager.projects.findById(id);
    }
    async createProject(data) {
        this.ensureInitialized();
        return await this.repositoryManager.projects.create(data);
    }
    async updateProject(id, updates) {
        this.ensureInitialized();
        return await this.repositoryManager.projects.update(id, updates);
    }
    async deleteProject(id) {
        this.ensureInitialized();
        return await this.repositoryManager.projects.delete(id);
    }
    async searchProjects(query) {
        this.ensureInitialized();
        return await this.repositoryManager.projects.search(query);
    }
    async getProjectsByGenre(genres) {
        this.ensureInitialized();
        const allProjects = await this.repositoryManager.projects.findAll();
        return allProjects.filter(project => genres.some(genre => project.genre.includes(genre)));
    }
    async getProjectsByStatus(status) {
        this.ensureInitialized();
        const allProjects = await this.repositoryManager.projects.findAll();
        return allProjects.filter(project => project.status === status);
    }
    // ===== 章节相关方法 =====
    async getChapters(projectId) {
        this.ensureInitialized();
        return await this.repositoryManager.chapters.findByProjectId(projectId);
    }
    async getChapter(id) {
        this.ensureInitialized();
        return await this.repositoryManager.chapters.findById(id);
    }
    async createChapter(data) {
        this.ensureInitialized();
        return await this.repositoryManager.chapters.create(data);
    }
    async updateChapter(id, updates) {
        this.ensureInitialized();
        return await this.repositoryManager.chapters.update(id, updates);
    }
    async deleteChapter(id) {
        this.ensureInitialized();
        return await this.repositoryManager.chapters.delete(id);
    }
    async reorderChapters(projectId, chapterIds) {
        this.ensureInitialized();
        // 手动实现章节重新排序
        const chapters = await this.repositoryManager.chapters.findByProjectId(projectId);
        const updates = chapterIds.map((chapterId, index) => ({
            id: chapterId,
            input: { order: index + 1 }
        }));
        await this.repositoryManager.chapters.updateMany(updates);
        return await this.repositoryManager.chapters.findByProjectId(projectId);
    }
    async getChaptersByStatus(projectId, status) {
        this.ensureInitialized();
        const chapters = await this.repositoryManager.chapters.findByProjectId(projectId);
        return chapters.filter(chapter => chapter.status === status);
    }
    // ===== AI任务相关方法 =====
    async createAITask(task) {
        this.ensureInitialized();
        return await this.repositoryManager.aiTasks.create(task);
    }
    async getAITask(id) {
        this.ensureInitialized();
        return await this.repositoryManager.aiTasks.findById(id);
    }
    async getAITasksByProject(projectId) {
        this.ensureInitialized();
        return await this.repositoryManager.aiTasks.findByProjectId(projectId);
    }
    async updateAITask(id, updates) {
        this.ensureInitialized();
        return await this.repositoryManager.aiTasks.update(id, updates);
    }
    async getPendingAITasks() {
        this.ensureInitialized();
        return await this.repositoryManager.aiTasks.findPendingTasks();
    }
    // ===== 模板相关方法 =====
    async getTemplates() {
        this.ensureInitialized();
        return await this.repositoryManager.templates.findAll();
    }
    async getTemplate(id) {
        this.ensureInitialized();
        return await this.repositoryManager.templates.findById(id);
    }
    async createTemplate(templateData) {
        this.ensureInitialized();
        return await this.repositoryManager.templates.create(templateData);
    }
    // ===== 统计和分析方法 =====
    async getProjectStatistics() {
        this.ensureInitialized();
        const projects = await this.repositoryManager.projects.findAll();
        const totalProjects = projects.length;
        const activeProjects = projects.filter(p => p.status === 'writing').length;
        const completedProjects = projects.filter(p => p.status === 'completed').length;
        let totalChapters = 0;
        let totalWords = 0;
        for (const project of projects) {
            totalChapters += project.chapterCount || 0;
            totalWords += project.wordCount || 0;
        }
        return {
            totalProjects,
            totalChapters,
            totalWords,
            activeProjects,
            completedProjects
        };
    }
    async getCollectionStatistics(collectionId) {
        this.ensureInitialized();
        const projectCount = await this.repositoryManager.collections.getProjectCount(collectionId);
        if (projectCount === 0) {
            return {
                projectCount: 0,
                totalWords: 0,
                totalChapters: 0,
                lastUpdated: new Date().toISOString()
            };
        }
        const projects = await this.repositoryManager.projects.findByCollectionId(collectionId);
        let totalWords = 0;
        let totalChapters = 0;
        let lastUpdated = '';
        for (const project of projects) {
            totalWords += project.wordCount || 0;
            totalChapters += project.chapterCount || 0;
            if (project.updatedAt > lastUpdated) {
                lastUpdated = project.updatedAt;
            }
        }
        return {
            projectCount,
            totalWords,
            totalChapters,
            lastUpdated: lastUpdated || new Date().toISOString()
        };
    }
    // ===== 健康检查和维护方法 =====
    async healthCheck() {
        this.ensureInitialized();
        return await this.repositoryManager.healthCheck();
    }
    async backup() {
        this.ensureInitialized();
        return await this.repositoryManager.backup();
    }
    async restore(backupData) {
        this.ensureInitialized();
        return await this.repositoryManager.restore(backupData);
    }
    // ===== 事务支持 =====
    async transaction(fn) {
        this.ensureInitialized();
        return await this.repositoryManager.transaction(async () => {
            return await fn(this);
        });
    }
    // ===== 批量操作 =====
    async batchCreateProjects(projects) {
        this.ensureInitialized();
        const result = await this.repositoryManager.projects.createMany(projects);
        // 修复：result.successful 是数字，我们需要返回实际创建的项目
        if (result.successful === 0) {
            return [];
        }
        // 获取刚创建的项目（通过最近的创建时间）
        const allProjects = await this.repositoryManager.projects.findAll();
        return allProjects
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, result.successful);
    }
    async batchCreateChapters(chapters) {
        this.ensureInitialized();
        const result = await this.repositoryManager.chapters.createMany(chapters);
        // 修复：result.successful 是数字，我们需要返回实际创建的章节
        if (result.successful === 0) {
            return [];
        }
        // 获取刚创建的章节（通过最近的创建时间）
        const allChapters = await this.repositoryManager.chapters.findAll();
        return allChapters
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, result.successful);
    }
    // ===== 兼容性方法（向后兼容旧API）=====
    // 为了兼容现有路由，提供与旧database.ts相同的方法名
    async init() {
        return this.initialize();
    }
}
// 创建全局服务实例
export const applicationService = new ApplicationService();
// 为了向后兼容，导出一个类似旧database.ts的对象
export const db = {
    // 初始化
    init: () => applicationService.initialize(),
    // 文集
    getCollections: () => applicationService.getCollections(),
    getCollection: (id) => applicationService.getCollection(id),
    createCollection: (data) => applicationService.createCollection(data),
    updateCollection: (id, updates) => applicationService.updateCollection(id, updates),
    deleteCollection: (id) => applicationService.deleteCollection(id),
    // 项目
    getProjects: (collectionId) => applicationService.getProjects(collectionId),
    getProject: (id) => applicationService.getProject(id),
    createProject: (data) => applicationService.createProject(data),
    updateProject: (id, updates) => applicationService.updateProject(id, updates),
    deleteProject: (id) => applicationService.deleteProject(id),
    // 章节
    getChapters: (projectId) => applicationService.getChapters(projectId),
    getChapter: (id) => applicationService.getChapter(id),
    createChapter: (data) => applicationService.createChapter(data),
    updateChapter: (id, updates) => applicationService.updateChapter(id, updates),
    deleteChapter: (id) => applicationService.deleteChapter(id),
    // 其他
    healthCheck: () => applicationService.healthCheck()
};
//# sourceMappingURL=applicationService.js.map