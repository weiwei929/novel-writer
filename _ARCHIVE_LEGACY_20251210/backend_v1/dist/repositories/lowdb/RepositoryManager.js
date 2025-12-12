// LowDB 数据仓库管理器实现
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { join } from 'path';
import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import { LowDBProjectRepository } from './ProjectRepository.js';
import { LowDBChapterRepository } from './ChapterRepository.js';
import { LowDBAITaskRepository } from './AITaskRepository.js';
import { LowDBCollectionRepository } from './CollectionRepository.js';
import { LowDBTemplateRepository, LowDBConsistencyRepository, LowDBProgressRepository } from './AdditionalRepositories.js';
import { createDefaultData } from './types.js';
export class LowDBRepositoryManager {
    constructor(dataPath = './data') {
        this.dataPath = dataPath;
    }
    async initialize() {
        if (this.db)
            return;
        // 确保数据目录存在
        if (!existsSync(this.dataPath)) {
            await mkdir(this.dataPath, { recursive: true });
        }
        // 初始化数据库
        const file = join(this.dataPath, 'database.json');
        const adapter = new JSONFile(file);
        const defaultData = createDefaultData();
        this.db = new Low(adapter, defaultData);
        await this.db.read();
        // 检查是否需要数据迁移
        await this.performMigrations();
        await this.db.write();
        // 初始化仓库实例
        this._projects = new LowDBProjectRepository(this.db);
        this._chapters = new LowDBChapterRepository(this.db);
        this._collections = new LowDBCollectionRepository(this.db);
        this._aiTasks = new LowDBAITaskRepository(this.db);
        this._templates = new LowDBTemplateRepository(this.db);
        this._consistency = new LowDBConsistencyRepository(this.db);
        this._progress = new LowDBProgressRepository(this.db);
        console.log('🗄️ Database initialized successfully');
    }
    // 仓库访问器
    get projects() {
        if (!this._projects)
            throw new Error('Database not initialized');
        return this._projects;
    }
    get chapters() {
        if (!this._chapters)
            throw new Error('Database not initialized');
        return this._chapters;
    }
    get collections() {
        if (!this._collections)
            throw new Error('Database not initialized');
        return this._collections;
    }
    get aiTasks() {
        if (!this._aiTasks)
            throw new Error('Database not initialized');
        return this._aiTasks;
    }
    get templates() {
        if (!this._templates)
            throw new Error('Database not initialized');
        return this._templates;
    }
    get consistency() {
        if (!this._consistency)
            throw new Error('Database not initialized');
        return this._consistency;
    }
    get progress() {
        if (!this._progress)
            throw new Error('Database not initialized');
        return this._progress;
    }
    // 数据库迁移
    async performMigrations() {
        if (!this.db)
            return;
        // Ensure db.data exists; if missing, initialize from default
        if (!this.db.data) {
            console.warn('⚠️ db.data is undefined - initializing default data structure');
            this.db.data = createDefaultData();
            await this.db.write();
        }
        // Ensure metadata exists
        if (!this.db.data.metadata) {
            this.db.data.metadata = { version: '0.0.0', createdAt: new Date().toISOString() };
        }
        const currentVersion = this.db.data.metadata?.version || '0.0.0';
        // 版本 1.0.0 迁移：添加新的数据结构
        if (this.compareVersions(currentVersion, '1.0.0') < 0) {
            console.log('🔄 Migrating database to version 1.0.0...');
            // 确保所有必需的数组存在
            if (!this.db.data.aiTasks)
                this.db.data.aiTasks = [];
            if (!this.db.data.templates)
                this.db.data.templates = [];
            if (!this.db.data.consistencyResults)
                this.db.data.consistencyResults = [];
            if (!this.db.data.progress)
                this.db.data.progress = [];
            if (!this.db.data.collections)
                this.db.data.collections = this.db.data.collections || [];
            if (!this.db.data.projects)
                this.db.data.projects = this.db.data.projects || [];
            if (!this.db.data.chapters)
                this.db.data.chapters = this.db.data.chapters || [];
            // 迁移现有项目和章节数据，添加新字段
            this.db.data.projects.forEach(project => {
                if (!project.version)
                    project.version = '1.0.0';
                if (!project.aiConfig)
                    project.aiConfig = {};
                if (!project.metadata)
                    project.metadata = {};
            });
            this.db.data.chapters.forEach(chapter => {
                if (!chapter.version)
                    chapter.version = '1.0.0';
                if (!chapter.aiGeneration)
                    chapter.aiGeneration = { isAIGenerated: false };
            });
            // Ensure metadata object before setting migration fields
            this.db.data.metadata.version = '1.0.0';
            this.db.data.metadata.lastMigration = new Date().toISOString();
            await this.db.write();
            console.log('✅ Database migration to 1.0.0 completed');
        }
    }
    compareVersions(version1, version2) {
        const v1Parts = version1.split('.').map(Number);
        const v2Parts = version2.split('.').map(Number);
        for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
            const v1Part = v1Parts[i] || 0;
            const v2Part = v2Parts[i] || 0;
            if (v1Part < v2Part)
                return -1;
            if (v1Part > v2Part)
                return 1;
        }
        return 0;
    }
    // 备份功能
    async backup() {
        if (!this.db)
            throw new Error('Database not initialized');
        await this.db.read();
        const backupData = JSON.stringify(this.db.data, null, 2);
        // 生成备份文件名
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = join(this.dataPath, `backup-${timestamp}.json`);
        // 这里可以添加文件写入逻辑
        console.log(`📦 Backup created: ${backupPath}`);
        return backupData;
    }
    async restore(backupData) {
        if (!this.db)
            throw new Error('Database not initialized');
        try {
            const data = JSON.parse(backupData);
            // 验证备份数据结构
            if (!data.projects || !data.chapters || !data.collections) {
                throw new Error('Invalid backup data structure');
            }
            this.db.data = data;
            await this.db.write();
            console.log('📥 Database restored from backup successfully');
        }
        catch (error) {
            console.error('❌ Failed to restore from backup:', error);
            throw error;
        }
    }
    // 健康检查
    async healthCheck() {
        const details = {};
        try {
            if (!this.db) {
                return {
                    status: 'unhealthy',
                    details: { error: 'Database not initialized' }
                };
            }
            await this.db.read();
            // 检查数据完整性
            details.collections = {
                count: this.db.data.collections.length,
                status: 'ok'
            };
            details.projects = {
                count: this.db.data.projects.length,
                status: 'ok'
            };
            details.chapters = {
                count: this.db.data.chapters.length,
                status: 'ok'
            };
            details.aiTasks = {
                count: this.db.data.aiTasks?.length || 0,
                pendingTasks: this.db.data.aiTasks?.filter(t => t.status === 'pending').length || 0,
                status: 'ok'
            };
            // 检查数据库文件权限和大小
            const dbFile = join(this.dataPath, 'database.json');
            if (existsSync(dbFile)) {
                const fs = await import('fs');
                const stats = fs.statSync(dbFile);
                details.database = {
                    size: stats.size,
                    lastModified: stats.mtime.toISOString(),
                    status: 'ok'
                };
            }
            details.version = this.db.data.metadata?.version || '0.0.0';
            details.lastCheck = new Date().toISOString();
            return {
                status: 'healthy',
                details
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                details: {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    timestamp: new Date().toISOString()
                }
            };
        }
    }
    // 简单事务支持（对于LowDB来说主要是批量操作）
    async transaction(fn) {
        if (!this.db)
            throw new Error('Database not initialized');
        // 创建数据快照
        await this.db.read();
        const snapshot = JSON.parse(JSON.stringify(this.db.data));
        try {
            const result = await fn(this);
            return result;
        }
        catch (error) {
            // 回滚到快照状态
            this.db.data = snapshot;
            await this.db.write();
            throw error;
        }
    }
}
//# sourceMappingURL=RepositoryManager.js.map