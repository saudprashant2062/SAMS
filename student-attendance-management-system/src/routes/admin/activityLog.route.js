import express from 'express';
import * as activityLogController from '../../controllers/admin/activityLog.controller.js';
import roleMiddleware from '../../middlewares/role.middleware.js';
import authMiddleware from '../../middlewares/auth.middleware.js';

const router = express.Router();
router.use(authMiddleware);
router.use(roleMiddleware('ADMIN'));

router.get('/', activityLogController.getRecentActivities);
router.get('/all', activityLogController.getAllActivities);

export default router;
