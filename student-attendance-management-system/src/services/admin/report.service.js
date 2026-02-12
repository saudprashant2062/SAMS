import prisma from '../../config/prisma.js';
import ApiError from '../../utils/ApiError.utils.js';
import { userMinimalSelect } from '../../utils/prisma.selects.js';

/* =====================================================
   GET ATTENDANCE REPORT
===================================================== */
export const getAttendanceReportService = async (filters = {}) => {
    const { department_id, semester_id, section_id, subject_id, start_date, end_date } = filters;

    // 1. Build where clause for sections
    const sectionWhere = { is_deleted: false };
    if (section_id) sectionWhere.id = section_id;
    if (department_id) sectionWhere.department_id = department_id;
    if (semester_id) sectionWhere.semester_id = semester_id;

    // 2. Fetch Sections (lightweight)
    const sections = await prisma.section.findMany({
        where: sectionWhere,
        select: {
            id: true,
            name: true,
            department: { select: { id: true, name: true } },
            semester: { select: { id: true, name: true, number: true } },
        },
    });

    if (sections.length === 0) {
        return {
            summary: {
                totalStudents: 0,
                totalClasses: 0,
                avgAttendance: 0,
                lowAttendanceCount: 0,
            },
            students: [],
        };
    }

    const sectionIds = sections.map(s => s.id);

    // 3. Fetch Students in these sections
    const students = await prisma.student.findMany({
        where: {
            section_id: { in: sectionIds },
            is_deleted: false,
        },
        select: {
            id: true,
            roll_no: true,
            section_id: true,
            user: {
                select: {
                    fullname: true,
                    email: true,
                },
            },
        },
    });

    const studentIds = students.map(s => s.id);

    // 4. Build session filters
    const sessionWhere = {
        is_deleted: false,
        teaching_assignment: {
            section_id: { in: sectionIds },
        },
    };

    if (subject_id) {
        sessionWhere.teaching_assignment.subject_id = subject_id;
    }

    if (start_date || end_date) {
        sessionWhere.session_date = {};
        if (start_date) sessionWhere.session_date.gte = new Date(start_date);
        if (end_date) sessionWhere.session_date.lte = new Date(end_date);
    }

    // 5. Aggregate Attendance Records using groupBy
    // This replaces fetching all records and looping
    const analytics = await prisma.attendanceRecord.groupBy({
        by: ['student_id', 'status'],
        where: {
            student_id: { in: studentIds },
            is_deleted: false,
            session: sessionWhere,
        },
        _count: {
            status: true,
        },
    });

    // 6. Map analytics to student ID
    const statsMap = new Map();
    analytics.forEach(entry => {
        const sid = entry.student_id;
        if (!statsMap.has(sid)) statsMap.set(sid, { present: 0, absent: 0 });
        const stat = statsMap.get(sid);
        if (entry.status === 'PRESENT') stat.present += entry._count.status;
        else if (entry.status === 'ABSENT') stat.absent += entry._count.status;
    });

    // 7. Calculate Global Session Count (for summary)
    const totalSessions = await prisma.attendanceSession.count({
        where: sessionWhere,
    });

    // 8. Build Result Data
    let totalPresentSum = 0;
    let totalRecordsSum = 0;

    const studentData = students.map(student => {
        const section = sections.find(s => s.id === student.section_id);
        const stats = statsMap.get(student.id) || { present: 0, absent: 0 };
        const total = stats.present + stats.absent;
        const percentage = total > 0 ? (stats.present / total) * 100 : 0;

        totalPresentSum += stats.present;
        totalRecordsSum += total;

        return {
            id: student.id,
            name: student.user?.fullname || 'N/A',
            email: student.user?.email || 'N/A',
            roll_no: student.roll_no,
            section: section?.name || 'Unknown',
            department: section?.department?.name || 'N/A',
            semester: section?.semester?.name || 'N/A',
            totalClasses: total,
            present: stats.present,
            absent: stats.absent,
            attendancePercentage: parseFloat(percentage.toFixed(2)),
        };
    });

    const avgAttendance = totalRecordsSum > 0 ? (totalPresentSum / totalRecordsSum) * 100 : 0;
    const lowAttendanceCount = studentData.filter(s => s.attendancePercentage < 80).length;

    return {
        summary: {
            totalStudents: studentData.length,
            totalClasses: totalSessions,
            avgAttendance: parseFloat(avgAttendance.toFixed(2)),
            lowAttendanceCount,
        },
        students: studentData.sort((a, b) => a.attendancePercentage - b.attendancePercentage),
    };
};

/* =====================================================
   EXPORT ATTENDANCE REPORT AS CSV
===================================================== */
export const exportAttendanceReportService = async (filters = {}) => {
    const report = await getAttendanceReportService(filters);

    // CSV header
    const headers = [
        'Roll No',
        'Name',
        'Email',
        'Section',
        'Department',
        'Semester',
        'Total Classes',
        'Present',
        'Absent',
        'Attendance %',
    ];

    // CSV rows
    const rows = report.students.map(student => [
        student.roll_no || '',
        student.name || '',
        student.email || '',
        student.section || '',
        student.department || '',
        student.semester || '',
        student.totalClasses || 0,
        student.present || 0,
        student.absent || 0,
        `${student.attendancePercentage || 0}%`,
    ]);

    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

    return csvContent;
};

/* =====================================================
   GET DEPARTMENT-WISE ATTENDANCE REPORT
===================================================== */
export const getDepartmentAttendanceReportService = async (filters = {}) => {
    const { department_id, semester_id, section_id, subject_id, start_date, end_date } = filters;

    // Get all departments or specific one
    const departmentWhere = { is_deleted: false };
    if (department_id) departmentWhere.id = department_id;

    const departments = await prisma.department.findMany({
        where: departmentWhere,
        select: {
            id: true,
            name: true,
            sections: {
                where: {
                    is_deleted: false,
                    ...(semester_id && { semester_id }),
                    ...(section_id && { id: section_id }),
                },
                select: {
                    id: true,
                    name: true,
                    semester: { select: { id: true, name: true, number: true } },
                    students: {
                        where: { is_deleted: false },
                        select: {
                            id: true,
                            roll_no: true,
                            user: { select: userMinimalSelect },
                        },
                    },
                },
            },
        },
    });

    // Build where clause for attendance sessions - Get all sessions at once
    const sectionIds = departments.flatMap(dept => dept.sections.map(s => s.id));

    if (sectionIds.length === 0) return [];

    const sessionWhere = {
        is_deleted: false,
        teaching_assignment: {
            section_id: { in: sectionIds },
            ...(subject_id && { subject_id }),
        },
    };

    if (start_date || end_date) {
        sessionWhere.session_date = {};
        if (start_date) sessionWhere.session_date.gte = new Date(start_date);
        if (end_date) sessionWhere.session_date.lte = new Date(end_date);
    }

    // Fetch sessions with only needed fields (avoid loading full records with select)
    const allSessions = await prisma.attendanceSession.findMany({
        where: sessionWhere,
        select: {
            id: true,
            teaching_assignment: {
                select: {
                    section_id: true,
                    subject_id: true,
                    subject: { select: { name: true } },
                },
            },
        },
    });

    // Collect session IDs and build session-to-section/subject mapping
    const sessionIds = allSessions.map(s => s.id);

    // Group sessions by section + subject for counting
    const sessionsBySection = new Map(); // sectionId -> Map<subjectId, { subjectName, totalSessions }>
    for (const session of allSessions) {
        const sectionId = session.teaching_assignment.section_id;
        const subjectId = session.teaching_assignment.subject_id;
        const subjectName = session.teaching_assignment.subject?.name || 'Unknown';

        if (!sessionsBySection.has(sectionId)) sessionsBySection.set(sectionId, new Map());
        const subjectMap = sessionsBySection.get(sectionId);
        if (!subjectMap.has(subjectId)) {
            subjectMap.set(subjectId, { subjectId, subjectName, totalSessions: 0 });
        }
        subjectMap.get(subjectId).totalSessions++;
    }

    // Use groupBy for attendance records instead of loading ALL records
    const recordStats = await prisma.attendanceRecord.groupBy({
        by: ['student_id', 'status'],
        where: {
            is_deleted: false,
            session_id: { in: sessionIds },
        },
        _count: { status: true },
    });

    // We also need per-subject stats, so fetch with session info
    // Use a single query with select to get student_id, status, and session's subject
    const recordsWithSubject = await prisma.attendanceRecord.findMany({
        where: {
            is_deleted: false,
            session_id: { in: sessionIds },
        },
        select: {
            student_id: true,
            status: true,
            session: {
                select: {
                    teaching_assignment: {
                        select: { section_id: true, subject_id: true },
                    },
                },
            },
        },
    });

    // Build nested map: sectionId -> subjectId -> studentId -> { present, absent, total }
    const statsMap = new Map();
    for (const record of recordsWithSubject) {
        const sectionId = record.session.teaching_assignment.section_id;
        const subjectId = record.session.teaching_assignment.subject_id;
        const studentId = record.student_id;

        if (!statsMap.has(sectionId)) statsMap.set(sectionId, new Map());
        const sectionMap = statsMap.get(sectionId);
        if (!sectionMap.has(subjectId)) sectionMap.set(subjectId, new Map());
        const subjectStats = sectionMap.get(subjectId);
        if (!subjectStats.has(studentId))
            subjectStats.set(studentId, { present: 0, absent: 0, total: 0 });

        const sr = subjectStats.get(studentId);
        sr.total++;
        if (record.status === 'PRESENT') sr.present++;
        else if (record.status === 'ABSENT') sr.absent++;
    }

    const result = [];

    for (const dept of departments) {
        const deptData = {
            department: dept.name,
            departmentId: dept.id,
            sections: [],
        };

        for (const section of dept.sections) {
            const subjectMap = sessionsBySection.get(section.id) || new Map();
            const sectionStats = statsMap.get(section.id) || new Map();

            const sectionData = {
                sectionId: section.id,
                sectionName: section.name,
                semester: section.semester?.name || 'N/A',
                totalStudents: section.students.length,
                subjects: [],
            };

            for (const [subjectId, subjectInfo] of subjectMap) {
                const subjectStudentStats = sectionStats.get(subjectId) || new Map();

                const students = section.students.map(student => {
                    const record = subjectStudentStats.get(student.id) || {
                        present: 0,
                        absent: 0,
                        total: 0,
                    };
                    const percentage =
                        record.total > 0 ? ((record.present / record.total) * 100).toFixed(2) : 0;

                    return {
                        studentId: student.id,
                        name: student.user?.fullname || 'N/A',
                        email: student.user?.email || 'N/A',
                        rollNo: student.roll_no,
                        present: record.present,
                        absent: record.absent,
                        total: record.total,
                        percentage: parseFloat(percentage),
                    };
                });

                sectionData.subjects.push({
                    subjectId: subjectInfo.subjectId,
                    subjectName: subjectInfo.subjectName,
                    totalSessions: subjectInfo.totalSessions,
                    students,
                });
            }

            deptData.sections.push(sectionData);
        }

        result.push(deptData);
    }

    return result;
};

/* =====================================================
   EXPORT DEPARTMENT-WISE ATTENDANCE CSV
===================================================== */
export const exportDepartmentAttendanceCsvService = async (filters = {}) => {
    const report = await getDepartmentAttendanceReportService(filters);

    const headers = [
        'Department',
        'Section',
        'Semester',
        'Subject',
        'Roll No',
        'Student Name',
        'Email',
        'Total Classes',
        'Present',
        'Absent',
        'Attendance %',
    ];

    const rows = [];

    for (const dept of report) {
        for (const section of dept.sections) {
            for (const subject of section.subjects) {
                for (const student of subject.students) {
                    rows.push([
                        dept.department,
                        section.sectionName,
                        section.semester,
                        subject.subjectName,
                        student.rollNo || '',
                        student.name,
                        student.email,
                        student.total,
                        student.present,
                        student.absent,
                        `${student.percentage}%`,
                    ]);
                }
            }
        }
    }

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

    return csvContent;
};
