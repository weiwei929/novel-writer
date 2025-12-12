import { Project, Chapter, Collection, CreateProjectInput, UpdateProjectInput, CreateChapterInput, UpdateChapterInput, AIGenerationTask, NovelTemplate } from '../types/index.js';
export declare class ApplicationService {
    private repositoryManager;
    private initialized;
    constructor(dataPath?: string);
    initialize(): Promise<void>;
    private ensureInitialized;
    getCollections(): Promise<Collection[]>;
    getCollection(id: string): Promise<Collection | null>;
    createCollection(data: {
        name: string;
        description?: string;
        tags?: string[];
    }): Promise<Collection>;
    updateCollection(id: string, updates: Partial<Omit<Collection, 'id' | 'createdAt'>>): Promise<Collection | null>;
    deleteCollection(id: string): Promise<boolean>;
    searchCollections(query: string): Promise<Collection[]>;
    getProjects(collectionId?: string): Promise<Project[]>;
    getProject(id: string): Promise<Project | null>;
    createProject(data: CreateProjectInput): Promise<Project>;
    updateProject(id: string, updates: UpdateProjectInput): Promise<Project | null>;
    deleteProject(id: string): Promise<boolean>;
    searchProjects(query: string): Promise<Project[]>;
    getProjectsByGenre(genres: string[]): Promise<Project[]>;
    getProjectsByStatus(status: Project['status']): Promise<Project[]>;
    getChapters(projectId: string): Promise<Chapter[]>;
    getChapter(id: string): Promise<Chapter | null>;
    createChapter(data: CreateChapterInput): Promise<Chapter>;
    updateChapter(id: string, updates: UpdateChapterInput): Promise<Chapter | null>;
    deleteChapter(id: string): Promise<boolean>;
    reorderChapters(projectId: string, chapterIds: string[]): Promise<Chapter[]>;
    getChaptersByStatus(projectId: string, status: Chapter['status']): Promise<Chapter[]>;
    createAITask(task: Omit<AIGenerationTask, 'id' | 'createdAt'>): Promise<AIGenerationTask>;
    getAITask(id: string): Promise<AIGenerationTask | null>;
    getAITasksByProject(projectId: string): Promise<AIGenerationTask[]>;
    updateAITask(id: string, updates: Partial<AIGenerationTask>): Promise<AIGenerationTask | null>;
    getPendingAITasks(): Promise<AIGenerationTask[]>;
    getTemplates(): Promise<NovelTemplate[]>;
    getTemplate(id: string): Promise<NovelTemplate | null>;
    createTemplate(templateData: Omit<NovelTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<NovelTemplate>;
    getProjectStatistics(): Promise<{
        totalProjects: number;
        totalChapters: number;
        totalWords: number;
        activeProjects: number;
        completedProjects: number;
    }>;
    getCollectionStatistics(collectionId: string): Promise<{
        projectCount: number;
        totalWords: number;
        totalChapters: number;
        lastUpdated: string;
    } | null>;
    healthCheck(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        details: Record<string, any>;
    }>;
    backup(): Promise<string>;
    restore(backupData: string): Promise<void>;
    transaction<T>(fn: (service: ApplicationService) => Promise<T>): Promise<T>;
    batchCreateProjects(projects: CreateProjectInput[]): Promise<Project[]>;
    batchCreateChapters(chapters: CreateChapterInput[]): Promise<Chapter[]>;
    init(): Promise<void>;
}
export declare const applicationService: ApplicationService;
export declare const db: {
    init: () => Promise<void>;
    getCollections: () => Promise<Collection[]>;
    getCollection: (id: string) => Promise<Collection | null>;
    createCollection: (data: any) => Promise<Collection>;
    updateCollection: (id: string, updates: any) => Promise<Collection | null>;
    deleteCollection: (id: string) => Promise<boolean>;
    getProjects: (collectionId?: string) => Promise<Project[]>;
    getProject: (id: string) => Promise<Project | null>;
    createProject: (data: any) => Promise<Project>;
    updateProject: (id: string, updates: any) => Promise<Project | null>;
    deleteProject: (id: string) => Promise<boolean>;
    getChapters: (projectId: string) => Promise<Chapter[]>;
    getChapter: (id: string) => Promise<Chapter | null>;
    createChapter: (data: any) => Promise<Chapter>;
    updateChapter: (id: string, updates: any) => Promise<Chapter | null>;
    deleteChapter: (id: string) => Promise<boolean>;
    healthCheck: () => Promise<{
        status: "healthy" | "degraded" | "unhealthy";
        details: Record<string, any>;
    }>;
};
//# sourceMappingURL=applicationService.d.ts.map