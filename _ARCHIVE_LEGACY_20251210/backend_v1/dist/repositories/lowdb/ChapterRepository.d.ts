import { Low } from 'lowdb';
import { Chapter, CreateChapterInput, UpdateChapterInput, BatchOperationResult } from '../../types/index.js';
import { IChapterRepository } from '../interfaces.js';
import { DatabaseData } from './types.js';
export declare class LowDBChapterRepository implements IChapterRepository {
    private db;
    constructor(db: Low<DatabaseData>);
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
    private calculateWordCount;
    private updateProjectStats;
}
//# sourceMappingURL=ChapterRepository.d.ts.map