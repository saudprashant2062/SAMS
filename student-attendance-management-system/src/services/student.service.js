import prisma from '../config/prisma.js';
import ApiError from '../utils/ApiError.utils.js';
import {
    userBasicSelect,
    userPublicSelect,
    sectionWithDeptSemInclude,
} from '../utils/prisma.selects.js';

/* =====================================================
   GET STUDENT ATTENDANCE RECORDS
===================================================== */
export const getStudentAttendanceService = async (student_id, filters = {}) => {
    const { subject_id, start_date, end_date, status } = filters;

    // First, get student to find section_id
    const student = await prisma.student.findUnique({
        where: { id: student_id },
        select: { section_id: true },
    });

    if (!student) {
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
        };
        if (start_date) whereClause.session.session_date.gte = new Date(start_date);
        if (end_date) whereClause.session.session_date.lte = new Date(end_date);
    }

    // Filter by subject_id (on the related session -> teaching_assignment)
    if (subject_id) {
        if (!whereClause.session) whereClause.session = {};
        whereClause.session.teaching_assignment = {
            subject_id: subject_id,
        };
    }

    const attendanceRecords = await prisma.attendanceRecord.findMany({
        where: whereClause,
        include: {
            session: {
                include: {
                    teaching_assignment: {
                        include: {
                            subject: true,
                            teacher: {
                                include: {
                                    user: {
                                        select: {
                                            fullname: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        orderBy: {
            created_at: 'desc',
        },
    });

    // Transform records to frontend-friendly format
    const records = attendanceRecords.map(record => ({
        id: record.id,
        date: record.session?.session_date,
        subject: record.session?.teaching_assignment?.subject?.name || 'Unknown',
        teacher: record.session?.teaching_assignment?.teacher?.user?.fullname || 'Unknown',
        status: record.status,
    }));

    // Calculate summary based on current filters (Reflecting the filtered view)
    // Note: If filters are active, this summary reflects the filtered dataset, which is usually correct for "results".
    const total = records.length;
    const present = records.filter(r => r.status === 'PRESENT').length;
    const absent = records.filter(r => r.status === 'ABSENT').length;
    const percentage = total > 0 ? (present / total) * 100 : 0;

    // Get ALL subjects for the dropdown filters (cached/independent of filters)
    const teachingAssignments = await prisma.teachingAssignment.findMany({
        where: {
            section_id: student.section_id,
            is_deleted: false,
        },
        include: {
            subject: true,
        },
    });

    const subjects = teachingAssignments.map(assignment => ({
        id: assignment.subject.id,
        name: assignment.subject.name,
    }));

    return {
        records,
        subjects,
        summary: { total, present, absent, percentage },
    };
};

/* =====================================================
   GET STUDENT ATTENDANCE SUMMARY
===================================================== */
export const getStudentAttendanceSummaryService = async student_id => {
    const student = await prisma.student.findUnique({
        where: { id: student_id },
        include: { section: true },
    });

    if (!student || student.is_deleted) {
        throw new ApiError(404, 'Student not found');
    }

    // Get all teaching assignments for student's section
    const teachingAssignments = await prisma.teachingAssignment.findMany({
        where: {
            section_id: student.section_id,
            is_deleted: false,
        },
        include: {
            subject: true,
            teacher: {
                include: {
                    user: {
                        select: {
                            fullname: true,
                        },
                    },
                },
            },
        },
    });

    // Use Promise.all to fetch counts in parallel
    const summary = await Promise.all(
        teachingAssignments.map(async assignment => {
            // Count total sessions for this subject/section
            const totalSessions = await prisma.attendanceSession.count({
                where: {
                    teaching_assignment_id: assignment.id,
                    is_deleted: false,
                },
            });

            // Count attended sessions (Present only)
            const attendedSessions = await prisma.attendanceRecord.count({
                where: {
                    student_id,
                    status: 'PRESENT',
                    is_deleted: false,
                    session: {
                        teaching_assignment_id: assignment.id,
                        is_deleted: false,
                    },
                },
            });

            const attendancePercentage =
                totalSessions > 0 ? ((attendedSessions / totalSessions) * 100).toFixed(2) : 0;

            return {
                subject: {
                    id: assignment.subject.id,
                    name: assignment.subject.name,
                    code: assignment.subject.code,
                },
                teacher: {
                    name: assignment.teacher?.user?.fullname || 'Unknown',
                },
                total_sessions: totalSessions,
                attended_sessions: attendedSessions,
                absent_sessions: totalSessions - attendedSessions,
                attendance_percentage: parseFloat(attendancePercentage),
            };
        })
    );

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
        include: { section: true },
    });

    if (!student || student.is_deleted) {
        throw new ApiError(404, 'Student not found');
    }

    // 2. Get teaching assignments
    const teachingAssignments = await prisma.teachingAssignment.findMany({
        where: {
            section_id: student.section_id,
            is_deleted: false,
        },
        include: {
            subject: true,
            teacher: { include: { user: { select: userPublicSelect } } },
        },
    });

    // 3. Aggregate Attendance Counts
    const subjects = await Promise.all(
        teachingAssignments.map(async assignment => {
            const totalClasses = await prisma.attendanceSession.count({
                where: {
                    teaching_assignment_id: assignment.id,
                    is_deleted: false,
                },
            });

            const classesAttended = await prisma.attendanceRecord.count({
                where: {
                    student_id,
                    status: 'PRESENT',
                    is_deleted: false,
                    session: {
                        teaching_assignment_id: assignment.id,
                        is_deleted: false,
                    },
                },
            });

            const attendancePercentage = totalClasses > 0 ? (classesAttended / totalClasses) * 100 : 0;

            return {
                id: assignment.subject.id,
                name: assignment.subject.name,
                code: assignment.subject.code,
                teacher: assignment.teacher?.user?.fullname || 'Unknown',
                teacherEmail: assignment.teacher?.user?.email,
                teacherPhoto: assignment.teacher?.user?.photo_url,
                totalClasses,
                classesAttended,
                attendancePercentage: parseFloat(attendancePercentage.toFixed(2)),
            };
        })
    );

    return subjects;
};

/* =====================================================
   GET STUDENT SECTION INFO
===================================================== */
export const getStudentSectionService = async student_id => {
    const student = await prisma.student.findUnique({
        where: { id: student_id },
        include: {
            batch: true,
            section: {
                include: {
                    ...sectionWithDeptSemInclude,
                    // students include removed for performance
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
        section: {
            id: student.section.id,
            name: student.section.name,
            batch_year: student.section.batch_year,
        },

        department: {
            id: student.section.department.id,
            name: student.section.department.name,
        },
        semester: {
            id: student.section.semester.id,
            number: student.section.semester.number,
        },
        // Classmates removed for performance (not used in dashboard)
        classmates: [],
    };
};
