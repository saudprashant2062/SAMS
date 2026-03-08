import express from 'express';
import authMiddleware from '../../middlewares/auth.middleware.js';
import roleMiddleware from '../../middlewares/role.middleware.js';
import {
    getAllAttendanceSessions,
    getAttendanceSessionById,
    createAttendanceSession,
    updateAttendanceSession,
    deleteAttendanceSession,
    markAttendance,
    updateAttendanceRecord,
    deleteAttendanceRecord,
    getAttendanceSummaryBySection,
    importAttendance,
} from '../../controllers/admin/attendance.controller.js';
import { uploadFile } from '../../utils/multer.utils.js';

const router = express.Router();

// Admin only
router.use(authMiddleware);
router.use(roleMiddleware('ADMIN'));

/* =====================================================
   ATTENDANCE SESSIONS
===================================================== */
router.get('/sessions', getAllAttendanceSessions);
router.get('/sessions/:id', getAttendanceSessionById);
router.post('/sessions', createAttendanceSession);
router.patch('/sessions/:id', updateAttendanceSession);
router.delete('/sessions/:id', deleteAttendanceSession);

/* =====================================================
   ATTENDANCE RECORDS
===================================================== */
router.post('/records', markAttendance);
router.patch('/records/:id', updateAttendanceRecord);
router.delete('/records/:id', deleteAttendanceRecord);

/* =====================================================
   ATTENDANCE IMPORT (CSV/XLSX)
===================================================== */
router.post('/import', uploadFile.single('file'), importAttendance);

/* =====================================================
   ATTENDANCE SUMMARY
===================================================== */
router.get('/summary/section/:section_id', getAttendanceSummaryBySection);

export default router;
