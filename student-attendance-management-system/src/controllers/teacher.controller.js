import asyncHandler from '../utils/asyncHandler.utils.js';
import ApiError from '../utils/ApiError.utils.js';
import ApiResponse from '../utils/ApiResponse.utils.js';
import {
    getTeacherDashboardService,
    getTeacherAssignmentsService,
    getTeachingAssignmentByIdService,
    createAttendanceSessionService,
    markAttendanceService,
    getAttendanceRecordsService,
    getAttendanceHistoryService,
    updateAttendanceSessionService,
} from '../services/teacher.service.js';
import {
    createAttendanceSessionSchema,
    markAttendanceSchema,
} from '../validators/teacher.validator.js';

/* ---------- GET TEACHER DASHBOARD ---------- */
export const getTeacherDashboard = asyncHandler(async (req, res) => {
    const dashboard = await getTeacherDashboardService(req.user.teacher.id);
    res.status(200).json(new ApiResponse(200, dashboard, 'Dashboard fetched'));
});

/* ---------- GET ALL ASSIGNMENTS ---------- */
export const getAssignments = asyncHandler(async (req, res) => {
    const assignments = await getTeacherAssignmentsService(req.user.teacher.id);
    res.status(200).json(new ApiResponse(200, assignments, 'Teaching assignments fetched'));
});

/* ---------- GET TEACHING ASSIGNMENT BY ID ---------- */
export const getTeachingAssignmentById = asyncHandler(async (req, res) => {
    const assignment = await getTeachingAssignmentByIdService(req.params.id, req.user);
    res.status(200).json(new ApiResponse(200, assignment, 'Teaching assignment fetched'));
});

/* ---------- CREATE ATTENDANCE SESSION ---------- */
export const createAttendanceSession = asyncHandler(async (req, res) => {
    const parsed = createAttendanceSessionSchema.safeParse({ body: req.body });
    if (!parsed.success) throw new ApiError(422, 'Validation failed', parsed.error.format());

    const session = await createAttendanceSessionService(
        req.user.teacher.id,
        parsed.data.body,
        req.user.role === 'ADMIN',
    );
    res.status(201).json(new ApiResponse(201, session, 'Attendance session created'));
});

/* ---------- MARK ATTENDANCE ---------- */
export const markAttendance = asyncHandler(async (req, res) => {
    const parsed = markAttendanceSchema.safeParse({ body: req.body });
    if (!parsed.success) throw new ApiError(422, 'Validation failed', parsed.error.format());

    const records = await markAttendanceService(
        req.user.teacher.id,
        parsed.data.body,
        req.user.role === 'ADMIN',
    );
    res.status(200).json(new ApiResponse(200, records, 'Attendance marked'));
});

/* ---------- GET ATTENDANCE RECORDS ---------- */
export const getAttendanceRecords = asyncHandler(async (req, res) => {
    const records = await getAttendanceRecordsService(
        req.user.teacher.id,
        req.params.session_id,
        req.user.role === 'ADMIN',
    );
    res.status(200).json(new ApiResponse(200, records, 'Attendance records fetched'));
});

/* ---------- GET ATTENDANCE HISTORY ---------- */
export const getAttendanceHistory = asyncHandler(async (req, res) => {
    const history = await getAttendanceHistoryService(
        req.user.teacher.id,
        req.params.assignment_id,
        req.user.role === 'ADMIN',
    );
    res.status(200).json(new ApiResponse(200, history, 'Attendance history fetched'));
});

/* ---------- UPDATE ATTENDANCE SESSION ---------- */
export const updateAttendanceSession = asyncHandler(async (req, res) => {
    const session = await updateAttendanceSessionService(
        req.user.teacher.id,
        req.params.id,
        req.body,
        req.user.role === 'ADMIN',
    );
    res.status(200).json(new ApiResponse(200, session, 'Attendance session updated'));
});
