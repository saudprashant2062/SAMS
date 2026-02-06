import prisma from '../../config/prisma.js';
import ApiError from '../../utils/ApiError.utils.js';
import { userPublicSelect, userMinimalSelect } from '../../utils/prisma.selects.js';
import { logActivity } from '../admin/activityLog.service.js';

/**
 * Shared attendance functions used by both Teacher and Admin services
 * Reduces code duplication across attendance-related operations
 */

/* =====================================================
   VERIFY SESSION ACCESS
===================================================== */
export const verifySessionAccess = async (sessionId, teacherId = null, isAdmin = false) => {
    const session = await prisma.attendanceSession.findUnique({
        where: { id: sessionId },
        include: { teaching_assignment: true },
    });

    if (!session || session.is_deleted) {
        throw new ApiError(404, 'Attendance session not found');
    }

    if (!isAdmin && teacherId && session.teaching_assignment.teacher_id !== teacherId) {
        throw new ApiError(403, 'Not authorized to access this session');
    }

    return session;
};

/* =====================================================
   VERIFY ASSIGNMENT ACCESS
===================================================== */
export const verifyAssignmentAccess = async (assignmentId, teacherId = null, isAdmin = false) => {
    const assignment = await prisma.teachingAssignment.findUnique({
        where: { id: assignmentId },
        include: {
            section: {
                include: {
                    students: { where: { is_deleted: false } },
                },
            },
        },
    });

    if (!assignment || assignment.is_deleted) {
        throw new ApiError(404, 'Teaching assignment not found');
    }

    if (!isAdmin && teacherId && assignment.teacher_id !== teacherId) {
        throw new ApiError(403, 'Not authorized to access this assignment');
    }

    return assignment;
};

/* =====================================================
   CREATE ATTENDANCE SESSION (SHARED)
===================================================== */
export const createSession = async (
    teachingAssignmentId,
    sessionDate,
    teacherId = null,
    isAdmin = false,
) => {
    const assignment = await verifyAssignmentAccess(teachingAssignmentId, teacherId, isAdmin);

    // Validate that session date is not in the future
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    const selectedDate = sessionDate ? new Date(sessionDate) : new Date();

    if (selectedDate > today) {
        throw new ApiError(400, 'Cannot create attendance session for a future date');
    }

    // Prevent duplicate sessions for the same assignment on the same day
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingSession = await prisma.attendanceSession.findFirst({
        where: {
            teaching_assignment_id: teachingAssignmentId,
            session_date: {
                gte: startOfDay,
                lte: endOfDay,
            },
            is_deleted: false,
        },
    });

    if (existingSession) {
        throw new ApiError(400, 'An attendance session already exists for this subject on this date');
    }

    // Use transaction to create session and initialize records
    return prisma.$transaction(async tx => {
        const session = await tx.attendanceSession.create({
            data: {
                teaching_assignment: { connect: { id: teachingAssignmentId } },
                section: { connect: { id: assignment.section.id } },
                session_date: selectedDate,
            },
            include: {
                teaching_assignment: {
                    include: {
                        subject: true,
                        section: true,
                    },
                },
            },
        });

        // Automatically initialize attendance records for all students in the section (default: PRESENT)
        if (assignment.section.students && assignment.section.students.length > 0) {
            const initialRecords = assignment.section.students.map(student => ({
                session_id: session.id,
                student_id: student.id,
                status: 'PRESENT',
            }));

            await tx.attendanceRecord.createMany({
                data: initialRecords,
            });
        }

        return session;
    });
};

/* =====================================================
   MARK/UPDATE ATTENDANCE RECORDS (SHARED)
===================================================== */
export const markAttendance = async (sessionId, records, teacherId = null, isAdmin = false) => {
    const session = await verifySessionAccess(sessionId, teacherId, isAdmin);

    // Get session details for activity logging
    const teachingAssignment = await prisma.teachingAssignment.findUnique({
        where: { id: session.teaching_assignment_id },
        include: {
            subject: true,
            section: true,
            teacher: { include: { user: true } },
        },
    });

    // Optimize: Use Promise.all for parallel execution instead of sequential loop
    // This drastically reduces latency for large classes
    const validRecords = [];
    
    // First validate students (fast parallel reads)
    const studentChecks = await Promise.all(
        records.map(async (record) => {
            const student = await prisma.student.findUnique({
                where: { id: record.student_id },
                select: { id: true, is_deleted: true }
            });
            return { record, student };
        })
    );

    // Filter valid students
    for (const { record, student } of studentChecks) {
        if (student && !student.is_deleted) {
            validRecords.push(record);
        }
    }

    // Check if session exists (to determine action type for logging)
    // We strictly check the first record to guess, or query the DB.
    // Actually, we can check count of existing records for this session.
    const existingCount = await prisma.attendanceRecord.count({
        where: { session_id: sessionId }
    });
    const isNewSession = existingCount === 0;

    // Execute upserts in parallel
    const updatedRecords = await Promise.all(
        validRecords.map(record => 
            prisma.attendanceRecord.upsert({
                where: {
                    session_id_student_id: {
                        session_id: sessionId,
                        student_id: record.student_id,
                    },
                },
                update: { status: record.status, is_deleted: false },
                create: {
                    session_id: sessionId,
                    student_id: record.student_id,
                    status: record.status,
                },
                include: {
                    student: {
                        include: { user: { select: userMinimalSelect } },
                    },
                },
            })
        )
    );

    // Log activity only once after all records are processed
    // Only log if we have a valid teacher/admin context
    if (teacherId || isAdmin) {
        const presentCount = updatedRecords.filter(r => r.status === 'PRESENT').length;
        const totalCount = updatedRecords.length;

        try {
            // Get the actual user_id from the teacher's user record (not teacher_id)
            const actorUserId = teachingAssignment?.teacher?.user?.id || null;

            if (actorUserId) {
                await logActivity({
                    user_id: actorUserId,
                    action: isNewSession ? 'CREATE' : 'UPDATE',
                    entity_type: 'ATTENDANCE',
                    entity_id: sessionId,
                    description: `Marked attendance for ${teachingAssignment?.subject?.name || 'Unknown'} - ${teachingAssignment?.section?.name || 'Unknown'} (${presentCount}/${totalCount} present)`,
                });
            }
        } catch (logError) {
            // Don't fail the main operation if logging fails
            if (process.env.NODE_ENV === 'development') {
                console.error('Failed to log activity:', logError);
            }
        }
    }

    return updatedRecords;
};

/* =====================================================
   GET ATTENDANCE RECORDS FOR SESSION (SHARED)
===================================================== */
export const getSessionRecords = async (sessionId, teacherId = null, isAdmin = false) => {
    const session = await prisma.attendanceSession.findUnique({
        where: { id: sessionId },
        include: {
            teaching_assignment: true,
            records: {
                where: { is_deleted: false },
                include: {
                    student: {
                        include: { user: { select: userPublicSelect } },
                    },
                },
                orderBy: { student: { roll_no: 'asc' } },
            },
        },
    });

    if (!session || session.is_deleted) {
        throw new ApiError(404, 'Attendance session not found');
    }

    if (!isAdmin && teacherId && session.teaching_assignment.teacher_id !== teacherId) {
        throw new ApiError(403, 'Not authorized to view this session');
    }

    return session.records;
};

/* =====================================================
   CALCULATE ATTENDANCE PERCENTAGE
===================================================== */
export const calculatePercentage = (attended, total) => {
    if (total === 0) return 0;
    return parseFloat(((attended / total) * 100).toFixed(2));
};

/* =====================================================
   BUILD STUDENT ATTENDANCE SUMMARY
===================================================== */
export const buildStudentSummary = (student, teachingAssignments) => {
    const subjectWise = teachingAssignments.map(assignment => {
        const totalSessions = assignment.attendance_sessions.length;
        const attended = assignment.attendance_sessions.filter(session =>
            session.records.some(r => r.student_id === student.id && r.status === 'PRESENT'),
        ).length;

        return {
            subject: assignment.subject,
            total_sessions: totalSessions,
            attended,
            absent: totalSessions - attended,
            percentage: calculatePercentage(attended, totalSessions),
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
            percentage: calculatePercentage(totalAttended, totalSessions),
        },
        subjects: subjectWise,
    };
};
