import express from 'express';
import * as departmentController from '../../controllers/admin/department.controller.js';
import roleMiddleware from '../../middlewares/role.middleware.js';
import authMiddleware from '../../middlewares/auth.middleware.js';

const router = express.Router();
router.use(authMiddleware);
router.use(roleMiddleware('ADMIN'));

router.post('/', departmentController.createDepartment);
router.get('/', departmentController.getAllDepartments);
router.get('/:id', departmentController.getDepartmentById);
router.patch('/:id', departmentController.updateDepartment);
router.delete('/:id', departmentController.deleteDepartment);

export default router;