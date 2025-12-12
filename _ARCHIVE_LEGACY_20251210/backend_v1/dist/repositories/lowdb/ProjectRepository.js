import { v4 as uuidv4 } from 'uuid';
export class LowDBProjectRepository {
    constructor(db) {
        this.db = db;
    }
    async create(input) {
        await this.db.read();
        const now = new Date().toISOString();
        const project = {
            ...input,
            id: uuidv4(),
            wordCount: 0,
            chapterCount: 0,
            createdAt: now,
            updatedAt: now,
            version: '1.0.0'
        };
        this.db.data.projects.push(project);
        // 更新文集项目计数
        if (project.collectionId) {
            const collection = this.db.data.collections.find(c => c.id === project.collectionId);
            if (collection) {
                collection.projectCount = (collection.projectCount || 0) + 1;
            }
        }
        await this.db.write();
        return project;
    }
    async findById(id) {
        await this.db.read();
        return this.db.data.projects.find(p => p.id === id) || null;
    }
    async findByCollectionId(collectionId) {
        await this.db.read();
        return this.db.data.projects.filter(p => p.collectionId === collectionId);
    }
    async findAll() {
        await this.db.read();
        return [...this.db.data.projects];
    }
    async update(id, input) {
        await this.db.read();
        const projectIndex = this.db.data.projects.findIndex(p => p.id === id);
        if (projectIndex === -1)
            return null;
        const existingProject = this.db.data.projects[projectIndex];
        const updatedProject = {
            ...existingProject,
            ...input,
            id, // 确保ID不变
            updatedAt: new Date().toISOString()
        };
        this.db.data.projects[projectIndex] = updatedProject;
        await this.db.write();
        return updatedProject;
    }
    async delete(id) {
        await this.db.read();
        const initialLength = this.db.data.projects.length;
        const project = this.db.data.projects.find(p => p.id === id);
        this.db.data.projects = this.db.data.projects.filter(p => p.id !== id);
        // 更新文集项目计数
        if (project && project.collectionId) {
            const collection = this.db.data.collections.find(c => c.id === project.collectionId);
            if (collection && collection.projectCount > 0) {
                collection.projectCount--;
            }
        }
        const deleted = this.db.data.projects.length < initialLength;
        if (deleted) {
            await this.db.write();
        }
        return deleted;
    }
    async createMany(inputs) {
        const results = [];
        let successful = 0;
        let failed = 0;
        for (const input of inputs) {
            try {
                const project = await this.create(input);
                results.push({ id: project.id, success: true, data: project });
                successful++;
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                results.push({
                    id: uuidv4(),
                    success: false,
                    error: errorMessage
                });
                failed++;
            }
        }
        return {
            success: failed === 0,
            total: inputs.length,
            successful,
            failed,
            results
        };
    }
    async updateMany(updates) {
        const results = [];
        let successful = 0;
        let failed = 0;
        for (const { id, input } of updates) {
            try {
                const project = await this.update(id, input);
                if (project) {
                    results.push({ id, success: true, data: project });
                    successful++;
                }
                else {
                    results.push({ id, success: false, error: 'Project not found' });
                    failed++;
                }
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                results.push({ id, success: false, error: errorMessage });
                failed++;
            }
        }
        return {
            success: failed === 0,
            total: updates.length,
            successful,
            failed,
            results
        };
    }
    async deleteMany(ids) {
        const results = [];
        let successful = 0;
        let failed = 0;
        for (const id of ids) {
            try {
                const deleted = await this.delete(id);
                results.push({ id, success: deleted, data: deleted });
                if (deleted)
                    successful++;
                else
                    failed++;
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                results.push({ id, success: false, error: errorMessage });
                failed++;
            }
        }
        return {
            success: failed === 0,
            total: ids.length,
            successful,
            failed,
            results
        };
    }
    async search(query, filters) {
        await this.db.read();
        let results = this.db.data.projects;
        // 应用过滤器
        if (filters?.collectionId) {
            results = results.filter(p => p.collectionId === filters.collectionId);
        }
        if (filters?.status) {
            results = results.filter(p => p.status === filters.status);
        }
        if (filters?.genre && filters.genre.length > 0) {
            results = results.filter(p => filters.genre.some(g => p.genre.includes(g)));
        }
        if (filters?.tags && filters.tags.length > 0) {
            results = results.filter(p => filters.tags.some(t => p.tags.includes(t)));
        }
        // 应用文本搜索
        if (query.trim()) {
            const lowerQuery = query.toLowerCase();
            results = results.filter(p => p.title.toLowerCase().includes(lowerQuery) ||
                p.description?.toLowerCase().includes(lowerQuery) ||
                p.author.toLowerCase().includes(lowerQuery) ||
                p.summary?.toLowerCase().includes(lowerQuery));
        }
        return results;
    }
    async getStatistics(projectId) {
        await this.db.read();
        const project = this.db.data.projects.find(p => p.id === projectId);
        if (!project) {
            throw new Error('Project not found');
        }
        const chapters = this.db.data.chapters.filter((c) => c.projectId === projectId);
        const totalWordCount = chapters.reduce((sum, c) => sum + (c.wordCount || 0), 0);
        // 计算完成百分比
        const targetWordCount = project.metadata?.targetWordCount || 50000;
        const completionPercentage = Math.min(totalWordCount / targetWordCount, 1);
        return {
            wordCount: totalWordCount,
            chapterCount: chapters.length,
            completionPercentage,
            lastUpdated: project.updatedAt
        };
    }
    async updateAIConfig(projectId, aiConfig) {
        return this.update(projectId, { aiConfig });
    }
    async getGenerationHistory(projectId) {
        await this.db.read();
        const project = this.db.data.projects.find(p => p.id === projectId);
        return project?.aiConfig?.generationHistory || [];
    }
    async addGenerationRecord(projectId, record) {
        await this.db.read();
        const project = this.db.data.projects.find(p => p.id === projectId);
        if (!project)
            return null;
        if (!project.aiConfig) {
            project.aiConfig = {};
        }
        if (!project.aiConfig.generationHistory) {
            project.aiConfig.generationHistory = [];
        }
        project.aiConfig.generationHistory.push(record);
        project.updatedAt = new Date().toISOString();
        await this.db.write();
        return project;
    }
}
//# sourceMappingURL=ProjectRepository.js.map