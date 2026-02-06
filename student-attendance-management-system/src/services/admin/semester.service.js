import prisma from '../../config/prisma.js';
import ApiError from '../../utils/ApiError.utils.js';

export const createSemesterService = async ({ number, department_id }) => {
    const department = await prisma.department.findUnique({ where: { id: department_id } });
    if (!department) throw new ApiError(404, 'Department not found');

    const exists = await prisma.semester.findFirst({ where: { number, department_id } });
    if (exists) throw new ApiError(409, 'Semester already exists in this department');

    const created = await prisma.semester.create({ data: { number, department_id } });
    return created;
};

export const getAllSemestersService = async () => {

    const semesters = await prisma.semester.findMany({
        where: { is_deleted: false },
        include: {
            department: true,
            _count: {
                select: { sections: { where: { is_deleted: false } } },
            },
        },
    });

    return semesters;
};

export const getSemesterByIdService = async id => {
    const sem = await prisma.semester.findUnique({
        where: { id },
        include: {
            department: true,
            sections: {
                where: { is_deleted: false },
                include: {
                    _count: {
                        select: { students: { where: { is_deleted: false } } },
                    },
                },
            },
            _count: {
                select: { sections: { where: { is_deleted: false } } },
            },
        },
    });
    if (!sem) throw new ApiError(404, 'Semester not found');
    return sem;
};

export const updateSemesterService = async (id, data) => {
    const sem = await prisma.semester.findUnique({ where: { id } });
    if (!sem) throw new ApiError(404, 'Semester not found');
    
    const updated = await prisma.semester.update({ where: { id }, data });
    return updated;
};

export const deleteSemesterService = async id => {
    const sem = await prisma.semester.findUnique({ where: { id } });
    if (!sem) throw new ApiError(404, 'Semester not found');

    // Hard delete cascade
    await prisma.$transaction(async tx => {
        // 1. Delete Subjects (they belong to Semester)
        // Note: deleteSubjectService logic should be mirrored or reused here if possible, 
        // but for complexity we'll do it inline.
        const subjects = await tx.subject.findMany({
            where: { semester_id: id },
            select: { id: true },
        });
        const subjectIds = subjects.map(s => s.id);

        // Find sections in this semester
        const sections = await tx.section.findMany({
            where: { semester_id: id },
            select: { id: true },
        });
        const sectionIds = sections.map(s => s.id);

        if (sectionIds.length > 0) {
            // Delete attendance sessions and records via sections
            const sessions = await tx.attendanceSession.findMany({
                where: { section_id: { in: sectionIds } },
                select: { id: true },
            });
            const sessionIds = sessions.map(s => s.id);

            if (sessionIds.length > 0) {
                await tx.attendanceRecord.deleteMany({ where: { session_id: { in: sessionIds } } });
                await tx.attendanceSession.deleteMany({ where: { id: { in: sessionIds } } });
            }

            // Delete Teaching Assignments
            await tx.teachingAssignment.deleteMany({ where: { section_id: { in: sectionIds } } });

            // Delete Sections
            await tx.section.deleteMany({ where: { id: { in: sectionIds } } });
        }

        // Delete Subjects
        if (subjectIds.length > 0) {
            await tx.subject.deleteMany({ where: { id: { in: subjectIds } } });
        }

        // Finally delete the semester
        return await tx.semester.delete({ where: { id } });
    });

    return { message: 'Semester and all related data deleted permanently' };
};
