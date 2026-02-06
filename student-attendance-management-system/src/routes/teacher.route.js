import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import roleMiddleware from '../middlewares/role.middleware.js';
import {
    getTeacherDashboard,
    getAssignments,
    getTeachingAssignmentById,
    createAttendanceSession,
    markAttendance,
    getAttendanceRecords,
    getAttendanceHistory,
    updateAttendanceSession,
} from '../controllers/teacher.controller.js';

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware('TEACHER', 'ADMIN')); // Admin can also access

/* ---------- DASHBOARD ---------- */
router.get('/dashboard', getTeacherDashboard);

/* ---------- TEACHING ASSIGNMENTS ---------- */
router.get('/assignments', getAssignments);
router.get('/assignments/:id', getTeachingAssignmentById);

/* ---------- ATTENDANCE ---------- */
router.post('/attendance/session', createAttendanceSession);
router.patch('/attendance/session/:id', updateAttendanceSession);
router.post('/attendance/mark', markAttendance);
router.get('/attendance/history/:assignment_id', getAttendanceHistory);
router.get('/attendance/:session_id', getAttendanceRecords);

export default router;
