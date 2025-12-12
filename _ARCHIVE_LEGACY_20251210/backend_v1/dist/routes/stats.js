import express from 'express';
import { db } from '../services/database.js';
const router = express.Router();
/**
 * 获取数据库统计信息
 * GET /api/v1/stats
 */
router.get('/', async (req, res) => {
    try {
        const stats = await db.getStats();
        const response = {
            success: true,
            data: stats
        };
        res.json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: {
                code: 'DATABASE_ERROR',
                message: error instanceof Error ? error.message : 'Failed to fetch statistics'
            }
        };
        res.status(500).json(response);
    }
});
export default router;
//# sourceMappingURL=stats.js.map