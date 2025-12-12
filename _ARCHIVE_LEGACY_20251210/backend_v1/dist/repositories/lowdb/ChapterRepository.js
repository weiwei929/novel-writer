import { v4 as uuidv4 } from 'uuid';
export class LowDBChapterRepository {
    constructor(db) {
        this.db = db;
    }
    async create(input) {
        await this.db.read();
        // 验证项目存在
        const project = this.db.data.projects.find(p => p.id === input.projectId);
        if (!project) {
            throw new Error('Project not found');
        }
        const now = new Date().toISOString();
        const chapter = {
            ...input,
            id: uuidv4(),
            wordCount: this.calculateWordCount(input.content || ''),
            createdAt: now,
            updatedAt: now,
            version: '1.0.0'
        };
        this.db.data.chapters.push(chapter);
        // 更新项目统计
        project.chapterCount = (project.chapterCount || 0) + 1;
        project.wordCount = this.db.data.chapters
            .filter(c => c.projectId === input.projectId)
            .reduce((sum, c) => sum + (c.wordCount || 0), 0);
        project.updatedAt = now;
        await this.db.write();
        return chapter;
    }
    async findById(id) {
        await this.db.read();
        return this.db.data.chapters.find(c => c.id === id) || null;
    }
    async findByProjectId(projectId) {
        await this.db.read();
        return this.db.data.chapters
            .filter(c => c.projectId === projectId)
            .sort((a, b) => a.order - b.order);
    }
    async findAll() {
        await this.db.read();
        return [...this.db.data.chapters];
    }
    async update(id, input) {
        await this.db.read();
        const chapterIndex = this.db.data.chapters.findIndex(c => c.id === id);
        if (chapterIndex === -1)
            return null;
        const existingChapter = this.db.data.chapters[chapterIndex];
        const updatedChapter = {
            ...existingChapter,
            ...input,
            id, // 确保ID不变
            updatedAt: new Date().toISOString()
        };
        // 重新计算字数（如果内容改变）
        if (input.content !== undefined) {
            updatedChapter.wordCount = this.calculateWordCount(input.content);
        }
        this.db.data.chapters[chapterIndex] = updatedChapter;
        // 更新项目统计
        await this.updateProjectStats(updatedChapter.projectId);
        await this.db.write();
        return updatedChapter;
    }
    async delete(id) {
        await this.db.read();
        const chapter = this.db.data.chapters.find(c => c.id === id);
        if (!chapter)
            return false;
        const initialLength = this.db.data.chapters.length;
        this.db.data.chapters = this.db.data.chapters.filter(c => c.id !== id);
        const deleted = this.db.data.chapters.length < initialLength;
        if (deleted) {
            // 更新项目统计
            await this.updateProjectStats(chapter.projectId);
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
                const chapter = await this.create(input);
                results.push({ id: chapter.id, success: true, data: chapter });
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
                const chapter = await this.update(id, input);
                if (chapter) {
                    results.push({ id, success: true, data: chapter });
                    successful++;
                }
                else {
                    results.push({ id, success: false, error: 'Chapter not found' });
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
    async reorder(projectId, chapterIds) {
        await this.db.read();
        const chapters = this.db.data.chapters.filter(c => c.projectId === projectId);
        // 验证所有章节ID都存在且属于该项目
        const existingIds = new Set(chapters.map(c => c.id));
        const invalidIds = chapterIds.filter(id => !existingIds.has(id));
        if (invalidIds.length > 0) {
            throw new Error(`Invalid chapter IDs: ${invalidIds.join(', ')}`);
        }
        // 重新排序
        chapterIds.forEach((chapterId, index) => {
            const chapterIndex = this.db.data.chapters.findIndex(c => c.id === chapterId);
            if (chapterIndex !== -1) {
                this.db.data.chapters[chapterIndex].order = index + 1;
                this.db.data.chapters[chapterIndex].updatedAt = new Date().toISOString();
            }
        });
        await this.db.write();
        return this.findByProjectId(projectId);
    }
    async moveChapter(chapterId, newOrder) {
        await this.db.read();
        const chapter = this.db.data.chapters.find(c => c.id === chapterId);
        if (!chapter)
            return null;
        const projectChapters = this.db.data.chapters
            .filter(c => c.projectId === chapter.projectId)
            .sort((a, b) => a.order - b.order);
        // 调整其他章节的顺序
        const oldOrder = chapter.order;
        if (newOrder > oldOrder) {
            // 向后移动
            projectChapters.forEach(c => {
                if (c.order > oldOrder && c.order <= newOrder) {
                    c.order--;
                    c.updatedAt = new Date().toISOString();
                }
            });
        }
        else if (newOrder < oldOrder) {
            // 向前移动
            projectChapters.forEach(c => {
                if (c.order >= newOrder && c.order < oldOrder) {
                    c.order++;
                    c.updatedAt = new Date().toISOString();
                }
            });
        }
        // 设置新位置
        chapter.order = newOrder;
        chapter.updatedAt = new Date().toISOString();
        await this.db.write();
        return chapter;
    }
    async search(query, filters) {
        await this.db.read();
        let results = this.db.data.chapters;
        // 应用过滤器
        if (filters?.projectId) {
            results = results.filter(c => c.projectId === filters.projectId);
        }
        if (filters?.status) {
            results = results.filter(c => c.status === filters.status);
        }
        // 应用文本搜索
        if (query.trim()) {
            const lowerQuery = query.toLowerCase();
            results = results.filter(c => c.title.toLowerCase().includes(lowerQuery) ||
                c.content.toLowerCase().includes(lowerQuery) ||
                c.summary?.toLowerCase().includes(lowerQuery) ||
                c.outline?.toLowerCase().includes(lowerQuery));
        }
        return results.sort((a, b) => a.order - b.order);
    }
    async updateAIGeneration(chapterId, aiGeneration) {
        return this.update(chapterId, { aiGeneration });
    }
    async getAIGeneratedChapters(projectId) {
        await this.db.read();
        return this.db.data.chapters.filter(c => c.projectId === projectId &&
            c.aiGeneration?.isAIGenerated === true);
    }
    async updateWordCount(chapterId) {
        await this.db.read();
        const chapter = this.db.data.chapters.find(c => c.id === chapterId);
        if (!chapter)
            return null;
        const newWordCount = this.calculateWordCount(chapter.content);
        return this.update(chapterId, { wordCount: newWordCount });
    }
    async getChaptersByCharacter(characterId) {
        await this.db.read();
        return this.db.data.chapters.filter(c => c.charactersInvolved?.some(char => char.characterId === characterId));
    }
    async getChaptersByPlotPoint(plotType) {
        await this.db.read();
        return this.db.data.chapters.filter(c => c.plotPoints?.some(plot => plot.type === plotType));
    }
    // 私有辅助方法
    calculateWordCount(content) {
        if (!content || content.trim() === '')
            return 0;
        return content.trim().split(/\s+/).length;
    }
    async updateProjectStats(projectId) {
        const project = this.db.data.projects.find(p => p.id === projectId);
        if (!project)
            return;
        const chapters = this.db.data.chapters.filter(c => c.projectId === projectId);
        project.chapterCount = chapters.length;
        project.wordCount = chapters.reduce((sum, c) => sum + (c.wordCount || 0), 0);
        project.updatedAt = new Date().toISOString();
    }
}
//# sourceMappingURL=ChapterRepository.js.map