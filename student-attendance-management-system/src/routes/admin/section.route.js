import express from 'express';
import {
    createSection,
    getAllSections,
    getSectionById,
    updateSection,
    deleteSection,
    promoteSemester,
} from '../../controllers/admin/section.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import roleMiddleware from '../../middlewares/role.middleware.js';

const router = express.Router();

// Admin only
router.use(authMiddleware);
router.use(roleMiddleware('ADMIN'));

/* ---------- CRUD ---------- */
router.post('/', createSection);
router.get('/', getAllSections);
router.get('/:id', getSectionById);
router.put('/:id', updateSection);
router.delete('/:id', deleteSection);

/* ---------- PROMOTION ---------- */
router.post('/promote', promoteSemester);

export default router;
