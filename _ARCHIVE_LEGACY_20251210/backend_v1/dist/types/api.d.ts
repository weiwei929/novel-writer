/**
 * 统一API响应格式
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
 * API错误码枚举
 */
export declare enum ApiErrorCode {
    VALIDATION_ERROR = "VALIDATION_ERROR",
    INVALID_INPUT = "INVALID_INPUT",
    MISSING_PARAMETER = "MISSING_PARAMETER",
    UNAUTHORIZED = "UNAUTHORIZED",
    FORBIDDEN = "FORBIDDEN",
    TOKEN_EXPIRED = "TOKEN_EXPIRED",
    NOT_FOUND = "NOT_FOUND",
    RESOURCE_EXISTS = "RESOURCE_EXISTS",
    RESOURCE_CONFLICT = "RESOURCE_CONFLICT",
    DATABASE_ERROR = "DATABASE_ERROR",
    DATABASE_CONNECTION_ERROR = "DATABASE_CONNECTION_ERROR",
    BUSINESS_LOGIC_ERROR = "BUSINESS_LOGIC_ERROR",
    OPERATION_NOT_ALLOWED = "OPERATION_NOT_ALLOWED",
    INTERNAL_ERROR = "INTERNAL_ERROR",
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
    TIMEOUT_ERROR = "TIMEOUT_ERROR"
}
/**
 * 分页请求参数
 */
export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
/**
 * 创建成功响应
 */
export declare function createSuccessResponse<T>(data: T, metadata?: Record<string, any>, pagination?: ApiResponse<T>['pagination']): ApiResponse<T>;
/**
 * 创建错误响应
 */
export declare function createErrorResponse(code: ApiErrorCode | string, message: string, details?: any, metadata?: Record<string, any>): ApiResponse;
/**
 * HTTP状态码映射
 */
export declare const HttpStatusCode: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly NO_CONTENT: 204;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly CONFLICT: 409;
    readonly INTERNAL_SERVER_ERROR: 500;
    readonly SERVICE_UNAVAILABLE: 503;
};
/**
 * 错误码与HTTP状态码映射
 */
export declare const ErrorCodeToHttpStatus: Record<string, number>;
//# sourceMappingURL=api.d.ts.map