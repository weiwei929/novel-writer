import { Request, Response, NextFunction } from 'express';
import { ApiErrorCode } from '../types/api.js';
/**
 * 自定义API错误类
 */
export declare class ApiError extends Error {
    code: ApiErrorCode | string;
    statusCode: number;
    details?: any;
    constructor(code: ApiErrorCode | string, message: string, statusCode?: number, details?: any);
}
/**
 * 异步路由错误处理包装器
 */
export declare function asyncHandler(fn: Function): (req: Request, res: Response, next: NextFunction) => void;
/**
 * 全局错误处理中间件
 */
export declare function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void;
/**
 * 404处理中间件
 */
export declare function notFoundHandler(req: Request, res: Response): void;
/**
 * 请求日志中间件
 */
export declare function requestLogger(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=errorHandler.d.ts.map