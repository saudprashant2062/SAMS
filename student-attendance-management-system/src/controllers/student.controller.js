import asyncHandler from '../utils/asyncHandler.utils.js';
import ApiResponse from '../utils/ApiResponse.utils.js';
import {
    getStudentAttendanceService,
    getStudentAttendanceSummaryService,
    getStudentSubjectsService,
    getStudentSectionService,
} from '../services/student.service.js';

/* =====================================================
   GET STUDENT ATTENDANCE RECORDS
===================================================== */
export const getMyAttendance = asyncHandler(async (req, res) => {
    const { subject_id, start_date, end_date, status, page, limit } = req.query;

    const result = await getStudentAttendanceService(req.user.student.id, {
        subject_id,
        start_date,
        end_date,
        status,
        page,
        limit,
    });

    res.status(200).json(new ApiResponse(200, result, 'Attendance records fetched'));
});

/* =====================================================
   GET STUDENT ATTENDANCE SUMMARY
===================================================== */
export const getMyAttendanceSummary = asyncHandler(async (req, res) => {
    const summary = await getStudentAttendanceSummaryService(req.user.student.id);
    res.status(200).json(new ApiResponse(200, summary, 'Attendance summary fetched'));
});

/* =====================================================
   GET STUDENT SUBJECTS
===================================================== */
export const getMySubjects = asyncHandler(async (req, res) => {
    const subjects = await getStudentSubjectsService(req.user.student.id);
    res.status(200).json(
        new ApiResponse(200, { subjects, count: subjects.length }, 'Subjects fetched'),
    );
});

/* =====================================================
   GET STUDENT SECTION INFO
===================================================== */
export const getMySection = asyncHandler(async (req, res) => {
    const section = await getStudentSectionService(req.user.student.id);
    res.status(200).json(new ApiResponse(200, section, 'Section info fetched'));
});
