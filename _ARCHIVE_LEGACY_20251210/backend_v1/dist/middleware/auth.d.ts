/**
 * 单用户认证中间件
 * 专为个人使用设计的轻量级安全验证
 */
import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            isAuthenticated?: boolean;
            sessionId?: string;
        }
    }
}
/**
 * 应用启动密码验证
 */
export declare const requireAuth: (req: Request, res: Response, next: NextFunction) => void;
export declare const authenticateApp: (req: Request, res: Response, next: NextFunction) => void;
/**
 * 敏感操作验证中间件
 */
export declare const requireConfirmation: (operation: "delete" | "export" | "import") => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
/**
 * 登录处理
 */
export declare const handleLogin: (req: Request, res: Response) => Response<any, Record<string, any>> | undefined;
/**
 * 登出处理
 */
export declare const handleLogout: (req: Request, res: Response) => void;
/**
 * 获取认证状态
 */
export declare const getAuthStatus: (req: Request, res: Response) => Response<any, Record<string, any>> | undefined;
/**
 * 清理过期会话 (定时任务)
 */
export declare const cleanupSessions: () => void;
//# sourceMappingURL=auth.d.ts.map