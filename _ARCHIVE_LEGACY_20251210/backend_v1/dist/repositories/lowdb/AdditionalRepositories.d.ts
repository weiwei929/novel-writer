import { Low } from 'lowdb';
import { NovelTemplate, ConsistencyCheckResult, WritingProgress } from '../../types/index.js';
import { ITemplateRepository, IConsistencyRepository, IProgressRepository } from '../interfaces.js';
import { DatabaseData } from './types.js';
export declare class LowDBTemplateRepository implements ITemplateRepository {
    private db;
    constructor(db: Low<DatabaseData>);
    private ensureTemplatesArray;
    create(templateData: Omit<NovelTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<NovelTemplate>;
    findById(id: string): Promise<NovelTemplate | null>;
    findAll(): Promise<NovelTemplate[]>;
    update(id: string, updates: Partial<NovelTemplate>): Promise<NovelTemplate | null>;
    delete(id: string): Promise<boolean>;
    findByCategory(category: string): Promise<NovelTemplate[]>;
    findByGenre(genre: string): Promise<NovelTemplate[]>;
    findPublicTemplates(): Promise<NovelTemplate[]>;
    findByCreator(createdBy: string): Promise<NovelTemplate[]>;
    incrementUsage(templateId: string): Promise<NovelTemplate | null>;
    updateSuccessRate(templateId: string, successful: boolean): Promise<NovelTemplate | null>;
}
export declare class LowDBConsistencyRepository implements IConsistencyRepository {
    private db;
    constructor(db: Low<DatabaseData>);
    private ensureConsistencyArray;
    create(resultData: Omit<ConsistencyCheckResult, 'id'>): Promise<ConsistencyCheckResult>;
    findById(id: string): Promise<ConsistencyCheckResult | null>;
    findByTargetId(targetId: string): Promise<ConsistencyCheckResult[]>;
    findAll(): Promise<ConsistencyCheckResult[]>;
    delete(id: string): Promise<boolean>;
    findByTargetType(type: ConsistencyCheckResult['target']['type']): Promise<ConsistencyCheckResult[]>;
    findByScoreRange(minScore: number, maxScore: number): Promise<ConsistencyCheckResult[]>;
    findRecentChecks(days: number): Promise<ConsistencyCheckResult[]>;
    deleteOldResults(olderThanDays: number): Promise<number>;
}
export declare class LowDBProgressRepository implements IProgressRepository {
    private db;
    constructor(db: Low<DatabaseData>);
    private ensureProgressArray;
    create(progressData: Omit<WritingProgress, 'id'>): Promise<WritingProgress>;
    findById(id: string): Promise<WritingProgress | null>;
    findByProjectId(projectId: string): Promise<WritingProgress[]>;
    findByDate(date: string): Promise<WritingProgress[]>;
    update(id: string, updates: Partial<WritingProgress>): Promise<WritingProgress | null>;
    delete(id: string): Promise<boolean>;
    getProjectProgress(projectId: string, days?: number): Promise<WritingProgress[]>;
    getDailyStats(projectId: string, date: string): Promise<WritingProgress | null>;
    getWeeklyStats(projectId: string, weekStart: string): Promise<WritingProgress[]>;
    getMonthlyStats(projectId: string, month: string): Promise<WritingProgress[]>;
    getProgressTowardsTarget(projectId: string): Promise<{
        currentProgress: WritingProgress;
        targetCompletion: number;
        daysRemaining: number;
        averageDailyWords: number;
    } | null>;
}
//# sourceMappingURL=AdditionalRepositories.d.ts.map