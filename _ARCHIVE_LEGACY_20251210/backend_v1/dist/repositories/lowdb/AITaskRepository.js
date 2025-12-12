import { v4 as uuidv4 } from 'uuid';
export class LowDBAITaskRepository {
    constructor(db) {
        this.db = db;
    }
    async ensureAITasksArray() {
        if (!this.db.data.aiTasks) {
            this.db.data.aiTasks = [];
            await this.db.write();
        }
    }
    async create(taskData) {
        await this.db.read();
        await this.ensureAITasksArray();
        const task = {
            ...taskData,
            id: uuidv4(),
            createdAt: new Date().toISOString()
        };
        this.db.data.aiTasks.push(task);
        await this.db.write();
        return task;
    }
    async findById(id) {
        await this.db.read();
        await this.ensureAITasksArray();
        return this.db.data.aiTasks.find(t => t.id === id) || null;
    }
    async findByProjectId(projectId) {
        await this.db.read();
        await this.ensureAITasksArray();
        return this.db.data.aiTasks.filter(t => t.projectId === projectId);
    }
    async findAll() {
        await this.db.read();
        await this.ensureAITasksArray();
        return [...this.db.data.aiTasks];
    }
    async update(id, updates) {
        await this.db.read();
        await this.ensureAITasksArray();
        const taskIndex = this.db.data.aiTasks.findIndex(t => t.id === id);
        if (taskIndex === -1)
            return null;
        const existingTask = this.db.data.aiTasks[taskIndex];
        const updatedTask = {
            ...existingTask,
            ...updates,
            id, // 确保ID不变
        };
        this.db.data.aiTasks[taskIndex] = updatedTask;
        await this.db.write();
        return updatedTask;
    }
    async delete(id) {
        await this.db.read();
        await this.ensureAITasksArray();
        const initialLength = this.db.data.aiTasks.length;
        this.db.data.aiTasks = this.db.data.aiTasks.filter(t => t.id !== id);
        const deleted = this.db.data.aiTasks.length < initialLength;
        if (deleted) {
            await this.db.write();
        }
        return deleted;
    }
    async updateStatus(id, status) {
        const updates = { status };
        if (status === 'running') {
            updates.startedAt = new Date().toISOString();
        }
        else if (status === 'completed' || status === 'failed' || status === 'cancelled') {
            updates.completedAt = new Date().toISOString();
        }
        return this.update(id, updates);
    }
    async setResult(id, result) {
        return this.update(id, {
            result,
            status: 'completed',
            completedAt: new Date().toISOString()
        });
    }
    async setError(id, error) {
        return this.update(id, {
            error,
            status: 'failed',
            completedAt: new Date().toISOString()
        });
    }
    async findByStatus(status) {
        await this.db.read();
        await this.ensureAITasksArray();
        return this.db.data.aiTasks.filter(t => t.status === status);
    }
    async findByType(type) {
        await this.db.read();
        await this.ensureAITasksArray();
        return this.db.data.aiTasks.filter(t => t.type === type);
    }
    async findPendingTasks() {
        return this.findByStatus('pending');
    }
    async findCompletedTasks(projectId) {
        await this.db.read();
        await this.ensureAITasksArray();
        let tasks = this.db.data.aiTasks.filter(t => t.status === 'completed');
        if (projectId) {
            tasks = tasks.filter(t => t.projectId === projectId);
        }
        return tasks;
    }
    async deleteCompletedTasks(olderThanDays) {
        await this.db.read();
        await this.ensureAITasksArray();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
        const cutoffISOString = cutoffDate.toISOString();
        const initialLength = this.db.data.aiTasks.length;
        this.db.data.aiTasks = this.db.data.aiTasks.filter(t => {
            // 保留未完成的任务或最近完成的任务
            if (t.status !== 'completed')
                return true;
            if (!t.completedAt)
                return true;
            return t.completedAt > cutoffISOString;
        });
        const deletedCount = initialLength - this.db.data.aiTasks.length;
        if (deletedCount > 0) {
            await this.db.write();
        }
        return deletedCount;
    }
}
//# sourceMappingURL=AITaskRepository.js.map