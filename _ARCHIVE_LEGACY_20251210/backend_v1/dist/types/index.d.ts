/**
 * 文集 - 多个小说项目的容器
 */
export interface Collection {
    id: string;
    name: string;
    description?: string;
    tags: string[];
    coverImage?: string;
    createdAt: string;
    updatedAt: string;
    projectCount: number;
    metadata?: {
        author?: string;
        category?: string;
        isPublic?: boolean;
        [key: string]: any;
    };
}
/**
 * 小说项目
 */
export interface Project {
    id: string;
    collectionId: string;
    title: string;
    description?: string;
    author: string;
    genre: string[];
    tags: string[];
    status: 'draft' | 'writing' | 'completed' | 'published' | 'archived';
    coverImage?: string;
    wordCount: number;
    chapterCount: number;
    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
    completedAt?: string;
    settings?: {
        worldBuilding?: string;
        characterNotes?: string;
        plotOutline?: string;
        timeline?: TimelineEvent[];
        characters?: Character[];
    };
    publishInfo?: {
        platform?: string;
        url?: string;
        revenue?: number;
        readers?: number;
    };
    metadata?: {
        targetWordCount?: number;
        expectedChapters?: number;
        isAdultContent?: boolean;
        [key: string]: any;
    };
}
/**
 * 章节内容
 */
export interface Chapter {
    id: string;
    projectId: string;
    title: string;
    content: string;
    order: number;
    wordCount: number;
    status: 'draft' | 'writing' | 'completed' | 'published';
    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
    notes?: string;
    tags?: string[];
    aiPrompts?: {
        characterPrompt?: string;
        scenePrompt?: string;
        plotPrompt?: string;
    };
    metadata?: {
        isAdultContent?: boolean;
        triggerWarnings?: string[];
        [key: string]: any;
    };
}
/**
 * 人物角色
 */
export interface Character {
    id: string;
    projectId: string;
    name: string;
    description: string;
    avatar?: string;
    age?: number;
    gender?: string;
    occupation?: string;
    appearance?: {
        height?: string;
        build?: string;
        hairColor?: string;
        eyeColor?: string;
        distinguishingMarks?: string;
    };
    personality?: {
        traits?: string[];
        motivations?: string[];
        fears?: string[];
        quirks?: string[];
    };
    background?: {
        birthplace?: string;
        family?: string;
        education?: string;
        history?: string;
    };
    relationships?: {
        characterId: string;
        relationship: string;
        description?: string;
    }[];
    createdAt: string;
    updatedAt: string;
    metadata?: {
        importance: 'main' | 'supporting' | 'minor';
        firstAppearance?: string;
        [key: string]: any;
    };
}
/**
 * 时间线事件
 */
export interface TimelineEvent {
    id: string;
    projectId: string;
    title: string;
    description: string;
    date: string;
    type: 'plot' | 'character' | 'world' | 'other';
    relatedCharacters?: string[];
    relatedChapters?: string[];
    createdAt: string;
    updatedAt: string;
    metadata?: {
        importance: 'high' | 'medium' | 'low';
        [key: string]: any;
    };
}
/**
 * 媒体文件
 */
export interface MediaFile {
    id: string;
    projectId?: string;
    collectionId?: string;
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    path: string;
    url: string;
    type: 'image' | 'video' | 'audio' | 'document' | 'other';
    tags?: string[];
    description?: string;
    dimensions?: {
        width: number;
        height: number;
    };
    createdAt: string;
    updatedAt: string;
    metadata?: {
        [key: string]: any;
    };
}
/**
 * 备份记录
 */
export interface Backup {
    id: string;
    name: string;
    description?: string;
    type: 'manual' | 'automatic' | 'scheduled';
    scope: 'full' | 'collections' | 'projects' | 'media';
    filePath: string;
    fileSize: number;
    includedCollections?: string[];
    includedProjects?: string[];
    createdAt: string;
    metadata?: {
        version?: string;
        checksum?: string;
        [key: string]: any;
    };
}
/**
 * 数据库结构
 */
export interface DatabaseSchema {
    collections: Collection[];
    projects: Project[];
    chapters: Chapter[];
    characters: Character[];
    timeline: TimelineEvent[];
    media: MediaFile[];
    backups: Backup[];
    metadata: {
        version: string;
        createdAt: string;
        updatedAt: string;
        lastBackup?: string;
    };
}
/**
 * API响应结构
 */
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    pagination?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
    metadata?: {
        timestamp: string;
        version: string;
        [key: string]: any;
    };
}
/**
 * 查询参数
 */
export interface QueryParams {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
    search?: string;
    filter?: Record<string, any>;
}
export * from './version.js';
//# sourceMappingURL=index.d.ts.map