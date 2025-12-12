/**
 * 数据库类型定义
 */
// 项目状态枚举
export var ProjectStatus;
(function (ProjectStatus) {
    ProjectStatus["DRAFT"] = "draft";
    ProjectStatus["IN_PROGRESS"] = "in_progress";
    ProjectStatus["COMPLETED"] = "completed";
    ProjectStatus["PAUSED"] = "paused";
    ProjectStatus["ARCHIVED"] = "archived";
})(ProjectStatus || (ProjectStatus = {}));
//# sourceMappingURL=database.js.map