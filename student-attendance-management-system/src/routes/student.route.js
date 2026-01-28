import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import roleMiddleware from '../middlewares/role.middleware.js';
import {
    getMyAttendance,
    getMyAttendanceSummary,
    getMySubjects,
    getMySection,
} from '../controllers/student.controller.js';

const router = express.Router();

// All routes require authentication and student role (Admin can also access)
router.use(authMiddleware);
router.use(roleMiddleware('STUDENT', 'ADMIN'));

/* =====================================================
   ATTENDANCE
===================================================== */
router.get('/attendance', getMyAttendance); // GET /api/student/attendance?subject_id=xxx&start_date=xxx&end_date=xxx
router.get('/attendance/summary', getMyAttendanceSummary);

/* =====================================================
   SUBJECTS & SECTION
===================================================== */
router.get('/subjects', getMySubjects);
router.get('/section', getMySection);

export default router;
