/**
 * 数据导出服务
 * 支持多种格式的项目数据导出
 */
export interface ExportOptions {
    format: 'word' | 'pdf' | 'txt' | 'markdown' | 'json' | 'zip';
    includeMetadata?: boolean;
    splitByChapter?: boolean;
    includeCollectionInfo?: boolean;
}
export interface ExportResult {
    success: boolean;
    filePath?: string;
    fileName?: string;
    size?: number;
    error?: string;
}
declare class ExportService {
    private exportDir;
    constructor();
    /**
     * 确保导出目录存在
     */
    private ensureExportDirectory;
    /**
     * 导出单个项目
     */
    exportProject(projectId: string, options: ExportOptions): Promise<ExportResult>;
    /**
     * 导出文集
     */
    exportCollection(collectionId: string, options: ExportOptions): Promise<ExportResult>;
    /**
     * 导出为Word文档
     */
    private exportToWord;
    /**
     * 导出为PDF
     */
    private exportToPDF;
    /**
     * 导出为TXT
     */
    private exportToTXT;
    /**
     * 导出为Markdown
     */
    private exportToMarkdown;
    /**
     * 导出为JSON
     */
    private exportToJSON;
    /**
     * 导出为ZIP压缩包
     */
    private exportToZip;
    /**
     * 导出文集为ZIP
     */
    private exportCollectionToZip;
    /**
     * 辅助方法：计算字数
     */
    private calculateWordCount;
    /**
     * 辅助方法：生成HTML内容
     */
    private generateHTML;
    /**
     * 辅助方法：生成TXT内容
     */
    private generateTXTContent;
    /**
     * 辅助方法：生成Markdown内容
     */
    private generateMarkdownContent;
    /**
     * 辅助方法：生成项目完整内容
     */
    private generateProjectFullContent;
    /**
     * 辅助方法：URL友好的slug生成
     */
    private slugify;
    /**
     * 辅助方法：文件名安全化
     */
    private sanitizeFileName;
    /**
     * 清理导出目录
     */
    cleanupExports(maxAge?: number): Promise<void>;
}
export declare const exportService: ExportService;
export { ExportService };
//# sourceMappingURL=exportService.d.ts.map