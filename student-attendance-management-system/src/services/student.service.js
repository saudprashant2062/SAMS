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
    const { subject_id, start_date, end_date } = filters;

    const whereClause = {
        student_id,
        is_deleted: false,
    };

    // Add date filters if provided
    if (start_date || end_date) {
        whereClause.session = {
            session_date: {},
        };
        if (start_date) whereClause.session.session_date.gte = new Date(start_date);
        if (end_date) whereClause.session.session_date.lte = new Date(end_date);
    }

    const attendanceRecords = await prisma.attendanceRecord.findMany({
        where: whereClause,
        include: {
            session: {
                include: {
                    teaching_assignment: {
                        include: {
                            subject: true,
                            section: true,
                            teacher: {
                                include: {
                                    user: {
                                        select: {
                                            fullname: true,
                                            email: true,
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

    // Filter by subject if provided
    let filteredRecords = attendanceRecords;
    if (subject_id) {
        filteredRecords = attendanceRecords.filter(
            record => record.session.teaching_assignment.subject_id === subject_id,
        );
    }

    // Transform records to frontend-friendly format
    const records = filteredRecords.map(record => ({
        id: record.id,
        date: record.session?.session_date,
        subject: record.session?.teaching_assignment?.subject?.name || 'Unknown',
        teacher: record.session?.teaching_assignment?.teacher?.user?.fullname || 'Unknown',
        status: record.status,
    }));

    // Calculate summary
    const total = records.length;
    const present = records.filter(r => r.status === 'PRESENT').length;
    const absent = records.filter(r => r.status === 'ABSENT').length;
    const percentage = total > 0 ? (present / total) * 100 : 0;

    // Get unique subjects for filter dropdown
    const subjectsMap = new Map();
    attendanceRecords.forEach(record => {
        const subject = record.session?.teaching_assignment?.subject;
        if (subject && !subjectsMap.has(subject.id)) {
            subjectsMap.set(subject.id, { id: subject.id, name: subject.name });
        }
    });
    const subjects = Array.from(subjectsMap.values());

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
            attendance_sessions: {
                where: { is_deleted: false },
                include: {
                    records: {
                        where: {
                            student_id,
                            is_deleted: false,
                        },
                    },
                },
            },
        },
    });

    // Calculate attendance summary for each subject
    const summary = teachingAssignments.map(assignment => {
        const totalSessions = assignment.attendance_sessions.length;
        const attendedSessions = assignment.attendance_sessions.filter(session =>
            session.records.some(record => record.status === 'PRESENT'),
        ).length;

        const attendancePercentage =
            totalSessions > 0 ? ((attendedSessions / totalSessions) * 100).toFixed(2) : 0;

        return {
            subject: {
                id: assignment.subject.id,
                name: assignment.subject.name,
                code: assignment.subject.code,
            },
            teacher: {
                name: assignment.teacher.user.fullname,
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

/* =====================================================
   GET STUDENT SUBJECTS
===================================================== */
export const getStudentSubjectsService = async student_id => {
    const student = await prisma.student.findUnique({
        where: { id: student_id },
        include: { section: true },
    });

    if (!student || student.is_deleted) {
        throw new ApiError(404, 'Student not found');
    }

    const teachingAssignments = await prisma.teachingAssignment.findMany({
        where: {
            section_id: student.section_id,
            is_deleted: false,
        },
        include: {
            subject: true,
            teacher: { include: { user: { select: userPublicSelect } } },
            attendance_sessions: {
                where: { is_deleted: false },
                include: {
                    records: {
                        where: {
                            student_id,
                            is_deleted: false,
                        },
                    },
                },
            },
        },
    });

    return teachingAssignments.map(assignment => {
        const totalClasses = assignment.attendance_sessions.length;
        const classesAttended = assignment.attendance_sessions.filter(session =>
            session.records.some(record => record.status === 'PRESENT'),
        ).length;
        const attendancePercentage = totalClasses > 0 ? (classesAttended / totalClasses) * 100 : 0;

        return {
            id: assignment.subject.id,
            name: assignment.subject.name,
            code: assignment.subject.code,
            teacher: assignment.teacher.user.fullname,
            teacherEmail: assignment.teacher.user.email,
            teacherPhoto: assignment.teacher.user.photo_url,
            totalClasses,
            classesAttended,
            attendancePercentage,
        };
    });
};

/* =====================================================
   GET STUDENT SECTION INFO
===================================================== */
export const getStudentSectionService = async student_id => {
    const student = await prisma.student.findUnique({
        where: { id: student_id },
        include: {
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
    });

    if (!student || student.is_deleted) {
        throw new ApiError(404, 'Student not found');
    }

    return {
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
        classmates: student.section.students.map(s => ({
            id: s.id,
            stdId: s.stdId,
            roll_no: s.roll_no,
            fullname: s.user.fullname,
            email: s.user.email,
            photo_url: s.user.photo_url,
        })),
    };
};
