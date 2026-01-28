import express from 'express';
import * as semesterController from '../../controllers/admin/semester.controller.js';
import roleMiddleware from '../../middlewares/role.middleware.js';
import authMiddleware from '../../middlewares/auth.middleware.js';

const router = express.Router();
router.use(authMiddleware);
router.use(roleMiddleware('ADMIN'));

router.post('/', semesterController.createSemester);
router.get('/', semesterController.getAllSemesters);
router.get('/:id', semesterController.getSemesterById);
router.patch('/:id', semesterController.updateSemester);
router.delete('/:id', semesterController.deleteSemester);

export default router;
