import express from 'express';
import * as taController from '../../controllers/admin/teachingAssignment.controller.js';
import roleMiddleware from '../../middlewares/role.middleware.js';
import authMiddleware from '../../middlewares/auth.middleware.js';

const router = express.Router();
router.use(authMiddleware);
router.use(roleMiddleware('ADMIN'));

router.post('/', taController.createTeachingAssignment);
router.get('/', taController.getAllTeachingAssignments);
router.get('/:id', taController.getTeachingAssignmentById);
router.delete('/:id', taController.deleteTeachingAssignment);

export default router;
