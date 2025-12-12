/**
 * 版本类型枚举
 */
export declare enum VersionType {
    AUTO = "auto",// 自动保存版本
    MANUAL = "manual",// 手动保存版本
    MILESTONE = "milestone",// 里程碑版本
    SNAPSHOT = "snapshot"
}
/**
 * 版本状态枚举
 */
export declare enum VersionStatus {
    ACTIVE = "active",// 活跃版本
    ARCHIVED = "archived",// 已归档
    DELETED = "deleted"
}
/**
 * 项目版本接口
 */
export interface ProjectVersion {
    id: string;
    projectId: string;
    versionNumber: string;
    type: VersionType;
    status: VersionStatus;
    title?: string;
    description?: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
    snapshot: ProjectSnapshot;
    stats: VersionStats;
    metadata?: {
        author?: string;
        isPublic?: boolean;
        branchFrom?: string;
        [key: string]: any;
    };
}
/**
 * 项目快照 - 保存项目在某个时间点的完整状态
 */
export interface ProjectSnapshot {
    project: {
        title: string;
        description?: string;
        author: string;
        genre: string[];
        tags: string[];
        status: string;
        settings?: any;
        metadata?: any;
    };
    chapters: ChapterSnapshot[];
    planning?: PlanningSnapshot;
    statistics: {
        totalWordCount: number;
        chapterCount: number;
        lastModified: string;
    };
}
/**
 * 章节快照
 */
export interface ChapterSnapshot {
    id: string;
    title: string;
    content: string;
    order: number;
    wordCount: number;
    status: string;
    notes?: string;
    tags?: string[];
    createdAt: string;
    updatedAt: string;
}
/**
 * 规划数据快照
 */
export interface PlanningSnapshot {
    outline?: string;
    characters?: any[];
    worldBuilding?: string;
    timeline?: any[];
    plotPoints?: any[];
}
/**
 * 版本统计信息
 */
export interface VersionStats {
    totalWords: number;
    chapterCount: number;
    changesSinceLastVersion?: {
        addedWords: number;
        removedWords: number;
        modifiedChapters: number;
        addedChapters: number;
        removedChapters: number;
    };
}
/**
 * 版本比较结果
 */
export interface VersionComparison {
    sourceVersion: string;
    targetVersion: string;
    comparedAt: string;
    summary: {
        totalChanges: number;
        addedWords: number;
        removedWords: number;
        modifiedChapters: number;
        addedChapters: number;
        removedChapters: number;
    };
    changes: VersionChange[];
}
/**
 * 版本变更记录
 */
export interface VersionChange {
    type: 'added' | 'removed' | 'modified';
    section: 'project' | 'chapter' | 'planning';
    targetId?: string;
    targetTitle?: string;
    changes: {
        field: string;
        oldValue?: any;
        newValue?: any;
        wordCountDiff?: number;
    }[];
}
/**
 * 版本创建请求
 */
export interface CreateVersionRequest {
    type: VersionType;
    title?: string;
    description?: string;
    tags?: string[];
    metadata?: Record<string, any>;
}
/**
 * 版本更新请求
 */
export interface UpdateVersionRequest {
    title?: string;
    description?: string;
    tags?: string[];
    status?: VersionStatus;
    metadata?: Record<string, any>;
}
/**
 * 版本恢复请求
 */
export interface RestoreVersionRequest {
    createBackup: boolean;
    backupTitle?: string;
    backupDescription?: string;
}
/**
 * 版本列表查询参数
 */
export interface VersionListQuery {
    page?: number;
    limit?: number;
    type?: VersionType;
    status?: VersionStatus;
    tags?: string[];
    search?: string;
    sortBy?: 'createdAt' | 'updatedAt' | 'versionNumber';
    sortOrder?: 'asc' | 'desc';
}
/**
 * 版本列表响应
 */
export interface VersionListResponse {
    versions: ProjectVersion[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    filters: {
        availableTypes: VersionType[];
        availableStatuses: VersionStatus[];
        availableTags: string[];
    };
}
/**
 * 版本操作响应
 */
export interface VersionOperationResponse {
    success: boolean;
    message: string;
    version?: ProjectVersion;
    data?: any;
}
//# sourceMappingURL=version.d.ts.map