import prisma from '../../config/prisma.js';
import ApiError from '../../utils/ApiError.utils.js';
import {
    userMinimalSelect,
    userPublicSelect,
    sectionWithDeptSemInclude,
} from '../../utils/prisma.selects.js';

export const createTeachingAssignment = async ({ teacher_id, section_id, subject_id }) => {
    const teacher = await prisma.teacher.findUnique({ where: { id: teacher_id } });
    if (!teacher || teacher.is_deleted) throw new ApiError(404, 'Teacher not found');

    const section = await prisma.section.findUnique({ where: { id: section_id } });
    if (!section || section.is_deleted) throw new ApiError(404, 'Section not found');

    const subject = await prisma.subject.findUnique({ where: { id: subject_id } });
    if (!subject || subject.is_deleted) throw new ApiError(404, 'Subject not found');

    // Check if subject/section match same semester
    if (section.semester_id !== subject.semester_id)
        throw new ApiError(400, 'Subject and Section semester mismatch');

    const exists = await prisma.teachingAssignment.findFirst({
        where: { teacher_id, section_id, subject_id, is_deleted: false },
    });
    if (exists) throw new ApiError(409, 'Teaching assignment already exists');

    return prisma.teachingAssignment.create({
        data: { teacher_id, section_id, subject_id },
        include: {
            teacher: { include: { user: { select: userMinimalSelect } } },
            section: { include: sectionWithDeptSemInclude },
            subject: true,
        },
    });
};

export const getAllTeachingAssignments = async (filters = {}) => {
    const { teacher_id, subject_id, section_id, department_id } = filters;
    const where = { is_deleted: false };

    // Add filters if provided
    if (teacher_id) where.teacher_id = teacher_id;
    if (subject_id) where.subject_id = subject_id;
    if (section_id) where.section_id = section_id;
    if (department_id) {
        where.section = { ...where.section, department_id };
    }

    return prisma.teachingAssignment.findMany({
        where,
        include: {
            teacher: { include: { user: { select: userMinimalSelect } } },
            section: { include: sectionWithDeptSemInclude },
            subject: true,
        },
        orderBy: { created_at: 'desc' },
    });
};

export const getTeachingAssignmentById = async id => {
    const ta = await prisma.teachingAssignment.findUnique({
        where: { id },
        include: {
            teacher: { include: { user: { select: userMinimalSelect } } },
            section: {
                include: {
                    ...sectionWithDeptSemInclude,
                    students: {
                        where: { is_deleted: false },
                        include: { user: { select: userPublicSelect } },
                    },
                },
            },
            subject: true,
            attendance_sessions: {
                where: { is_deleted: false },
                orderBy: { session_date: 'desc' },
            },
        },
    });
    if (!ta || ta.is_deleted) throw new ApiError(404, 'Teaching Assignment not found');
    return ta;
};

export const deleteTeachingAssignment = async id => {
    const ta = await prisma.teachingAssignment.findUnique({ where: { id } });
    if (!ta) throw new ApiError(404, 'Teaching Assignment not found');

    // Hard delete cascade
    await prisma.$transaction(async tx => {
        // Find all sessions for this assignment
        const sessions = await tx.attendanceSession.findMany({
            where: { teaching_assignment_id: id },
            select: { id: true },
        });
        const sessionIds = sessions.map(s => s.id);

        if (sessionIds.length > 0) {
            // Delete records
            await tx.attendanceRecord.deleteMany({
                where: { session_id: { in: sessionIds } },
            });
            // Delete sessions
            await tx.attendanceSession.deleteMany({
                where: { id: { in: sessionIds } },
            });
        }

        // Finally delete the assignment
        return await tx.teachingAssignment.delete({ where: { id } });
    });

    return { message: 'Teaching assignment and related sessions deleted permanently' };
};
