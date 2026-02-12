import express from 'express';
import * as subjectController from '../../controllers/admin/subject.controller.js';
import roleMiddleware from '../../middlewares/role.middleware.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import { upload } from '../../utils/multer.utils.js';

const router = express.Router();
router.use(authMiddleware);
router.use(roleMiddleware('ADMIN'));

router.post('/', subjectController.createSubject);
router.post('/bulk', upload.single('file'), subjectController.bulkCreateSubjects);
router.get('/', subjectController.getAllSubjects);
router.get('/:id', subjectController.getSubjectById);
router.patch('/:id', subjectController.updateSubject);
router.delete('/:id', subjectController.deleteSubject);

export default router;
