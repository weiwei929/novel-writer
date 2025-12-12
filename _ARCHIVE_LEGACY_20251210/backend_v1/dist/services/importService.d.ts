/**
 * 数据导入服务
 * 支持从多种格式导入数据到系统中
 */
export interface CreateCollectionData {
    name: string;
    description?: string;
    tags?: string[];
}
export interface CreateProjectData {
    title: string;
    description?: string;
    author: string;
    genre?: string[];
    tags?: string[];
    status?: string;
    collectionId?: string;
    settings?: any;
}
export interface CreateChapterData {
    title: string;
    content?: string;
    projectId: string;
    order?: number;
}
export interface ImportOptions {
    mergeStrategy?: 'replace' | 'merge' | 'skip';
    createNewCollection?: boolean;
    targetCollectionId?: string;
    preserveIds?: boolean;
    validateContent?: boolean;
}
export interface ImportResult {
    success: boolean;
    data?: {
        collections?: number;
        projects?: number;
        chapters?: number;
    };
    errors?: string[];
    warnings?: string[];
}
export interface ParsedContent {
    title: string;
    content: string;
    chapters?: {
        title: string;
        content: string;
        order?: number;
    }[];
    author?: string;
    description?: string;
    metadata?: Record<string, any>;
}
declare class ImportService {
    private uploadDir;
    constructor();
    /**
     * 确保上传目录存在
     */
    private ensureUploadDirectory;
    /**
     * 从文件导入数据
     */
    importFromFile(filePath: string, options?: ImportOptions): Promise<ImportResult>;
    /**
     * 批量导入多个文件
     */
    importMultipleFiles(filePaths: string[], options?: ImportOptions): Promise<ImportResult>;
    /**
     * 解析JSON文件
     */
    private parseJSON;
    /**
     * 解析TXT文件
     */
    private parseTXT;
    /**
     * 解析Markdown文件
     */
    private parseMarkdown;
    /**
     * 解析Word文档
     */
    private parseWord;
    /**
     * 将文本分割为章节
     */
    private splitIntoChapters;
    /**
     * 验证内容
     */
    private validateContent;
    /**
     * 导入到数据库
     */
    private importToDatabase;
    /**
     * 从备份恢复数据
     */
    restoreFromBackup(backupPath: string): Promise<ImportResult>;
    /**
     * 清理上传文件
     */
    cleanupUploads(maxAge?: number): Promise<void>;
}
export declare const importService: ImportService;
export { ImportService };
//# sourceMappingURL=importService.d.ts.map