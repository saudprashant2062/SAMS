import prisma from '../config/prisma.js';
import ApiError from '../utils/ApiError.utils.js';
import {
    userBasicSelect,
    userPublicSelect,
    sectionWithDeptSemInclude,
} from '../utils/prisma.selects.js';
import { createSession, markAttendance, getSessionRecords } from './shared/attendance.shared.js';
import { parsePagination, paginatedResponse } from '../utils/pagination.utils.js';

/* ---------- GET TEACHER DASHBOARD (OPTIMIZED) ---------- */
export const getTeacherDashboardService = async teacher_id => {
    // Get assignments with minimal data needed for dashboard
    const assignments = await prisma.teachingAssignment.findMany({
        where: { teacher_id, is_deleted: false },
        select: {
            id: true,
            subject: { select: { id: true, name: true } },
            section: {
                select: {
                    id: true,
                    name: true,
                    _count: {
                        select: { students: { where: { is_deleted: false } } },
                    },
                },
            },
        },
    });

    const assignmentIds = assignments.map(a => a.id);

    // Get attendance stats using groupBy (avoids N+1)
    const attendanceStats = await prisma.attendanceRecord.groupBy({
        by: ['status'],
        where: {
            is_deleted: false,
            session: {
                teaching_assignment_id: { in: assignmentIds },
                is_deleted: false,
            },
        },
        _count: { status: true },
    });

    // Calculate stats
    const totalAssignments = assignments.length;
    const totalStudents = assignments.reduce(
        (sum, a) => sum + (a.section?._count?.students || 0),
        0,
    );

    const totalPresent = attendanceStats.find(s => s.status === 'PRESENT')?._count?.status || 0;
    const totalAbsent = attendanceStats.find(s => s.status === 'ABSENT')?._count?.status || 0;
    const totalRecords = totalPresent + totalAbsent;
    const avgAttendance = totalRecords > 0 ? (totalPresent / totalRecords) * 100 : 0;

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's sessions count
    const todaySessionsCount = await prisma.attendanceSession.count({
        where: {
            teaching_assignment_id: { in: assignmentIds },
            session_date: { gte: today, lt: tomorrow },
            is_deleted: false,
        },
    });

    const classesToday = assignments.length;

    // Today's schedule with session status
    const todaySessions = await prisma.attendanceSession.findMany({
        where: {
            teaching_assignment_id: { in: assignmentIds },
            session_date: { gte: today, lt: tomorrow },
            is_deleted: false,
        },
        select: { teaching_assignment_id: true },
    });

    const completedAssignmentIds = new Set(todaySessions.map(s => s.teaching_assignment_id));

    const todaySchedule = assignments.map(a => ({
        subject: a.subject?.name || 'Unknown',
        section: a.section?.name || 'Unknown',
        time: 'Scheduled',
        completed: completedAssignmentIds.has(a.id),
    }));

    // Recent activity (last 5 attendance sessions) with optimized query
    const recentSessions = await prisma.attendanceSession.findMany({
        where: {
            teaching_assignment_id: { in: assignmentIds },
            is_deleted: false,
        },
        select: {
            id: true,
            created_at: true,
            teaching_assignment: {
                select: {
                    subject: { select: { name: true } },
                    section: { select: { name: true } },
                },
            },
        },
        orderBy: { created_at: 'desc' },
        take: 5,
    });

    // Get record counts for recent sessions
    const recentSessionIds = recentSessions.map(s => s.id);
    const recentSessionStats = await prisma.attendanceRecord.groupBy({
        by: ['session_id', 'status'],
        where: {
            session_id: { in: recentSessionIds },
            is_deleted: false,
        },
        _count: { status: true },
    });

    // Build stats map
    const sessionStatsMap = new Map();
    recentSessionStats.forEach(stat => {
        if (!sessionStatsMap.has(stat.session_id)) {
            sessionStatsMap.set(stat.session_id, { present: 0, total: 0 });
        }
        const s = sessionStatsMap.get(stat.session_id);
        s.total += stat._count.status;
        if (stat.status === 'PRESENT') s.present += stat._count.status;
    });

    const recentActivity = recentSessions.map(session => {
        const stats = sessionStatsMap.get(session.id) || { present: 0, total: 0 };
        return {
            description: `Marked attendance for ${session.teaching_assignment?.subject?.name || 'Unknown'} - ${session.teaching_assignment?.section?.name || 'Unknown'} (${stats.present}/${stats.total} present)`,
            created_at: session.created_at,
        };
    });

    return {
        totalAssignments,
        totalStudents,
        classesToday,
        avgAttendance,
        todaySchedule,
        recentActivity,
    };
};

/* ---------- GET TEACHING ASSIGNMENTS (OPTIMIZED) ---------- */
export const getTeacherAssignmentsService = async (teacher_id, filters = {}) => {
    const pagination = parsePagination(filters);

    // Get total count
    const totalCount = await prisma.teachingAssignment.count({
        where: { teacher_id, is_deleted: false },
    });

    // Get assignments with select instead of include where possible
    const assignments = await prisma.teachingAssignment.findMany({
        where: { teacher_id, is_deleted: false },
        select: {
            id: true,
            is_deleted: true,
            created_at: true,
            subject: { select: { id: true, name: true, code: true } },
            section: {
                select: {
                    id: true,
                    name: true,
                    department: { select: { id: true, name: true } },
                    semester: { select: { id: true, number: true } },
                    students: {
                        where: { is_deleted: false },
                        select: {
                            id: true,
                            roll_no: true,
                            user: { select: { fullname: true } },
                        },
                        orderBy: { roll_no: 'asc' },
                    },
                    _count: { select: { students: { where: { is_deleted: false } } } },
                },
            },
            teacher: {
                select: {
                    id: true,
                    user: { select: userBasicSelect },
                },
            },
        },
        skip: pagination.skip,
        take: pagination.take,
    });

    const assignmentIds = assignments.map(a => a.id);

    // Get attendance stats using groupBy (avoids N+1)
    const attendanceStats = await prisma.attendanceRecord.groupBy({
        by: ['status'],
        where: {
            is_deleted: false,
            session: {
                teaching_assignment_id: { in: assignmentIds },
                is_deleted: false,
            },
        },
        _count: { status: true },
    });

    // Get per-assignment stats
    const sessionStats = await prisma.attendanceSession.findMany({
        where: {
            teaching_assignment_id: { in: assignmentIds },
            is_deleted: false,
        },
        select: {
            id: true,
            teaching_assignment_id: true,
        },
    });

    const sessionIds = sessionStats.map(s => s.id);

    const recordStats = await prisma.attendanceRecord.groupBy({
        by: ['session_id', 'status'],
        where: {
            session_id: { in: sessionIds },
            is_deleted: false,
        },
        _count: { status: true },
    });

    // Build per-assignment attendance map
    const sessionToAssignment = new Map(sessionStats.map(s => [s.id, s.teaching_assignment_id]));
    const assignmentStats = new Map();

    recordStats.forEach(r => {
        const assignmentId = sessionToAssignment.get(r.session_id);
        if (!assignmentStats.has(assignmentId)) {
            assignmentStats.set(assignmentId, { present: 0, total: 0 });
        }
        const stats = assignmentStats.get(assignmentId);
        stats.total += r._count.status;
        if (r.status === 'PRESENT') stats.present += r._count.status;
    });

    // Compute additional fields for each assignment
    const data = assignments.map(assignment => {
        const studentCount = assignment.section?._count?.students || 0;
        const stats = assignmentStats.get(assignment.id) || { present: 0, total: 0 };
        const avgAttendance = stats.total > 0 ? (stats.present / stats.total) * 100 : 0;

        return {
            id: assignment.id,
            subject: assignment.subject,
            section: {
                id: assignment.section.id,
                name: assignment.section.name,
                department: assignment.section.department,
                semester: assignment.section.semester,
                students: assignment.section.students,
            },
            teacher: assignment.teacher,
            studentCount,
            avgAttendance,
            isActive: true,
            created_at: assignment.created_at,
        };
    });

    return paginatedResponse(data, totalCount, pagination);
};

/* ---------- GET TEACHING ASSIGNMENT BY ID (OPTIMIZED) ---------- */
export const getTeachingAssignmentByIdService = async (assignment_id, user) => {
    const assignment = await prisma.teachingAssignment.findUnique({
        where: { id: assignment_id },
        select: {
            id: true,
            teacher_id: true,
            is_deleted: true,
            created_at: true,
            teacher: {
                select: {
                    id: true,
                    user: { select: userBasicSelect },
                },
            },
            subject: { select: { id: true, name: true, code: true, credit_hours: true } },
            section: {
                select: {
                    id: true,
                    name: true,
                    department: { select: { id: true, name: true } },
                    semester: { select: { id: true, number: true } },
                    students: {
                        where: { is_deleted: false },
                        select: {
                            id: true,
                            stdId: true,
                            roll_no: true,
                            user: { select: userBasicSelect },
                        },
                    },
                },
            },
        },
    });

    if (!assignment || assignment.is_deleted)
        throw new ApiError(404, 'Teaching assignment not found');

    if (user.role === 'TEACHER' && assignment.teacher_id !== user.teacher.id) {
        throw new ApiError(403, 'Not authorized to view this assignment');
    }

    // Get sessions separately with optimized query
    const sessions = await prisma.attendanceSession.findMany({
        where: {
            teaching_assignment_id: assignment_id,
            is_deleted: false,
        },
        select: {
            id: true,
            session_date: true,
            is_cancelled: true,
            notes: true,
            created_at: true,
        },
        orderBy: { session_date: 'desc' },
        take: 20, // Limit to recent sessions for performance
    });

    return {
        ...assignment,
        attendance_sessions: sessions,
    };
};

/* ---------- CREATE ATTENDANCE SESSION ---------- */
export const createAttendanceSessionService = async (teacher_id, data, isAdmin = false) => {
    const { teaching_assignment_id, session_date } = data;
    return createSession(teaching_assignment_id, session_date, teacher_id, isAdmin);
};

/* ---------- MARK OR UPDATE ATTENDANCE ---------- */
export const markAttendanceService = async (teacher_id, data, isAdmin = false) => {
    const { session_id, records } = data;
    return markAttendance(session_id, records, teacher_id, isAdmin);
};

/* ---------- GET ATTENDANCE RECORDS ---------- */
export const getAttendanceRecordsService = async (teacher_id, session_id, isAdmin = false) => {
    return getSessionRecords(session_id, teacher_id, isAdmin);
};

/* ---------- GET ATTENDANCE HISTORY FOR ASSIGNMENT (OPTIMIZED) ---------- */
export const getAttendanceHistoryService = async (
    teacher_id,
    assignment_id,
    isAdmin = false,
    filters = {},
) => {
    const pagination = parsePagination(filters);

    // First verify the teacher has access to this assignment
    const assignment = await prisma.teachingAssignment.findUnique({
        where: { id: assignment_id },
        select: { id: true, teacher_id: true, is_deleted: true },
    });

    if (!assignment || assignment.is_deleted) {
        throw new ApiError(404, 'Teaching assignment not found');
    }

    if (!isAdmin && assignment.teacher_id !== teacher_id) {
        throw new ApiError(403, 'Not authorized to access this assignment');
    }

    // Get total count
    const totalCount = await prisma.attendanceSession.count({
        where: {
            teaching_assignment_id: assignment_id,
            is_deleted: false,
        },
    });

    // Get sessions with minimal data
    const sessions = await prisma.attendanceSession.findMany({
        where: {
            teaching_assignment_id: assignment_id,
            is_deleted: false,
        },
        select: {
            id: true,
            session_date: true,
        },
        orderBy: { session_date: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
    });

    const sessionIds = sessions.map(s => s.id);

    // Get record counts using groupBy (avoids N+1)
    const recordStats = await prisma.attendanceRecord.groupBy({
        by: ['session_id', 'status'],
        where: {
            session_id: { in: sessionIds },
            is_deleted: false,
        },
        _count: { status: true },
    });

    // Build stats map
    const statsMap = new Map();
    recordStats.forEach(stat => {
        if (!statsMap.has(stat.session_id)) {
            statsMap.set(stat.session_id, { present: 0, absent: 0, total: 0 });
        }
        const s = statsMap.get(stat.session_id);
        s.total += stat._count.status;
        if (stat.status === 'PRESENT') s.present += stat._count.status;
        else s.absent += stat._count.status;
    });

    // Transform to history format
    const data = sessions.map(session => {
        const stats = statsMap.get(session.id) || { present: 0, absent: 0, total: 0 };
        return {
            id: session.id,
            date: session.session_date,
            presentCount: stats.present,
            absentCount: stats.absent,
            totalCount: stats.total,
        };
    });

    return paginatedResponse(data, totalCount, pagination);
};
// ...existing code...

/* ---------- UPDATE ATTENDANCE SESSION ---------- */
export const updateAttendanceSessionService = async (
    teacher_id,
    session_id,
    data,
    isAdmin = false,
) => {
    const session = await prisma.attendanceSession.findUnique({
        where: { id: session_id },
        include: {
            records: true,
            teaching_assignment: true,
        },
    });

    if (!session || session.is_deleted) {
        throw new ApiError(404, 'Attendance session not found');
    }

    // Verify access
    if (!isAdmin && session.teaching_assignment.teacher_id !== teacher_id) {
        throw new ApiError(403, 'Not authorized to update this session');
    }

    if (data.session_date) {
        const newDate = new Date(data.session_date);

        // Prevent duplicate sessions for the same assignment on the same day when updating
        const startOfDay = new Date(newDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(newDate);
        endOfDay.setHours(23, 59, 59, 999);

        const existingSession = await prisma.attendanceSession.findFirst({
            where: {
                teaching_assignment_id: session.teaching_assignment_id,
                session_date: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
                id: { not: session_id },
                is_deleted: false,
            },
        });

        if (existingSession) {
            throw new ApiError(
                400,
                'An attendance session already exists for this subject on this date',
            );
        }
    }

    return prisma.attendanceSession.update({
        where: { id: session_id },
        data: {
            session_date: data.session_date ? new Date(data.session_date) : undefined,
        },
    });
};
