import prisma from '../config/prisma.js';
import ApiError from '../utils/ApiError.utils.js';
import {
    userBasicSelect,
    userPublicSelect,
    sectionWithDeptSemInclude,
} from '../utils/prisma.selects.js';
import { parsePagination, paginatedResponse } from '../utils/pagination.utils.js';

/* =====================================================
   GET STUDENT ATTENDANCE RECORDS (OPTIMIZED)
   - Uses pagination
   - Uses select instead of include for better performance
   - Avoids N+1 with single optimized query
===================================================== */
export const getStudentAttendanceService = async (student_id, filters = {}) => {
    const { subject_id, start_date, end_date, status, page, limit } = filters;
    const pagination = parsePagination({ page, limit });

    // First, get student to find section_id (minimal select)
    const student = await prisma.student.findUnique({
        where: { id: student_id },
        select: { section_id: true, is_deleted: true },
    });

    if (!student || student.is_deleted) {
        throw new ApiError(404, 'Student not found');
    }

    const whereClause = {
        student_id,
        is_deleted: false,
    };

    // Filter by status if provided
    if (status) {
        whereClause.status = status;
    }

    // Add date filters (on the related session)
    if (start_date || end_date) {
        whereClause.session = {
            session_date: {},
            is_deleted: false,
        };
        if (start_date) whereClause.session.session_date.gte = new Date(start_date);
        if (end_date) whereClause.session.session_date.lte = new Date(end_date);
    }

    // Filter by subject_id (on the related session -> teaching_assignment)
    if (subject_id) {
        if (!whereClause.session) whereClause.session = { is_deleted: false };
        whereClause.session.teaching_assignment = {
            subject_id: subject_id,
            is_deleted: false,
        };
    }

    // Get total count for pagination
    const totalCount = await prisma.attendanceRecord.count({ where: whereClause });

    // Use select instead of include for better performance
    const attendanceRecords = await prisma.attendanceRecord.findMany({
        where: whereClause,
        select: {
            id: true,
            status: true,
            session: {
                select: {
                    session_date: true,
                    teaching_assignment: {
                        select: {
                            subject: {
                                select: { id: true, name: true },
                            },
                            teacher: {
                                select: {
                                    user: {
                                        select: { fullname: true },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        orderBy: { created_at: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
    });

    // Transform records to frontend-friendly format
    const records = attendanceRecords.map(record => ({
        id: record.id,
        date: record.session?.session_date,
        subject: record.session?.teaching_assignment?.subject?.name || 'Unknown',
        teacher: record.session?.teaching_assignment?.teacher?.user?.fullname || 'Unknown',
        status: record.status,
    }));

    // Use groupBy to calculate summary efficiently (avoids fetching all records)
    const summaryData = await prisma.attendanceRecord.groupBy({
        by: ['status'],
        where: whereClause,
        _count: { status: true },
    });

    const present = summaryData.find(s => s.status === 'PRESENT')?._count?.status || 0;
    const absent = summaryData.find(s => s.status === 'ABSENT')?._count?.status || 0;
    const total = present + absent;
    const percentage = total > 0 ? (present / total) * 100 : 0;

    // Get ALL subjects for the dropdown filters using select (not include)
    const teachingAssignments = await prisma.teachingAssignment.findMany({
        where: {
            section_id: student.section_id,
            is_deleted: false,
        },
        select: {
            subject: {
                select: { id: true, name: true },
            },
        },
    });

    const subjects = teachingAssignments.map(assignment => ({
        id: assignment.subject.id,
        name: assignment.subject.name,
    }));

    return {
        ...paginatedResponse(records, totalCount, pagination),
        subjects,
        summary: { total, present, absent, percentage },
    };
};

/* =====================================================
   GET STUDENT ATTENDANCE SUMMARY (OPTIMIZED)
   - Uses groupBy to avoid N+1 queries
   - Fetches all counts in parallel single query
===================================================== */
export const getStudentAttendanceSummaryService = async student_id => {
    const student = await prisma.student.findUnique({
        where: { id: student_id },
        select: {
            id: true,
            stdId: true,
            roll_no: true,
            section_id: true,
            is_deleted: true,
        },
    });

    if (!student || student.is_deleted) {
        throw new ApiError(404, 'Student not found');
    }

    // Get all teaching assignments for student's section with minimal data
    const teachingAssignments = await prisma.teachingAssignment.findMany({
        where: {
            section_id: student.section_id,
            is_deleted: false,
        },
        select: {
            id: true,
            subject: {
                select: { id: true, name: true, code: true, credit_hours: true },
            },
            teacher: {
                select: {
                    user: {
                        select: { fullname: true },
                    },
                },
            },
        },
    });

    const assignmentIds = teachingAssignments.map(a => a.id);

    // Use groupBy to get session counts per assignment (avoids N+1)
    const sessionCounts = await prisma.attendanceSession.groupBy({
        by: ['teaching_assignment_id'],
        where: {
            teaching_assignment_id: { in: assignmentIds },
            is_deleted: false,
        },
        _count: { id: true },
    });

    // Use groupBy to get attendance counts per assignment (avoids N+1)
    const attendanceCounts = await prisma.attendanceRecord.groupBy({
        by: ['session_id'],
        where: {
            student_id,
            status: 'PRESENT',
            is_deleted: false,
            session: {
                teaching_assignment_id: { in: assignmentIds },
                is_deleted: false,
            },
        },
        _count: { id: true },
    });

    // Get sessions with their assignment IDs for mapping
    const sessionsWithAssignment = await prisma.attendanceSession.findMany({
        where: {
            teaching_assignment_id: { in: assignmentIds },
            is_deleted: false,
        },
        select: {
            id: true,
            teaching_assignment_id: true,
        },
    });

    // Build lookup maps
    const sessionCountMap = new Map(
        sessionCounts.map(s => [s.teaching_assignment_id, s._count.id]),
    );

    const sessionToAssignmentMap = new Map(
        sessionsWithAssignment.map(s => [s.id, s.teaching_assignment_id]),
    );

    // Count attended sessions per assignment
    const attendedPerAssignment = new Map();
    attendanceCounts.forEach(a => {
        const assignmentId = sessionToAssignmentMap.get(a.session_id);
        if (assignmentId) {
            attendedPerAssignment.set(
                assignmentId,
                (attendedPerAssignment.get(assignmentId) || 0) + 1,
            );
        }
    });

    // Build summary
    const summary = teachingAssignments.map(assignment => {
        const totalSessions = sessionCountMap.get(assignment.id) || 0;
        const attendedSessions = attendedPerAssignment.get(assignment.id) || 0;
        const attendancePercentage =
            totalSessions > 0 ? ((attendedSessions / totalSessions) * 100).toFixed(2) : 0;

        return {
            subject: {
                id: assignment.subject.id,
                name: assignment.subject.name,
                code: assignment.subject.code,
                credit_hours: assignment.subject.credit_hours,
            },
            teacher: {
                name: assignment.teacher?.user?.fullname || 'Unknown',
            },
            total_sessions: totalSessions,
            attended_sessions: attendedSessions,
            absent_sessions: totalSessions - attendedSessions,
            attendance_percentage: parseFloat(attendancePercentage),
        };
    });

    // Calculate overall attendance
    const totalSessions = summary.reduce((sum, s) => sum + s.total_sessions, 0);
    const totalAttended = summary.reduce((sum, s) => sum + s.attended_sessions, 0);
    const overallPercentage =
        totalSessions > 0 ? ((totalAttended / totalSessions) * 100).toFixed(2) : 0;

    return {
        student: {
            id: student.id,
            stdId: student.stdId,
            roll_no: student.roll_no,
        },
        overall: {
            total_sessions: totalSessions,
            attended_sessions: totalAttended,
            absent_sessions: totalSessions - totalAttended,
            attendance_percentage: parseFloat(overallPercentage),
        },
        subjects: summary,
    };
};

export const getStudentSubjectsService = async student_id => {
    const student = await prisma.student.findUnique({
        where: { id: student_id },
        select: { section_id: true, is_deleted: true },
    });

    if (!student || student.is_deleted) {
        throw new ApiError(404, 'Student not found');
    }

    // Get teaching assignments with select (not include)
    const teachingAssignments = await prisma.teachingAssignment.findMany({
        where: {
            section_id: student.section_id,
            is_deleted: false,
        },
        select: {
            id: true,
            subject: {
                select: { id: true, name: true, code: true, credit_hours: true },
            },
            teacher: {
                select: {
                    user: {
                        select: {
                            fullname: true,
                            email: true,
                            photo_url: true,
                        },
                    },
                },
            },
        },
    });

    const assignmentIds = teachingAssignments.map(a => a.id);

    // Use groupBy for session counts (avoids N+1)
    const sessionCounts = await prisma.attendanceSession.groupBy({
        by: ['teaching_assignment_id'],
        where: {
            teaching_assignment_id: { in: assignmentIds },
            is_deleted: false,
        },
        _count: { id: true },
    });

    // Get sessions for attendance mapping
    const sessions = await prisma.attendanceSession.findMany({
        where: {
            teaching_assignment_id: { in: assignmentIds },
            is_deleted: false,
        },
        select: { id: true, teaching_assignment_id: true },
    });

    const sessionIds = sessions.map(s => s.id);
    const sessionToAssignment = new Map(sessions.map(s => [s.id, s.teaching_assignment_id]));

    // Get attended sessions in one query
    const attendedRecords = await prisma.attendanceRecord.findMany({
        where: {
            student_id,
            status: 'PRESENT',
            is_deleted: false,
            session_id: { in: sessionIds },
        },
        select: { session_id: true },
    });

    // Build maps
    const sessionCountMap = new Map(
        sessionCounts.map(s => [s.teaching_assignment_id, s._count.id]),
    );

    const attendedPerAssignment = new Map();
    attendedRecords.forEach(r => {
        const assignmentId = sessionToAssignment.get(r.session_id);
        if (assignmentId) {
            attendedPerAssignment.set(
                assignmentId,
                (attendedPerAssignment.get(assignmentId) || 0) + 1,
            );
        }
    });

    // Build response
    const subjects = teachingAssignments.map(assignment => {
        const totalClasses = sessionCountMap.get(assignment.id) || 0;
        const classesAttended = attendedPerAssignment.get(assignment.id) || 0;
        const attendancePercentage = totalClasses > 0 ? (classesAttended / totalClasses) * 100 : 0;

        return {
            id: assignment.subject.id,
            name: assignment.subject.name,
            code: assignment.subject.code,
            creditHours: assignment.subject.credit_hours || 0,
            teacher: assignment.teacher?.user?.fullname || 'Unknown',
            teacherEmail: assignment.teacher?.user?.email,
            teacherPhoto: assignment.teacher?.user?.photo_url,
            totalClasses,
            classesAttended,
            attendancePercentage: parseFloat(attendancePercentage.toFixed(2)),
        };
    });

    return subjects;
};

/* =====================================================
   GET STUDENT SECTION INFO (OPTIMIZED)
   - Uses select instead of include
===================================================== */
export const getStudentSectionService = async student_id => {
    const student = await prisma.student.findUnique({
        where: { id: student_id },
        select: {
            is_deleted: true,
            batch: {
                select: {
                    id: true,
                    name: true,
                    start_year: true,
                    end_year: true,
                },
            },
            section: {
                select: {
                    id: true,
                    name: true,
                    department: {
                        select: { id: true, name: true },
                    },
                    semester: {
                        select: { id: true, number: true },
                    },
                },
            },
        },
    });

    if (!student || student.is_deleted) {
        throw new ApiError(404, 'Student not found');
    }

    return {
        batch: student.batch
            ? {
                  id: student.batch.id,
                  name: student.batch.name,
                  start_year: student.batch.start_year,
                  end_year: student.batch.end_year,
              }
            : null,
        section: student.section
            ? {
                  id: student.section.id,
                  name: student.section.name,
              }
            : null,
        department: student.section?.department
            ? {
                  id: student.section.department.id,
                  name: student.section.department.name,
              }
            : null,
        semester: student.section?.semester
            ? {
                  id: student.section.semester.id,
                  number: student.section.semester.number,
              }
            : null,
        classmates: [],
    };
};
