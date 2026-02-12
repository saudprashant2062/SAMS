import asyncHandler from '../../utils/asyncHandler.utils.js';
import ApiError from '../../utils/ApiError.utils.js';
import ApiResponse from '../../utils/ApiResponse.utils.js';
import {
    getAllAttendanceSessionsService,
    getAttendanceSessionByIdService,
    createAttendanceSessionService,
    updateAttendanceSessionService,
    deleteAttendanceSessionService,
    markAttendanceService,
    updateAttendanceRecordService,
    deleteAttendanceRecordService,
    getAttendanceSummaryBySectionService,
} from '../../services/admin/attendance.service.js';
import {
    createAttendanceSessionSchema,
    markAttendanceSchema,
    updateAttendanceRecordSchema,
} from '../../validators/attendance.validator.js';

/* =====================================================
   GET ALL ATTENDANCE SESSIONS
===================================================== */
export const getAllAttendanceSessions = asyncHandler(async (req, res) => {
    const filters = {
        department_id: req.query.department_id,
        semester_id: req.query.semester_id,
        section_id: req.query.section_id,
        subject_id: req.query.subject_id,
        teacher_id: req.query.teacher_id,
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        page: req.query.page,
        limit: req.query.limit,
    };

    const result = await getAllAttendanceSessionsService(filters);
    res.status(200).json(new ApiResponse(200, result, 'Attendance sessions fetched'));
});

/* =====================================================
   GET ATTENDANCE SESSION BY ID
===================================================== */
export const getAttendanceSessionById = asyncHandler(async (req, res) => {
    const session = await getAttendanceSessionByIdService(req.params.id);
    res.status(200).json(new ApiResponse(200, session, 'Attendance session fetched'));
});

/* =====================================================
   CREATE ATTENDANCE SESSION
===================================================== */
export const createAttendanceSession = asyncHandler(async (req, res) => {
    const parsed = createAttendanceSessionSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new ApiError(422, 'Validation failed', parsed.error.format());
    }

    const session = await createAttendanceSessionService(parsed.data);
    res.status(201).json(new ApiResponse(201, session, 'Attendance session created'));
});

/* =====================================================
   UPDATE ATTENDANCE SESSION
===================================================== */
export const updateAttendanceSession = asyncHandler(async (req, res) => {
    const session = await updateAttendanceSessionService(req.params.id, req.body);
    res.status(200).json(new ApiResponse(200, session, 'Attendance session updated'));
});

/* =====================================================
   DELETE ATTENDANCE SESSION (SOFT DELETE CASCADE)
===================================================== */
export const deleteAttendanceSession = asyncHandler(async (req, res) => {
    const result = await deleteAttendanceSessionService(req.params.id);
    res.status(200).json(new ApiResponse(200, null, result.message));
});

/* =====================================================
   MARK ATTENDANCE (BULK)
===================================================== */
export const markAttendance = asyncHandler(async (req, res) => {
    const parsed = markAttendanceSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new ApiError(422, 'Validation failed', parsed.error.format());
    }

    const records = await markAttendanceService(parsed.data);
    res.status(200).json(new ApiResponse(200, records, 'Attendance marked'));
});

/* =====================================================
   UPDATE SINGLE ATTENDANCE RECORD
===================================================== */
export const updateAttendanceRecord = asyncHandler(async (req, res) => {
    const parsed = updateAttendanceRecordSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new ApiError(422, 'Validation failed', parsed.error.format());
    }

    const record = await updateAttendanceRecordService(req.params.id, parsed.data);
    res.status(200).json(new ApiResponse(200, record, 'Attendance record updated'));
});

/* =====================================================
   DELETE ATTENDANCE RECORD (SOFT DELETE)
===================================================== */
export const deleteAttendanceRecord = asyncHandler(async (req, res) => {
    const result = await deleteAttendanceRecordService(req.params.id);
    res.status(200).json(new ApiResponse(200, null, result.message));
});

/* =====================================================
   GET ATTENDANCE SUMMARY BY SECTION
===================================================== */
export const getAttendanceSummaryBySection = asyncHandler(async (req, res) => {
    const summary = await getAttendanceSummaryBySectionService(req.params.section_id);
    res.status(200).json(new ApiResponse(200, summary, 'Attendance summary fetched'));
});
