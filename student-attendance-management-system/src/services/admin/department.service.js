import prisma from '../../config/prisma.js';
import ApiError from '../../utils/ApiError.utils.js';

export const createDepartmentService = async ({ name }) => {
    const exists = await prisma.department.findUnique({ where: { name } });
    if (exists) throw new ApiError(409, 'Department already exists');

    const dept = await prisma.department.create({ data: { name } });
    return dept;
};

export const getAllDepartmentsService = async () => {

    const departments = await prisma.department.findMany({
        where: { is_deleted: false },
        include: {
            _count: {
                select: {
                    semesters: { where: { is_deleted: false } },
                    sections: { where: { is_deleted: false } },
                },
            },
        },
    });

    return departments;
};

export const getDepartmentByIdService = async id => {
    const dept = await prisma.department.findUnique({
        where: { id },
        include: {
            semesters: {
                where: { is_deleted: false },
                include: {
                    _count: {
                        select: { sections: { where: { is_deleted: false } } },
                    },
                },
                orderBy: { number: 'asc' },
            },
            _count: {
                select: {
                    semesters: { where: { is_deleted: false } },
                    sections: { where: { is_deleted: false } },
                },
            },
        },
    });
    if (!dept) throw new ApiError(404, 'Department not found');
    return dept;
};

export const updateDepartmentService = async (id, data) => {
    const dept = await prisma.department.findUnique({ where: { id } });
    if (!dept) throw new ApiError(404, 'Department not found');
    
    const updated = await prisma.department.update({ where: { id }, data });
    return updated;
};

export const deleteDepartmentService = async id => {
    const dept = await prisma.department.findUnique({ where: { id } });
    if (!dept) throw new ApiError(404, 'Department not found');

    // Hard delete cascade: Semesters, Batches, Subjects, Sections, Students, etc.
    // Note: Deleting a department is a major operation.
    await prisma.$transaction(async tx => {
        // Students are linked to Section and Batch.
        // We should probably check if there are students before deleting a department.
        const studentCount = await tx.student.count({
            where: { batch: { department_id: id } },
        });
        if (studentCount > 0) {
            throw new ApiError(400, 'Cannot delete department with existing students. Please remove students first.');
        }

        // 1. Delete Attendance Records and Sessions (via Sections or Assignments)
        // Find sections in this department
        const sections = await tx.section.findMany({
            where: { department_id: id },
            select: { id: true },
        });
        const sectionIds = sections.map(s => s.id);

        if (sectionIds.length > 0) {
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

        // 2. Delete Subjects
        await tx.subject.deleteMany({ where: { department_id: id } });

        // 3. Delete Batches
        await tx.batch.deleteMany({ where: { department_id: id } });

        // 4. Delete Semesters
        await tx.semester.deleteMany({ where: { department_id: id } });

        // 5. Finally delete the department
        return await tx.department.delete({ where: { id } });
    });

    return { message: 'Department and all related academic data deleted permanently' };
};
