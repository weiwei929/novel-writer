import fileUpload from 'express-fileupload';
declare global {
    namespace Express {
        interface Request {
            files?: fileUpload.FileArray;
        }
    }
}
declare const router: import("express-serve-static-core").Router;
export default router;
//# sourceMappingURL=fileRoutes.d.ts.map