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

/* =====================================================
   GET ALL ATTENDANCE SESSIONS (ADMIN)
===================================================== */
export const getAllAttendanceSessionsService = async (filters = {}) => {
    const { department_id, semester_id, section_id, subject_id, teacher_id, start_date, end_date } =
        filters;

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

    return prisma.attendanceSession.findMany({
        where,
        include: {
            teaching_assignment: {
                include: {
                    teacher: { include: { user: { select: userMinimalSelect } } },
                    subject: true,
                    section: { include: sectionWithDeptSemInclude },
                },
            },
            records: {
                where: { is_deleted: false },
                include: {
                    student: { include: { user: { select: userPublicSelect } } },
                },
            },
        },
        orderBy: { session_date: 'desc' },
    });
};

/* =====================================================
   GET ATTENDANCE SESSION BY ID (ADMIN)
===================================================== */
export const getAttendanceSessionByIdService = async id => {
    const session = await prisma.attendanceSession.findUnique({
        where: { id },
        include: {
            teaching_assignment: {
                include: {
                    teacher: { include: { user: { select: userMinimalSelect } } },
                    subject: true,
                    section: {
                        include: {
                            ...sectionWithDeptSemInclude,
                            students: {
                                where: { is_deleted: false },
                                include: { user: { select: userPublicSelect } },
                            },
                        },
                    },
                },
            },
            records: {
                where: { is_deleted: false },
                include: {
                    student: { include: { user: { select: userPublicSelect } } },
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
    const session = await prisma.attendanceSession.findUnique({ where: { id } });

    if (!session || session.is_deleted) {
        throw new ApiError(404, 'Attendance session not found');
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
   DELETE ATTENDANCE SESSION (SOFT DELETE WITH CASCADE)
===================================================== */
export const deleteAttendanceSessionService = async id => {
    const session = await prisma.attendanceSession.findUnique({
        where: { id },
        include: { records: true },
    });

    if (!session || session.is_deleted) {
        throw new ApiError(404, 'Attendance session not found');
    }

    // Soft delete cascade: session + all its records
    await prisma.$transaction([
        prisma.attendanceRecord.updateMany({
            where: { session_id: id },
            data: { is_deleted: true },
        }),
        prisma.attendanceSession.update({
            where: { id },
            data: { is_deleted: true },
        }),
    ]);

    return { message: 'Attendance session and records deleted' };
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
    const record = await prisma.attendanceRecord.findUnique({ where: { id } });

    if (!record || record.is_deleted) {
        throw new ApiError(404, 'Attendance record not found');
    }

    return prisma.attendanceRecord.update({
        where: { id },
        data: { status: data.status },
        include: {
            student: {
                include: {
                    user: {
                        select: { fullname: true, email: true },
                    },
                },
            },
            session: true,
        },
    });
};

/* =====================================================
   DELETE ATTENDANCE RECORD (SOFT DELETE)
===================================================== */
export const deleteAttendanceRecordService = async id => {
    const record = await prisma.attendanceRecord.findUnique({ where: { id } });

    if (!record || record.is_deleted) {
        throw new ApiError(404, 'Attendance record not found');
    }

    await prisma.attendanceRecord.update({
        where: { id },
        data: { is_deleted: true },
    });

    return { message: 'Attendance record deleted' };
};

/* =====================================================
   GET ATTENDANCE SUMMARY BY SECTION (ADMIN)
===================================================== */
export const getAttendanceSummaryBySectionService = async sectionId => {
    const section = await prisma.section.findUnique({
        where: { id: sectionId },
        include: {
            ...sectionWithDeptSemInclude,
            students: {
                where: { is_deleted: false },
                include: { user: { select: userMinimalSelect } },
            },
        },
    });

    if (!section || section.is_deleted) {
        throw new ApiError(404, 'Section not found');
    }

    const teachingAssignments = await prisma.teachingAssignment.findMany({
        where: { section_id: sectionId, is_deleted: false },
        include: {
            subject: true,
            attendance_sessions: {
                where: { is_deleted: false },
                include: { records: { where: { is_deleted: false } } },
            },
        },
    });

    const studentSummaries = section.students.map(student =>
        buildStudentSummary(student, teachingAssignments),
    );

    return {
        section: {
            id: section.id,
            name: section.name,
            batch_year: section.batch_year,
            department: section.department.name,
            semester: section.semester.number,
        },
        students: studentSummaries,
    };
};
