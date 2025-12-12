import { Low } from 'lowdb';
import { Project, CreateProjectInput, UpdateProjectInput, BatchOperationResult } from '../../types/index.js';
import { IProjectRepository } from '../interfaces.js';
import { DatabaseData } from './types.js';
export declare class LowDBProjectRepository implements IProjectRepository {
    private db;
    constructor(db: Low<DatabaseData>);
    create(input: CreateProjectInput): Promise<Project>;
    findById(id: string): Promise<Project | null>;
    findByCollectionId(collectionId: string): Promise<Project[]>;
    findAll(): Promise<Project[]>;
    update(id: string, input: UpdateProjectInput): Promise<Project | null>;
    delete(id: string): Promise<boolean>;
    createMany(inputs: CreateProjectInput[]): Promise<BatchOperationResult<Project>>;
    updateMany(updates: {
        id: string;
        input: UpdateProjectInput;
    }[]): Promise<BatchOperationResult<Project>>;
    deleteMany(ids: string[]): Promise<BatchOperationResult<boolean>>;
    search(query: string, filters?: {
        collectionId?: string;
        status?: Project['status'];
        genre?: string[];
        tags?: string[];
    }): Promise<Project[]>;
    getStatistics(projectId: string): Promise<{
        wordCount: number;
        chapterCount: number;
        completionPercentage: number;
        lastUpdated: string;
    }>;
    updateAIConfig(projectId: string, aiConfig: Project['aiConfig']): Promise<Project | null>;
    getGenerationHistory(projectId: string): Promise<NonNullable<Project['aiConfig']>['generationHistory']>;
    addGenerationRecord(projectId: string, record: {
        timestamp: string;
        type: 'architecture' | 'outline' | 'chapter';
        chapterId?: string;
        success: boolean;
        tokensUsed?: number;
    }): Promise<Project | null>;
}
//# sourceMappingURL=ProjectRepository.d.ts.map