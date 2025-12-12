import { Low } from 'lowdb';
import { AIGenerationTask } from '../../types/index.js';
import { IAITaskRepository } from '../interfaces.js';
import { DatabaseData } from './types.js';
export declare class LowDBAITaskRepository implements IAITaskRepository {
    private db;
    constructor(db: Low<DatabaseData>);
    private ensureAITasksArray;
    create(taskData: Omit<AIGenerationTask, 'id' | 'createdAt'>): Promise<AIGenerationTask>;
    findById(id: string): Promise<AIGenerationTask | null>;
    findByProjectId(projectId: string): Promise<AIGenerationTask[]>;
    findAll(): Promise<AIGenerationTask[]>;
    update(id: string, updates: Partial<AIGenerationTask>): Promise<AIGenerationTask | null>;
    delete(id: string): Promise<boolean>;
    updateStatus(id: string, status: AIGenerationTask['status']): Promise<AIGenerationTask | null>;
    setResult(id: string, result: AIGenerationTask['result']): Promise<AIGenerationTask | null>;
    setError(id: string, error: AIGenerationTask['error']): Promise<AIGenerationTask | null>;
    findByStatus(status: AIGenerationTask['status']): Promise<AIGenerationTask[]>;
    findByType(type: AIGenerationTask['type']): Promise<AIGenerationTask[]>;
    findPendingTasks(): Promise<AIGenerationTask[]>;
    findCompletedTasks(projectId?: string): Promise<AIGenerationTask[]>;
    deleteCompletedTasks(olderThanDays: number): Promise<number>;
}
//# sourceMappingURL=AITaskRepository.d.ts.map