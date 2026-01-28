import prisma from '../config/prisma.js';
import ApiError from '../utils/ApiError.utils.js';
import {
    userBasicSelect,
    userPublicSelect,
    sectionWithDeptSemInclude,
} from '../utils/prisma.selects.js';
import { createSession, markAttendance, getSessionRecords } from './shared/attendance.shared.js';

/* ---------- GET TEACHER DASHBOARD ---------- */
export const getTeacherDashboardService = async teacher_id => {
    // Get all assignments with their sections and attendance sessions
    const assignments = await prisma.teachingAssignment.findMany({
        where: { teacher_id, is_deleted: false },
        include: {
            subject: true,
            section: {
                include: {
                    students: { where: { is_deleted: false } },
                },
            },
            attendance_sessions: {
                where: { is_deleted: false },
                include: {
                    records: { where: { is_deleted: false } },
                },
                orderBy: { session_date: 'desc' },
            },
        },
    });

    // Calculate stats
    const totalAssignments = assignments.length;

    // Get unique students count
    const studentIds = new Set();
    assignments.forEach(a => {
        a.section?.students?.forEach(s => studentIds.add(s.id));
    });
    const totalStudents = studentIds.size;

    // Calculate average attendance
    let totalPresent = 0;
    let totalRecords = 0;
    assignments.forEach(a => {
        a.attendance_sessions.forEach(session => {
            session.records.forEach(record => {
                totalRecords++;
                if (record.status === 'PRESENT') totalPresent++;
            });
        });
    });
    const avgAttendance = totalRecords > 0 ? (totalPresent / totalRecords) * 100 : 0;

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's sessions
    const todaySessions = await prisma.attendanceSession.findMany({
        where: {
            teaching_assignment: { teacher_id },
            session_date: { gte: today, lt: tomorrow },
            is_deleted: false,
        },
        include: {
            teaching_assignment: {
                include: { subject: true, section: true },
            },
            records: { where: { is_deleted: false } },
        },
    });

    const classesToday = assignments.length; // Number of potential classes

    // Today's schedule (show all assignments as potential today's classes)
    const todaySchedule = assignments.map(a => {
        const todaySession = todaySessions.find(s => s.teaching_assignment_id === a.id);
        return {
            subject: a.subject?.name || 'Unknown',
            section: a.section?.name || 'Unknown',
            time: 'Scheduled',
            completed: !!todaySession,
        };
    });

    // Recent activity (last 5 attendance sessions)
    const recentSessions = await prisma.attendanceSession.findMany({
        where: {
            teaching_assignment: { teacher_id },
            is_deleted: false,
        },
        include: {
            teaching_assignment: {
                include: { subject: true, section: true },
            },
            records: { where: { is_deleted: false } },
        },
        orderBy: { created_at: 'desc' },
        take: 5,
    });

    const recentActivity = recentSessions.map(session => {
        const presentCount = session.records.filter(r => r.status === 'PRESENT').length;
        const totalCount = session.records.length;

        return {
            description: `Marked attendance for ${session.teaching_assignment?.subject?.name || 'Unknown'} - ${session.teaching_assignment?.section?.name || 'Unknown'} (${presentCount}/${totalCount} present)`,
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

/* ---------- GET TEACHING ASSIGNMENTS ---------- */
export const getTeacherAssignmentsService = async teacher_id => {
    const assignments = await prisma.teachingAssignment.findMany({
        where: { teacher_id, is_deleted: false },
        include: {
            subject: true,
            section: {
                include: {
                    ...sectionWithDeptSemInclude,
                    students: {
                        where: { is_deleted: false },
                        include: { user: { select: userBasicSelect } },
                    },
                },
            },
            attendance_sessions: {
                where: { is_deleted: false },
                orderBy: { session_date: 'desc' },
                include: {
                    records: {
                        where: { is_deleted: false },
                    },
                },
            },
            teacher: {
                include: { user: { select: userBasicSelect } },
            },
        },
    });

    // Compute additional fields for each assignment
    return assignments.map(assignment => {
        const studentCount = assignment.section?.students?.length || 0;
        const sessions = assignment.attendance_sessions || [];

        // Calculate average attendance
        let totalPresent = 0;
        let totalRecords = 0;
        sessions.forEach(session => {
            session.records?.forEach(record => {
                totalRecords++;
                if (record.status === 'PRESENT') totalPresent++;
            });
        });
        const avgAttendance = totalRecords > 0 ? (totalPresent / totalRecords) * 100 : 0;

        // Check if assignment is active (has is_active field or always true)
        const isActive = assignment.is_active !== false;

        return {
            ...assignment,
            studentCount,
            avgAttendance,
            isActive,
        };
    });
};

/* ---------- GET TEACHING ASSIGNMENT BY ID (Teacher/Admin) ---------- */
export const getTeachingAssignmentByIdService = async (assignment_id, user) => {
    const assignment = await prisma.teachingAssignment.findUnique({
        where: { id: assignment_id },
        include: {
            teacher: {
                include: { user: { select: userBasicSelect } },
            },
            subject: true,
            section: {
                include: {
                    ...sectionWithDeptSemInclude,
                    students: {
                        where: { is_deleted: false },
                        include: { user: { select: userBasicSelect } },
                    },
                },
            },
            attendance_sessions: {
                where: { is_deleted: false },
                include: {
                    records: {
                        where: { is_deleted: false },
                        include: {
                            student: {
                                include: { user: { select: userPublicSelect } },
                            },
                        },
                    },
                },
                orderBy: { session_date: 'desc' },
            },
        },
    });

    if (!assignment || assignment.is_deleted)
        throw new ApiError(404, 'Teaching assignment not found');

    if (user.role === 'TEACHER' && assignment.teacher_id !== user.teacher.id) {
        throw new ApiError(403, 'Not authorized to view this assignment');
    }

    return assignment;
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

/* ---------- GET ATTENDANCE HISTORY FOR ASSIGNMENT ---------- */
export const getAttendanceHistoryService = async (teacher_id, assignment_id, isAdmin = false) => {
    // First verify the teacher has access to this assignment
    const assignment = await prisma.teachingAssignment.findUnique({
        where: { id: assignment_id },
    });

    if (!assignment || assignment.is_deleted) {
        throw new ApiError(404, 'Teaching assignment not found');
    }

    if (!isAdmin && assignment.teacher_id !== teacher_id) {
        throw new ApiError(403, 'Not authorized to access this assignment');
    }

    // Get all attendance sessions for this assignment
    const sessions = await prisma.attendanceSession.findMany({
        where: {
            teaching_assignment_id: assignment_id,
            is_deleted: false,
        },
        include: {
            records: {
                where: { is_deleted: false },
            },
        },
        orderBy: { session_date: 'desc' },
    });

    // Transform to history format
    return sessions.map(session => {
        const presentCount = session.records.filter(r => r.status === 'PRESENT').length;
        const absentCount = session.records.filter(r => r.status === 'ABSENT').length;
        const totalCount = session.records.length;

        return {
            id: session.id,
            date: session.session_date,
            presentCount,
            absentCount,
            totalCount,
        };
    });
};
