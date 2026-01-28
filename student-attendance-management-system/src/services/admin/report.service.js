import prisma from '../../config/prisma.js';
import ApiError from '../../utils/ApiError.utils.js';
import { userMinimalSelect, sectionWithDeptSemInclude } from '../../utils/prisma.selects.js';

/* =====================================================
   GET ATTENDANCE REPORT
===================================================== */
export const getAttendanceReportService = async (filters = {}) => {
    const { department_id, semester_id, section_id, subject_id, start_date, end_date } = filters;

    // Build where clause for sections
    const sectionWhere = { is_deleted: false };
    if (section_id) sectionWhere.id = section_id;
    if (department_id) sectionWhere.department_id = department_id;
    if (semester_id) sectionWhere.semester_id = semester_id;

    // Get sections with students
    const sections = await prisma.section.findMany({
        where: sectionWhere,
        include: {
            department: true,
            semester: true,
            students: {
                where: { is_deleted: false },
                include: { user: { select: userMinimalSelect } },
            },
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

    // Build where clause for attendance sessions
    const sessionWhere = { is_deleted: false };
    if (subject_id) {
        sessionWhere.teaching_assignment = { subject_id };
    }

    // Filter by section ids from our section query
    const sectionIds = sections.map(s => s.id);
    if (!sessionWhere.teaching_assignment) {
        sessionWhere.teaching_assignment = {};
    }
    sessionWhere.teaching_assignment.section_id = { in: sectionIds };

    // Date filters
    if (start_date || end_date) {
        sessionWhere.session_date = {};
        if (start_date) sessionWhere.session_date.gte = new Date(start_date);
        if (end_date) sessionWhere.session_date.lte = new Date(end_date);
    }

    // Get all attendance sessions
    const sessions = await prisma.attendanceSession.findMany({
        where: sessionWhere,
        include: {
            teaching_assignment: {
                include: {
                    subject: true,
                    section: true,
                },
            },
            records: {
                where: { is_deleted: false },
            },
        },
    });

    // Build student attendance data
    const studentData = [];
    let totalPresent = 0;
    let totalRecords = 0;

    for (const section of sections) {
        for (const student of section.students) {
            // Get all attendance records for this student
            const studentRecords = sessions.flatMap(session =>
                session.records.filter(r => r.student_id === student.id),
            );

            const present = studentRecords.filter(r => r.status === 'PRESENT').length;
            const absent = studentRecords.filter(r => r.status === 'ABSENT').length;
            const total = studentRecords.length;

            totalPresent += present;
            totalRecords += total;

            const attendancePercentage = total > 0 ? (present / total) * 100 : 0;

            studentData.push({
                id: student.id,
                name: student.user?.fullname || 'N/A',
                email: student.user?.email || 'N/A',
                roll_no: student.roll_no,
                section: section.name,
                department: section.department?.name || 'N/A',
                semester: section.semester?.name || 'N/A',
                totalClasses: total,
                present,
                absent,
                attendancePercentage: parseFloat(attendancePercentage.toFixed(2)),
            });
        }
    }

    const avgAttendance = totalRecords > 0 ? (totalPresent / totalRecords) * 100 : 0;
    const lowAttendanceCount = studentData.filter(s => s.attendancePercentage < 80).length;

    return {
        summary: {
            totalStudents: studentData.length,
            totalClasses: sessions.length,
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
        include: {
            sections: {
                where: {
                    is_deleted: false,
                    ...(semester_id && { semester_id }),
                    ...(section_id && { id: section_id }),
                },
                include: {
                    semester: true,
                    students: {
                        where: { is_deleted: false },
                        include: { user: { select: userMinimalSelect } },
                    },
                },
            },
        },
    });

    const result = [];

    for (const dept of departments) {
        const deptData = {
            department: dept.name,
            departmentId: dept.id,
            sections: [],
        };

        for (const section of dept.sections) {
            // Build where clause for attendance sessions
            const sessionWhere = {
                is_deleted: false,
                teaching_assignment: {
                    section_id: section.id,
                    ...(subject_id && { subject_id }),
                },
            };

            if (start_date || end_date) {
                sessionWhere.session_date = {};
                if (start_date) sessionWhere.session_date.gte = new Date(start_date);
                if (end_date) sessionWhere.session_date.lte = new Date(end_date);
            }

            const sessions = await prisma.attendanceSession.findMany({
                where: sessionWhere,
                include: {
                    teaching_assignment: { include: { subject: true } },
                    records: { where: { is_deleted: false } },
                },
            });

            // Group by subject
            const subjectMap = new Map();

            for (const session of sessions) {
                const subjectId = session.teaching_assignment.subject_id;
                const subjectName = session.teaching_assignment.subject?.name || 'Unknown';

                if (!subjectMap.has(subjectId)) {
                    subjectMap.set(subjectId, {
                        subjectId,
                        subjectName,
                        totalSessions: 0,
                        studentRecords: new Map(),
                    });
                }

                const subjectData = subjectMap.get(subjectId);
                subjectData.totalSessions++;

                for (const record of session.records) {
                    if (!subjectData.studentRecords.has(record.student_id)) {
                        subjectData.studentRecords.set(record.student_id, {
                            present: 0,
                            absent: 0,
                            total: 0,
                        });
                    }
                    const sr = subjectData.studentRecords.get(record.student_id);
                    sr.total++;
                    if (record.status === 'PRESENT') sr.present++;
                    else if (record.status === 'ABSENT') sr.absent++;
                }
            }

            const sectionData = {
                sectionId: section.id,
                sectionName: section.name,
                semester: section.semester?.name || 'N/A',
                totalStudents: section.students.length,
                subjects: [],
            };

            for (const [, subjectData] of subjectMap) {
                const students = section.students.map(student => {
                    const record = subjectData.studentRecords.get(student.id) || {
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
                    subjectId: subjectData.subjectId,
                    subjectName: subjectData.subjectName,
                    totalSessions: subjectData.totalSessions,
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
