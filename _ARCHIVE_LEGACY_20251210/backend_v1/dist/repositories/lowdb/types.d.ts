import { Project, Chapter, Collection, NovelTemplate, AIGenerationTask, ConsistencyCheckResult, WritingProgress } from '../../types/index.js';
export interface DatabaseData {
    collections: Collection[];
    projects: Project[];
    chapters: Chapter[];
    aiTasks: AIGenerationTask[];
    templates: NovelTemplate[];
    consistencyResults: ConsistencyCheckResult[];
    progress: WritingProgress[];
    metadata: {
        version: string;
        createdAt: string;
        lastMigration?: string;
    };
}
export declare const createDefaultData: () => DatabaseData;
//# sourceMappingURL=types.d.ts.map