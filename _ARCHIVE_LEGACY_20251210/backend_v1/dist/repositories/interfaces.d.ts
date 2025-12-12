import { Project, Chapter, Collection, CreateProjectInput, UpdateProjectInput, CreateChapterInput, UpdateChapterInput, BatchOperationResult, AIGenerationTask, NovelTemplate, ConsistencyCheckResult, WritingProgress } from '../types/index.js';
/**
 * 项目数据仓库接口
 * 定义项目相关的数据访问操作
 */
export interface IProjectRepository {
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
/**
 * 章节数据仓库接口
 * 定义章节相关的数据访问操作
 */
export interface IChapterRepository {
    create(input: CreateChapterInput): Promise<Chapter>;
    findById(id: string): Promise<Chapter | null>;
    findByProjectId(projectId: string): Promise<Chapter[]>;
    findAll(): Promise<Chapter[]>;
    update(id: string, input: UpdateChapterInput): Promise<Chapter | null>;
    delete(id: string): Promise<boolean>;
    createMany(inputs: CreateChapterInput[]): Promise<BatchOperationResult<Chapter>>;
    updateMany(updates: {
        id: string;
        input: UpdateChapterInput;
    }[]): Promise<BatchOperationResult<Chapter>>;
    deleteMany(ids: string[]): Promise<BatchOperationResult<boolean>>;
    reorder(projectId: string, chapterIds: string[]): Promise<Chapter[]>;
    moveChapter(chapterId: string, newOrder: number): Promise<Chapter | null>;
    search(query: string, filters?: {
        projectId?: string;
        status?: Chapter['status'];
    }): Promise<Chapter[]>;
    updateAIGeneration(chapterId: string, aiGeneration: Chapter['aiGeneration']): Promise<Chapter | null>;
    getAIGeneratedChapters(projectId: string): Promise<Chapter[]>;
    updateWordCount(chapterId: string): Promise<Chapter | null>;
    getChaptersByCharacter(characterId: string): Promise<Chapter[]>;
    getChaptersByPlotPoint(plotType: 'conflict' | 'resolution' | 'revelation' | 'cliffhanger'): Promise<Chapter[]>;
}
/**
 * 文集数据仓库接口
 * 定义文集相关的数据访问操作
 */
export interface ICollectionRepository {
    create(input: {
        name: string;
        description?: string;
        tags?: string[];
    }): Promise<Collection>;
    findById(id: string): Promise<Collection | null>;
    findAll(): Promise<Collection[]>;
    update(id: string, input: Partial<Omit<Collection, 'id' | 'createdAt'>>): Promise<Collection | null>;
    delete(id: string): Promise<boolean>;
    search(query: string): Promise<Collection[]>;
    getProjectCount(collectionId: string): Promise<number>;
}
/**
 * AI任务数据仓库接口
 * 定义AI生成任务相关的数据访问操作
 */
export interface IAITaskRepository {
    create(task: Omit<AIGenerationTask, 'id' | 'createdAt'>): Promise<AIGenerationTask>;
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
/**
 * 模板数据仓库接口
 * 定义小说模板相关的数据访问操作
 */
export interface ITemplateRepository {
    create(template: Omit<NovelTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<NovelTemplate>;
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
/**
 * 一致性检查数据仓库接口
 * 定义一致性检查结果相关的数据访问操作
 */
export interface IConsistencyRepository {
    create(result: Omit<ConsistencyCheckResult, 'id'>): Promise<ConsistencyCheckResult>;
    findById(id: string): Promise<ConsistencyCheckResult | null>;
    findByTargetId(targetId: string): Promise<ConsistencyCheckResult[]>;
    findAll(): Promise<ConsistencyCheckResult[]>;
    delete(id: string): Promise<boolean>;
    findByTargetType(type: ConsistencyCheckResult['target']['type']): Promise<ConsistencyCheckResult[]>;
    findByScoreRange(minScore: number, maxScore: number): Promise<ConsistencyCheckResult[]>;
    findRecentChecks(days: number): Promise<ConsistencyCheckResult[]>;
    deleteOldResults(olderThanDays: number): Promise<number>;
}
/**
 * 进度追踪数据仓库接口
 * 定义写作进度相关的数据访问操作
 */
export interface IProgressRepository {
    create(progress: Omit<WritingProgress, 'id'>): Promise<WritingProgress>;
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
/**
 * 数据仓库管理器接口
 * 统一管理所有数据仓库的初始化和访问
 */
export interface IRepositoryManager {
    initialize(): Promise<void>;
    readonly projects: IProjectRepository;
    readonly chapters: IChapterRepository;
    readonly collections: ICollectionRepository;
    readonly aiTasks: IAITaskRepository;
    readonly templates: ITemplateRepository;
    readonly consistency: IConsistencyRepository;
    readonly progress: IProgressRepository;
    transaction?<T>(fn: (repos: IRepositoryManager) => Promise<T>): Promise<T>;
    backup?(): Promise<string>;
    restore?(backupData: string): Promise<void>;
    healthCheck(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        details: Record<string, any>;
    }>;
}
//# sourceMappingURL=interfaces.d.ts.map