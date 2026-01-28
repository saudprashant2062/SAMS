import asyncHandler from '../../utils/asyncHandler.utils.js';
import ApiResponse from '../../utils/ApiResponse.utils.js';
import {
    getAttendanceReportService,
    exportAttendanceReportService,
    getDepartmentAttendanceReportService,
    exportDepartmentAttendanceCsvService,
} from '../../services/admin/report.service.js';

/* =====================================================
   GET ATTENDANCE REPORT
===================================================== */
export const getAttendanceReport = asyncHandler(async (req, res) => {
    const { department_id, semester_id, section_id, subject_id, start_date, end_date } = req.query;

    const report = await getAttendanceReportService({
        department_id,
        semester_id,
        section_id,
        subject_id,
        start_date,
        end_date,
    });

    res.status(200).json(new ApiResponse(200, report, 'Attendance report generated'));
});

/* =====================================================
   EXPORT ATTENDANCE REPORT AS CSV
===================================================== */
export const exportAttendanceReport = asyncHandler(async (req, res) => {
    const { department_id, semester_id, section_id, subject_id, start_date, end_date } = req.query;

    const csvContent = await exportAttendanceReportService({
        department_id,
        semester_id,
        section_id,
        subject_id,
        start_date,
        end_date,
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
        'Content-Disposition',
        `attachment; filename="attendance_report_${Date.now()}.csv"`,
    );
    res.status(200).send(csvContent);
});

/* =====================================================
   GET DEPARTMENT-WISE ATTENDANCE REPORT
===================================================== */
export const getDepartmentAttendanceReport = asyncHandler(async (req, res) => {
    const { department_id, semester_id, section_id, subject_id, start_date, end_date } = req.query;

    const report = await getDepartmentAttendanceReportService({
        department_id,
        semester_id,
        section_id,
        subject_id,
        start_date,
        end_date,
    });

    res.status(200).json(new ApiResponse(200, report, 'Department attendance report generated'));
});

/* =====================================================
   EXPORT DEPARTMENT-WISE ATTENDANCE CSV
===================================================== */
export const exportDepartmentAttendanceCsv = asyncHandler(async (req, res) => {
    const { department_id, semester_id, section_id, subject_id, start_date, end_date } = req.query;

    const csvContent = await exportDepartmentAttendanceCsvService({
        department_id,
        semester_id,
        section_id,
        subject_id,
        start_date,
        end_date,
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
        'Content-Disposition',
        `attachment; filename="department_attendance_report_${Date.now()}.csv"`,
    );
    res.status(200).send(csvContent);
});
