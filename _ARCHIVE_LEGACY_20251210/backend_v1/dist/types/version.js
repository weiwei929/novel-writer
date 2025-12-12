// 版本管理类型定义
/**
 * 版本类型枚举
 */
export var VersionType;
(function (VersionType) {
    VersionType["AUTO"] = "auto";
    VersionType["MANUAL"] = "manual";
    VersionType["MILESTONE"] = "milestone";
    VersionType["SNAPSHOT"] = "snapshot"; // 快照版本
})(VersionType || (VersionType = {}));
/**
 * 版本状态枚举
 */
export var VersionStatus;
(function (VersionStatus) {
    VersionStatus["ACTIVE"] = "active";
    VersionStatus["ARCHIVED"] = "archived";
    VersionStatus["DELETED"] = "deleted"; // 已删除（软删除）
})(VersionStatus || (VersionStatus = {}));
//# sourceMappingURL=version.js.map