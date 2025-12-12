import { v4 as uuidv4 } from 'uuid';
// 模板仓库实现
export class LowDBTemplateRepository {
    constructor(db) {
        this.db = db;
    }
    async ensureTemplatesArray() {
        if (!this.db.data.templates) {
            this.db.data.templates = [];
        }
    }
    async create(templateData) {
        await this.db.read();
        await this.ensureTemplatesArray();
        const now = new Date().toISOString();
        const template = {
            ...templateData,
            id: uuidv4(),
            createdAt: now,
            updatedAt: now
        };
        this.db.data.templates.push(template);
        await this.db.write();
        return template;
    }
    async findById(id) {
        await this.db.read();
        await this.ensureTemplatesArray();
        return this.db.data.templates.find(t => t.id === id) || null;
    }
    async findAll() {
        await this.db.read();
        await this.ensureTemplatesArray();
        return [...this.db.data.templates];
    }
    async update(id, updates) {
        await this.db.read();
        await this.ensureTemplatesArray();
        const templateIndex = this.db.data.templates.findIndex(t => t.id === id);
        if (templateIndex === -1)
            return null;
        const existingTemplate = this.db.data.templates[templateIndex];
        const updatedTemplate = {
            ...existingTemplate,
            ...updates,
            id,
            updatedAt: new Date().toISOString()
        };
        this.db.data.templates[templateIndex] = updatedTemplate;
        await this.db.write();
        return updatedTemplate;
    }
    async delete(id) {
        await this.db.read();
        await this.ensureTemplatesArray();
        const initialLength = this.db.data.templates.length;
        this.db.data.templates = this.db.data.templates.filter(t => t.id !== id);
        const deleted = this.db.data.templates.length < initialLength;
        if (deleted) {
            await this.db.write();
        }
        return deleted;
    }
    async findByCategory(category) {
        await this.db.read();
        await this.ensureTemplatesArray();
        return this.db.data.templates.filter(t => t.category === category);
    }
    async findByGenre(genre) {
        await this.db.read();
        await this.ensureTemplatesArray();
        return this.db.data.templates.filter(t => t.genres.includes(genre));
    }
    async findPublicTemplates() {
        await this.db.read();
        await this.ensureTemplatesArray();
        return this.db.data.templates.filter(t => t.isPublic);
    }
    async findByCreator(createdBy) {
        await this.db.read();
        await this.ensureTemplatesArray();
        return this.db.data.templates.filter(t => t.createdBy === createdBy);
    }
    async incrementUsage(templateId) {
        const template = await this.findById(templateId);
        if (!template)
            return null;
        const updatedUsage = {
            ...template.usage,
            timesUsed: template.usage.timesUsed + 1
        };
        return this.update(templateId, { usage: updatedUsage });
    }
    async updateSuccessRate(templateId, successful) {
        const template = await this.findById(templateId);
        if (!template)
            return null;
        const totalAttempts = template.usage.timesUsed;
        const successfulAttempts = successful
            ? Math.floor(template.usage.successRate * totalAttempts) + 1
            : Math.floor(template.usage.successRate * totalAttempts);
        const newSuccessRate = totalAttempts > 0 ? successfulAttempts / totalAttempts : 0;
        return this.update(templateId, {
            usage: { ...template.usage, successRate: newSuccessRate }
        });
    }
}
// 一致性检查仓库实现
export class LowDBConsistencyRepository {
    constructor(db) {
        this.db = db;
    }
    async ensureConsistencyArray() {
        if (!this.db.data.consistencyResults) {
            this.db.data.consistencyResults = [];
        }
    }
    async create(resultData) {
        await this.db.read();
        await this.ensureConsistencyArray();
        const result = {
            ...resultData,
            id: uuidv4()
        };
        this.db.data.consistencyResults.push(result);
        await this.db.write();
        return result;
    }
    async findById(id) {
        await this.db.read();
        await this.ensureConsistencyArray();
        return this.db.data.consistencyResults.find(r => r.id === id) || null;
    }
    async findByTargetId(targetId) {
        await this.db.read();
        await this.ensureConsistencyArray();
        return this.db.data.consistencyResults.filter(r => r.target.id === targetId);
    }
    async findAll() {
        await this.db.read();
        await this.ensureConsistencyArray();
        return [...this.db.data.consistencyResults];
    }
    async delete(id) {
        await this.db.read();
        await this.ensureConsistencyArray();
        const initialLength = this.db.data.consistencyResults.length;
        this.db.data.consistencyResults = this.db.data.consistencyResults.filter(r => r.id !== id);
        const deleted = this.db.data.consistencyResults.length < initialLength;
        if (deleted) {
            await this.db.write();
        }
        return deleted;
    }
    async findByTargetType(type) {
        await this.db.read();
        await this.ensureConsistencyArray();
        return this.db.data.consistencyResults.filter(r => r.target.type === type);
    }
    async findByScoreRange(minScore, maxScore) {
        await this.db.read();
        await this.ensureConsistencyArray();
        return this.db.data.consistencyResults.filter(r => r.results.overallScore >= minScore && r.results.overallScore <= maxScore);
    }
    async findRecentChecks(days) {
        await this.db.read();
        await this.ensureConsistencyArray();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        const cutoffISOString = cutoffDate.toISOString();
        return this.db.data.consistencyResults.filter(r => r.checkedAt > cutoffISOString);
    }
    async deleteOldResults(olderThanDays) {
        await this.db.read();
        await this.ensureConsistencyArray();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
        const cutoffISOString = cutoffDate.toISOString();
        const initialLength = this.db.data.consistencyResults.length;
        this.db.data.consistencyResults = this.db.data.consistencyResults.filter(r => r.checkedAt > cutoffISOString);
        const deletedCount = initialLength - this.db.data.consistencyResults.length;
        if (deletedCount > 0) {
            await this.db.write();
        }
        return deletedCount;
    }
}
// 进度追踪仓库实现
export class LowDBProgressRepository {
    constructor(db) {
        this.db = db;
    }
    async ensureProgressArray() {
        if (!this.db.data.progress) {
            this.db.data.progress = [];
        }
    }
    async create(progressData) {
        await this.db.read();
        await this.ensureProgressArray();
        const progress = {
            ...progressData,
            id: uuidv4()
        };
        this.db.data.progress.push(progress);
        await this.db.write();
        return progress;
    }
    async findById(id) {
        await this.db.read();
        await this.ensureProgressArray();
        return this.db.data.progress.find(p => p.id === id) || null;
    }
    async findByProjectId(projectId) {
        await this.db.read();
        await this.ensureProgressArray();
        return this.db.data.progress.filter(p => p.projectId === projectId);
    }
    async findByDate(date) {
        await this.db.read();
        await this.ensureProgressArray();
        return this.db.data.progress.filter(p => p.date === date);
    }
    async update(id, updates) {
        await this.db.read();
        await this.ensureProgressArray();
        const progressIndex = this.db.data.progress.findIndex(p => p.id === id);
        if (progressIndex === -1)
            return null;
        const existingProgress = this.db.data.progress[progressIndex];
        const updatedProgress = {
            ...existingProgress,
            ...updates,
            id
        };
        this.db.data.progress[progressIndex] = updatedProgress;
        await this.db.write();
        return updatedProgress;
    }
    async delete(id) {
        await this.db.read();
        await this.ensureProgressArray();
        const initialLength = this.db.data.progress.length;
        this.db.data.progress = this.db.data.progress.filter(p => p.id !== id);
        const deleted = this.db.data.progress.length < initialLength;
        if (deleted) {
            await this.db.write();
        }
        return deleted;
    }
    async getProjectProgress(projectId, days) {
        await this.db.read();
        await this.ensureProgressArray();
        let progress = this.db.data.progress.filter(p => p.projectId === projectId);
        if (days) {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            const cutoffDateString = cutoffDate.toISOString().split('T')[0];
            progress = progress.filter(p => p.date >= cutoffDateString);
        }
        return progress.sort((a, b) => a.date.localeCompare(b.date));
    }
    async getDailyStats(projectId, date) {
        await this.db.read();
        await this.ensureProgressArray();
        return this.db.data.progress.find(p => p.projectId === projectId && p.date === date) || null;
    }
    async getWeeklyStats(projectId, weekStart) {
        // 简化实现：返回一周内的所有进度记录
        const startDate = new Date(weekStart);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);
        const startDateString = startDate.toISOString().split('T')[0];
        const endDateString = endDate.toISOString().split('T')[0];
        await this.db.read();
        await this.ensureProgressArray();
        return this.db.data.progress.filter(p => p.projectId === projectId &&
            p.date >= startDateString &&
            p.date < endDateString);
    }
    async getMonthlyStats(projectId, month) {
        await this.db.read();
        await this.ensureProgressArray();
        return this.db.data.progress.filter(p => p.projectId === projectId &&
            p.date.startsWith(month));
    }
    async getProgressTowardsTarget(projectId) {
        const recentProgress = await this.getProjectProgress(projectId, 30);
        if (recentProgress.length === 0)
            return null;
        const latestProgress = recentProgress[recentProgress.length - 1];
        const totalWords = recentProgress.reduce((sum, p) => sum + p.daily.wordsWritten, 0);
        const averageDailyWords = totalWords / recentProgress.length;
        // 简化实现：假设目标在targets中定义
        const targetCompletion = latestProgress.targets?.dailyWordTarget || 1000;
        const daysRemaining = Math.ceil((targetCompletion - latestProgress.cumulative.totalWords) / averageDailyWords);
        return {
            currentProgress: latestProgress,
            targetCompletion,
            daysRemaining: Math.max(0, daysRemaining),
            averageDailyWords
        };
    }
}
//# sourceMappingURL=AdditionalRepositories.js.map