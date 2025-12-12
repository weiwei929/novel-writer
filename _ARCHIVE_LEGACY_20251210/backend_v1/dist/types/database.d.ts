/**
 * 数据库类型定义
 */
export interface BaseEntity {
    id: string;
    createdAt: string;
    updatedAt: string;
}
export interface Collection extends BaseEntity {
    name: string;
    description?: string;
    cover?: string;
    tags: string[];
    isPublic: boolean;
    projectCount: number;
}
export declare enum ProjectStatus {
    DRAFT = "draft",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    PAUSED = "paused",
    ARCHIVED = "archived"
}
export interface Chapter extends BaseEntity {
    title: string;
    content: string;
    wordCount: number;
    order: number;
    projectId: string;
}
export interface Project extends BaseEntity {
    title: string;
    description?: string;
    cover?: string;
    author: string;
    genre: string[];
    tags: string[];
    status: ProjectStatus;
    collectionId?: string;
    totalWordCount: number;
    chapterCount: number;
    lastChapterId?: string;
    outline?: string;
    characters: Character[];
    settings: ProjectSettings;
}
export interface Character extends BaseEntity {
    name: string;
    description: string;
    avatar?: string;
    role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
    traits: string[];
    relationships: CharacterRelationship[];
}
export interface CharacterRelationship {
    targetCharacterId: string;
    relationshipType: string;
    description?: string;
}
export interface ProjectSettings {
    autoSave: boolean;
    autoSaveInterval: number;
    backupEnabled: boolean;
    writingGoal?: {
        dailyWords?: number;
        targetWordCount?: number;
        deadline?: string;
    };
}
export interface MediaFile extends BaseEntity {
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    path: string;
    projectId?: string;
    collectionId?: string;
    tags: string[];
}
export interface BackupRecord extends BaseEntity {
    filename: string;
    path: string;
    size: number;
    type: 'full' | 'incremental';
    description?: string;
}
export interface DatabaseSchema {
    collections: Collection[];
    projects: Project[];
    chapters: Chapter[];
    mediaFiles: MediaFile[];
    backups: BackupRecord[];
    metadata: {
        version: string;
        lastBackup?: string;
        totalProjects: number;
        totalCollections: number;
    };
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface QueryParams {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: Record<string, any>;
}
//# sourceMappingURL=database.d.ts.map