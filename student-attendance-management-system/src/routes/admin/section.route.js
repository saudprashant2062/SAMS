import express from 'express';
import {
    createSection,
    getAllSections,
    getSectionById,
    updateSection,
    deleteSection,
    promoteSemester,
    archiveSection,
    restoreSection,
    getArchivedSections,
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
router.get('/archived', getArchivedSections);
router.get('/:id', getSectionById);
router.put('/:id', updateSection);
router.delete('/:id', deleteSection);

/* ---------- ARCHIVE/RESTORE ---------- */
router.post('/:id/archive', archiveSection);
router.post('/:id/restore', restoreSection);

/* ---------- PROMOTION ---------- */
router.post('/promote', promoteSemester);

export default router;
