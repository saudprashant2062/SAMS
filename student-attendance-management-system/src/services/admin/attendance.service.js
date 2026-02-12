import prisma from '../../config/prisma.js';
import ApiError from '../../utils/ApiError.utils.js';
import {
    userMinimalSelect,
    userPublicSelect,
    sectionWithDeptSemInclude,
} from '../../utils/prisma.selects.js';
import {
    createSession,
    markAttendance as sharedMarkAttendance,
    buildStudentSummary,
} from '../shared/attendance.shared.js';
import { parsePagination, paginatedResponse } from '../../utils/pagination.utils.js';

/* =====================================================
   GET ALL ATTENDANCE SESSIONS (ADMIN - OPTIMIZED)
   - Pagination added
   - select used instead of include
===================================================== */
export const getAllAttendanceSessionsService = async (filters = {}) => {
    const { department_id, semester_id, section_id, subject_id, teacher_id, start_date, end_date } =
        filters;
    const pagination = parsePagination(filters);

    const where = { is_deleted: false };

    // Build nested filters
    if (department_id || semester_id || section_id || subject_id || teacher_id) {
        where.teaching_assignment = {};
        if (teacher_id) where.teaching_assignment.teacher_id = teacher_id;
        if (subject_id) where.teaching_assignment.subject_id = subject_id;
        if (section_id) where.teaching_assignment.section_id = section_id;
        if (department_id || semester_id) {
            where.teaching_assignment.section = {};
            if (department_id) where.teaching_assignment.section.department_id = department_id;
            if (semester_id) where.teaching_assignment.section.semester_id = semester_id;
        }
    }

    // Date filters
    if (start_date || end_date) {
        where.session_date = {};
        if (start_date) where.session_date.gte = new Date(start_date);
        if (end_date) where.session_date.lte = new Date(end_date);
    }

    const [total, sessions] = await Promise.all([
        prisma.attendanceSession.count({ where }),
        prisma.attendanceSession.findMany({
            where,
            select: {
                id: true,
                session_date: true,
                is_cancelled: true,
                notes: true,
                created_at: true,
                teaching_assignment: {
                    select: {
                        id: true,
                        teacher: {
                            select: {
                                id: true,
                                user: { select: userMinimalSelect },
                            },
                        },
                        subject: { select: { id: true, name: true, code: true } },
                        section: {
                            select: {
                                id: true,
                                name: true,
                                department: { select: { id: true, name: true } },
                                semester: { select: { id: true, number: true } },
                            },
                        },
                    },
                },
                _count: {
                    select: { records: { where: { is_deleted: false } } },
                },
            },
            orderBy: { session_date: 'desc' },
            skip: pagination.skip,
            take: pagination.take,
        }),
    ]);

    // Get per-session present/absent counts using groupBy (avoids N+1)
    const sessionIds = sessions.map(s => s.id);
    const recordStats =
        sessionIds.length > 0
            ? await prisma.attendanceRecord.groupBy({
                  by: ['session_id', 'status'],
                  where: {
                      session_id: { in: sessionIds },
                      is_deleted: false,
                  },
                  _count: { status: true },
              })
            : [];

    // Build per-session stats map
    const statsMap = new Map();
    recordStats.forEach(stat => {
        if (!statsMap.has(stat.session_id)) {
            statsMap.set(stat.session_id, { present: 0, absent: 0, total: 0 });
        }
        const s = statsMap.get(stat.session_id);
        s.total += stat._count.status;
        if (stat.status === 'PRESENT') s.present += stat._count.status;
        else if (stat.status === 'ABSENT') s.absent += stat._count.status;
    });

    // Attach presentCount and absentCount to each session
    const sessionsWithCounts = sessions.map(session => {
        const stats = statsMap.get(session.id) || { present: 0, absent: 0, total: 0 };
        return {
            ...session,
            presentCount: stats.present,
            absentCount: stats.absent,
        };
    });

    return paginatedResponse(sessionsWithCounts, total, pagination);
};

/* =====================================================
   GET ATTENDANCE SESSION BY ID (ADMIN - OPTIMIZED)
===================================================== */
export const getAttendanceSessionByIdService = async id => {
    const session = await prisma.attendanceSession.findUnique({
        where: { id },
        select: {
            id: true,
            session_date: true,
            is_cancelled: true,
            notes: true,
            is_deleted: true,
            created_at: true,
            teaching_assignment: {
                select: {
                    id: true,
                    teacher: {
                        select: {
                            id: true,
                            user: { select: userMinimalSelect },
                        },
                    },
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
                                    stdId: true,
                                    roll_no: true,
                                    user: { select: userPublicSelect },
                                },
                            },
                        },
                    },
                },
            },
            records: {
                where: { is_deleted: false },
                select: {
                    id: true,
                    status: true,
                    student: {
                        select: {
                            id: true,
                            stdId: true,
                            roll_no: true,
                            user: { select: userPublicSelect },
                        },
                    },
                },
            },
        },
    });

    if (!session || session.is_deleted) {
        throw new ApiError(404, 'Attendance session not found');
    }

    return session;
};

/* =====================================================
   CREATE ATTENDANCE SESSION (ADMIN)
===================================================== */
export const createAttendanceSessionService = async data => {
    const { teaching_assignment_id, session_date } = data;
    return createSession(teaching_assignment_id, session_date, null, true);
};

/* =====================================================
   UPDATE ATTENDANCE SESSION (ADMIN)
===================================================== */
export const updateAttendanceSessionService = async (id, data) => {
    const session = await prisma.attendanceSession.findUnique({
        where: { id },
        include: { records: true },
    });

    if (!session || session.is_deleted) {
        throw new ApiError(404, 'Attendance session not found');
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
                id: { not: id }, // Exclude current session
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
        where: { id },
        data: {
            session_date: data.session_date ? new Date(data.session_date) : undefined,
        },
        include: {
            teaching_assignment: {
                include: { subject: true, section: true },
            },
        },
    });
};

/* =====================================================
   DELETE ATTENDANCE SESSION (ADMIN - HARD DELETE)
 ===================================================== */
export const deleteAttendanceSessionService = async id => {
    const session = await prisma.attendanceSession.findUnique({
        where: { id },
    });

    if (!session) {
        throw new ApiError(404, 'Attendance session not found');
    }

    // Hard delete cascade: delete all records first, then the session
    await prisma.$transaction([
        prisma.attendanceRecord.deleteMany({
            where: { session_id: id },
        }),
        prisma.attendanceSession.delete({
            where: { id },
        }),
    ]);

    return { message: 'Attendance session and records deleted permanently' };
};

/* =====================================================
   MARK/UPDATE ATTENDANCE RECORDS (ADMIN)
===================================================== */
export const markAttendanceService = async data => {
    const { session_id, records } = data;
    return sharedMarkAttendance(session_id, records, null, true);
};

/* =====================================================
   UPDATE SINGLE ATTENDANCE RECORD (ADMIN)
===================================================== */
export const updateAttendanceRecordService = async (id, data) => {
    const record = await prisma.attendanceRecord.findUnique({
        where: { id },
        select: { id: true, is_deleted: true },
    });

    if (!record || record.is_deleted) {
        throw new ApiError(404, 'Attendance record not found');
    }

    return prisma.attendanceRecord.update({
        where: { id },
        data: { status: data.status },
        select: {
            id: true,
            status: true,
            student: {
                select: {
                    id: true,
                    user: {
                        select: { fullname: true, email: true },
                    },
                },
            },
            session: {
                select: { id: true, session_date: true },
            },
        },
    });
};

/* =====================================================
   DELETE ATTENDANCE RECORD (SOFT DELETE)
===================================================== */
export const deleteAttendanceRecordService = async id => {
    const record = await prisma.attendanceRecord.findUnique({ where: { id } });

    if (!record) {
        throw new ApiError(404, 'Attendance record not found');
    }

    await prisma.attendanceRecord.delete({
        where: { id },
    });

    return { message: 'Attendance record deleted permanently' };
};

/* =====================================================
   GET ATTENDANCE SUMMARY BY SECTION (ADMIN - OPTIMIZED)
   - Uses groupBy to avoid N+1 queries
===================================================== */
export const getAttendanceSummaryBySectionService = async sectionId => {
    const section = await prisma.section.findUnique({
        where: { id: sectionId },
        select: {
            id: true,
            name: true,
            is_deleted: true,
            department: { select: { id: true, name: true } },
            semester: { select: { id: true, number: true } },
            students: {
                where: { is_deleted: false },
                select: {
                    id: true,
                    stdId: true,
                    roll_no: true,
                    user: { select: userMinimalSelect },
                },
            },
        },
    });

    if (!section || section.is_deleted) {
        throw new ApiError(404, 'Section not found');
    }

    // Get teaching assignments for this section
    const teachingAssignments = await prisma.teachingAssignment.findMany({
        where: { section_id: sectionId, is_deleted: false },
        select: {
            id: true,
            subject: { select: { id: true, name: true, code: true } },
        },
    });

    const assignmentIds = teachingAssignments.map(a => a.id);
    const studentIds = section.students.map(s => s.id);

    // Get session counts per assignment using groupBy
    const sessionCounts = await prisma.attendanceSession.groupBy({
        by: ['teaching_assignment_id'],
        where: {
            teaching_assignment_id: { in: assignmentIds },
            is_deleted: false,
        },
        _count: { id: true },
    });

    const sessionCountMap = new Map(
        sessionCounts.map(s => [s.teaching_assignment_id, s._count.id]),
    );

    // Get all attendance records grouped by student + subject
    const sessions = await prisma.attendanceSession.findMany({
        where: {
            teaching_assignment_id: { in: assignmentIds },
            is_deleted: false,
        },
        select: { id: true, teaching_assignment_id: true },
    });

    const sessionIds = sessions.map(s => s.id);
    const sessionToAssignment = new Map(sessions.map(s => [s.id, s.teaching_assignment_id]));

    // Get all attendance records in one query
    const allRecords = await prisma.attendanceRecord.groupBy({
        by: ['student_id', 'status'],
        where: {
            student_id: { in: studentIds },
            session_id: { in: sessionIds },
            is_deleted: false,
        },
        _count: { status: true },
    });

    // Build per-student per-assignment stats
    // We need per-assignment data, so fetch raw records with minimal select
    const rawRecords = await prisma.attendanceRecord.findMany({
        where: {
            student_id: { in: studentIds },
            session_id: { in: sessionIds },
            is_deleted: false,
        },
        select: {
            student_id: true,
            status: true,
            session_id: true,
        },
    });

    // Build nested map: studentId -> assignmentId -> { present, total }
    const studentAssignmentStats = new Map();
    rawRecords.forEach(r => {
        const assignmentId = sessionToAssignment.get(r.session_id);
        if (!assignmentId) return;

        if (!studentAssignmentStats.has(r.student_id)) {
            studentAssignmentStats.set(r.student_id, new Map());
        }
        const assignMap = studentAssignmentStats.get(r.student_id);
        if (!assignMap.has(assignmentId)) {
            assignMap.set(assignmentId, { present: 0, total: 0 });
        }
        const stats = assignMap.get(assignmentId);
        stats.total++;
        if (r.status === 'PRESENT') stats.present++;
    });

    // Build student summaries
    const studentSummaries = section.students.map(student => {
        const assignMap = studentAssignmentStats.get(student.id) || new Map();

        const subjectWise = teachingAssignments.map(assignment => {
            const totalSessions = sessionCountMap.get(assignment.id) || 0;
            const stats = assignMap.get(assignment.id) || { present: 0, total: 0 };

            return {
                subject: assignment.subject,
                total_sessions: totalSessions,
                attended: stats.present,
                absent: totalSessions - stats.present,
                percentage:
                    totalSessions > 0
                        ? parseFloat(((stats.present / totalSessions) * 100).toFixed(2))
                        : 0,
            };
        });

        const totalSessions = subjectWise.reduce((sum, s) => sum + s.total_sessions, 0);
        const totalAttended = subjectWise.reduce((sum, s) => sum + s.attended, 0);

        return {
            student: {
                id: student.id,
                stdId: student.stdId,
                roll_no: student.roll_no,
                name: student.user.fullname,
                email: student.user.email,
            },
            overall: {
                total_sessions: totalSessions,
                attended: totalAttended,
                absent: totalSessions - totalAttended,
                percentage:
                    totalSessions > 0
                        ? parseFloat(((totalAttended / totalSessions) * 100).toFixed(2))
                        : 0,
            },
            subjects: subjectWise,
        };
    });

    return {
        section: {
            id: section.id,
            name: section.name,
            department: section.department.name,
            semester: section.semester.number,
        },
        students: studentSummaries,
    };
};
