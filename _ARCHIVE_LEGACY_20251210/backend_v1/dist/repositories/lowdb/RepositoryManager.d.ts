import { IRepositoryManager } from '../interfaces.js';
import { LowDBProjectRepository } from './ProjectRepository.js';
import { LowDBChapterRepository } from './ChapterRepository.js';
import { LowDBAITaskRepository } from './AITaskRepository.js';
import { LowDBCollectionRepository } from './CollectionRepository.js';
import { LowDBTemplateRepository, LowDBConsistencyRepository, LowDBProgressRepository } from './AdditionalRepositories.js';
export declare class LowDBRepositoryManager implements IRepositoryManager {
    private db?;
    private readonly dataPath;
    private _projects?;
    private _chapters?;
    private _collections?;
    private _aiTasks?;
    private _templates?;
    private _consistency?;
    private _progress?;
    constructor(dataPath?: string);
    initialize(): Promise<void>;
    get projects(): LowDBProjectRepository;
    get chapters(): LowDBChapterRepository;
    get collections(): LowDBCollectionRepository;
    get aiTasks(): LowDBAITaskRepository;
    get templates(): LowDBTemplateRepository;
    get consistency(): LowDBConsistencyRepository;
    get progress(): LowDBProgressRepository;
    private performMigrations;
    private compareVersions;
    backup(): Promise<string>;
    restore(backupData: string): Promise<void>;
    healthCheck(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        details: Record<string, any>;
    }>;
    transaction<T>(fn: (repos: IRepositoryManager) => Promise<T>): Promise<T>;
}
//# sourceMappingURL=RepositoryManager.d.ts.map