import { ProjectVersion, VersionComparison, CreateVersionRequest, UpdateVersionRequest, RestoreVersionRequest, VersionListQuery, VersionListResponse, VersionOperationResponse } from '../types/index.js';
import DatabaseService from './database.js';
/**
 * 版本管理服务
 */
export declare class VersionManagementService {
    private dbService;
    private versionsDir;
    constructor(dbService: DatabaseService);
    /**
     * 确保版本目录存在
     */
    private ensureVersionsDirectory;
    /**
     * 生成版本号（时间戳格式：YYYYMMDD-HHMMSS）
     */
    private generateVersionNumber;
    /**
     * 创建项目快照
     */
    private createProjectSnapshot;
    /**
     * 计算版本统计信息
     */
    private calculateVersionStats;
    /**
     * 保存版本数据到文件
     */
    private saveVersionData;
    /**
     * 从文件加载版本数据
     */
    private loadVersionData;
    /**
     * 创建新版本
     */
    createVersion(projectId: string, request: CreateVersionRequest): Promise<VersionOperationResponse>;
    /**
     * 获取单个版本
     */
    getVersion(versionId: string): Promise<ProjectVersion | null>;
    /**
     * 获取版本列表
     */
    getVersions(projectId: string, query?: VersionListQuery): Promise<VersionListResponse>;
    /**
     * 更新版本信息
     */
    updateVersion(versionId: string, request: UpdateVersionRequest): Promise<VersionOperationResponse>;
    /**
     * 删除版本（软删除）
     */
    deleteVersion(versionId: string): Promise<VersionOperationResponse>;
    /**
     * 恢复到指定版本
     */
    restoreVersion(projectId: string, versionId: string, request: RestoreVersionRequest): Promise<VersionOperationResponse>;
    /**
     * 比较两个版本
     */
    compareVersions(sourceVersionId: string, targetVersionId: string): Promise<VersionComparison | null>;
    /**
     * 清理过期版本
     */
    cleanupOldVersions(projectId: string, keepCount?: number): Promise<VersionOperationResponse>;
    /**
     * 获取版本统计信息
     */
    getVersionStatistics(projectId: string): Promise<any>;
}
//# sourceMappingURL=versionManagementService.d.ts.map