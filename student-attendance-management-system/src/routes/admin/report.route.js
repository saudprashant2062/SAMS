import express from 'express';
import authMiddleware from '../../middlewares/auth.middleware.js';
import roleMiddleware from '../../middlewares/role.middleware.js';
import {
    getAttendanceReport,
    exportAttendanceReport,
    getDepartmentAttendanceReport,
    exportDepartmentAttendanceCsv,
} from '../../controllers/admin/report.controller.js';

const router = express.Router();

// Admin only
router.use(authMiddleware);
router.use(roleMiddleware('ADMIN'));

/* =====================================================
   ATTENDANCE REPORTS
===================================================== */

// Get attendance report
router.get('/attendance', getAttendanceReport);

// Export attendance report as CSV
router.get('/attendance/export', exportAttendanceReport);

// Get department-wise attendance report
router.get('/attendance/department', getDepartmentAttendanceReport);

// Export department-wise attendance as CSV
router.get('/attendance/department/export', exportDepartmentAttendanceCsv);

export default router;
