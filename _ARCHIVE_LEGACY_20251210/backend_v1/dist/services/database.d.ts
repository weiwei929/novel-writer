import { Collection, Project, Chapter } from '../types/index.js';
import { MetadataItem, SavedVersion } from '../types/metadata.js';
declare class DatabaseService {
    private db?;
    private readonly dataPath;
    private createDefaultMetadataItem;
    private ensureProjectMetadata;
    private ensureChapterMetadata;
    constructor(dataPath?: string);
    init(): Promise<void>;
    createCollection(data: {
        name: string;
        description?: string;
        tags?: string[];
    }): Promise<Collection>;
    getCollections(): Promise<Collection[]>;
    getCollectionById(id: string): Promise<Collection | null>;
    updateCollection(id: string, updates: Partial<Collection>): Promise<Collection | null>;
    deleteCollection(id: string): Promise<boolean>;
    createProject(data: {
        title: string;
        description?: string;
        author: string;
        genre?: string[];
        tags?: string[];
        status?: string;
        collectionId?: string;
    }): Promise<Project>;
    getProjects(collectionId?: string): Promise<Project[]>;
    getProjectById(id: string): Promise<Project | null>;
    updateProject(id: string, updates: Partial<Project>): Promise<Project | null>;
    deleteProject(id: string): Promise<boolean>;
    createChapter(data: {
        title: string;
        content?: string;
        projectId: string;
        order?: number;
    }): Promise<Chapter>;
    getChapters(projectId: string): Promise<Chapter[]>;
    getChapterById(id: string): Promise<Chapter | null>;
    updateChapter(id: string, updates: Partial<Chapter>): Promise<Chapter | null>;
    deleteChapter(id: string): Promise<boolean>;
    search(query: string, type?: 'collections' | 'projects' | 'chapters'): Promise<any>;
    getStats(): Promise<{
        collections: number;
        projects: number;
        chapters: number;
        totalWords: number;
        lastUpdated: string;
    }>;
    private isAllowedField;
    updateProjectChapterPlanning(projectId: string, plans: any[]): Promise<any>;
    updateProjectMetadataField(projectId: string, field: string, content: string): Promise<MetadataItem>;
    getProjectMetadataVersions(projectId: string, field: string): Promise<SavedVersion[]>;
    getProjectMetadataField(projectId: string, field: string): Promise<MetadataItem>;
    saveProjectMetadataVersion(projectId: string, field: string, content: string, userNote?: string, autoSaved?: boolean): Promise<SavedVersion>;
    updateChapterMetadataField(chapterId: string, field: string, content: string): Promise<MetadataItem>;
    getChapterMetadataVersions(chapterId: string, field: string): Promise<SavedVersion[]>;
    getChapterMetadataField(chapterId: string, field: string): Promise<MetadataItem>;
    saveChapterMetadataVersion(chapterId: string, field: string, content: string, userNote?: string, autoSaved?: boolean): Promise<SavedVersion>;
}
export declare const db: DatabaseService;
export default DatabaseService;
//# sourceMappingURL=database.d.ts.map