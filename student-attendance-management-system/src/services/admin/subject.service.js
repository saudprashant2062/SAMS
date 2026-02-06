import prisma from '../../config/prisma.js';
import ApiError from '../../utils/ApiError.utils.js';

export const createSubjectService = async ({ name, code, department_id, semester_id }) => {
    const department = await prisma.department.findUnique({ where: { id: department_id } });
    if (!department) throw new ApiError(404, 'Department not found');

    const semester = await prisma.semester.findUnique({ where: { id: semester_id } });
    if (!semester) throw new ApiError(404, 'Semester not found');
    if (semester.department_id !== department_id)
        throw new ApiError(400, 'Semester does not belong to this department');

    const exists = await prisma.subject.findFirst({ where: { code, semester_id } });
    if (exists) throw new ApiError(409, 'Subject code already exists in this semester');

    const created = await prisma.subject.create({ data: { name, code, department_id, semester_id } });
    return created;
};

export const getAllSubjectsService = async () => {

    const subjects = await prisma.subject.findMany({
        where: { is_deleted: false },
        include: {
            department: true,
            semester: true,
            _count: {
                select: { teaching_assignments: { where: { is_deleted: false } } },
            },
        },
    });

    return subjects;
};

export const getSubjectByIdService = async id => {
    const subj = await prisma.subject.findUnique({
        where: { id },
        include: {
            department: true,
            semester: true,
            teaching_assignments: {
                where: { is_deleted: false },
                include: {
                    teacher: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    fullname: true,
                                    email: true,
                                    photo_url: true,
                                },
                            },
                        },
                    },
                    section: true,
                },
            },
            _count: {
                select: { teaching_assignments: { where: { is_deleted: false } } },
            },
        },
    });
    if (!subj) throw new ApiError(404, 'Subject not found');
    return subj;
};

export const updateSubjectService = async (id, data) => {
    const subj = await prisma.subject.findUnique({ where: { id } });
    if (!subj) throw new ApiError(404, 'Subject not found');
    
    const updated = await prisma.subject.update({ where: { id }, data });
    return updated;
};

export const deleteSubjectService = async id => {
    const subj = await prisma.subject.findUnique({ where: { id } });
    if (!subj) throw new ApiError(404, 'Subject not found');

    // Hard delete cascade
    await prisma.$transaction(async tx => {
        // Find all assignments for this subject
        const assignments = await tx.teachingAssignment.findMany({
            where: { subject_id: id },
            select: { id: true },
        });
        const assignmentIds = assignments.map(a => a.id);

        if (assignmentIds.length > 0) {
            // Find all sessions for these assignments
            const sessions = await tx.attendanceSession.findMany({
                where: { teaching_assignment_id: { in: assignmentIds } },
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

            // Delete assignments
            await tx.teachingAssignment.deleteMany({
                where: { id: { in: assignmentIds } },
            });
        }

        // Finally delete the subject
        return await tx.subject.delete({ where: { id } });
    });

    return { message: 'Subject and all related data deleted permanently' };
};
