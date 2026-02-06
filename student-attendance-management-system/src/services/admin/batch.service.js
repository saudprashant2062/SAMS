import prisma from '../../config/prisma.js';
import ApiError from '../../utils/ApiError.utils.js';
import { validateBody } from '../../utils/validate.utils.js';
import { createBatchSchema, updateBatchSchema } from '../../validators/batch.validator.js';

/* ---------- CREATE ---------- */
export const createBatchService = async data => {
    const { name, department_id, start_year, end_year } = validateBody(createBatchSchema, data);

    // Check if department exists
    const department = await prisma.department.findUnique({ where: { id: department_id } });
    if (!department) throw new ApiError(404, 'Department not found');

    // Check if batch with same start_year already exists for this department
    const exists = await prisma.batch.findFirst({
        where: { start_year, department_id },
    });
    if (exists) throw new ApiError(409, 'Batch with this start year already exists for this department');

    const created = await prisma.batch.create({
        data: {
            name: name || `${start_year} Batch`,
            department_id,
            start_year,
            end_year,
        },
        include: {
            department: true,
        },
    });

    return created;
};

/* ---------- GET ALL ---------- */
export const getAllBatchesService = async (filters = {}) => {
    const { department_id } = filters;

    const whereClause = { is_deleted: false };
    if (department_id) {
        whereClause.department_id = department_id;
    }

    const batches = await prisma.batch.findMany({
        where: whereClause,
        include: {
            department: true,
            _count: {
                select: { students: { where: { is_deleted: false } } },
            },
        },
        orderBy: { start_year: 'desc' },
    });

    return batches;
};

/* ---------- GET BY ID ---------- */
export const getBatchByIdService = async id => {
    const batch = await prisma.batch.findUnique({
        where: { id },
        include: {
            department: true,
            students: {
                where: { is_deleted: false },
                include: {
                    user: {
                        select: {
                            id: true,
                            fullname: true,
                            email: true,
                            phone_number: true,
                            photo_url: true,
                            is_active: true,
                        },
                    },
                    section: {
                        include: {
                            department: true,
                            semester: true,
                        },
                    },
                },
                orderBy: { roll_no: 'asc' },
            },
            _count: {
                select: { students: { where: { is_deleted: false } } },
            },
        },
    });
    if (!batch || batch.is_deleted) throw new ApiError(404, 'Batch not found');
    return batch;
};

/* ---------- UPDATE ---------- */
export const updateBatchService = async (id, data) => {
    const batch = await prisma.batch.findUnique({ where: { id } });
    if (!batch || batch.is_deleted) throw new ApiError(404, 'Batch not found');

    const { name, department_id, start_year, end_year } = validateBody(updateBatchSchema, data);

    // Check if department exists if changing
    if (department_id && department_id !== batch.department_id) {
        const department = await prisma.department.findUnique({ where: { id: department_id } });
        if (!department) throw new ApiError(404, 'Department not found');
    }

    // Check for duplicate start_year (excluding current batch) within the same department
    if (start_year && start_year !== batch.start_year) {
        const targetDeptId = department_id || batch.department_id;
        const exists = await prisma.batch.findFirst({
            where: {
                start_year,
                department_id: targetDeptId,
                id: { not: id },
            },
        });
        if (exists) throw new ApiError(409, 'Batch with this start year already exists for this department');
    }

    const updated = await prisma.batch.update({
        where: { id },
        data: {
            ...(name !== undefined && { name }),
            ...(department_id && { department_id }),
            ...(start_year && { start_year }),
            ...(end_year && { end_year }),
        },
        include: {
            department: true,
        },
    });

    return updated;
};

/* ---------- DELETE ---------- */
export const deleteBatchService = async id => {
    const batch = await prisma.batch.findUnique({ where: { id } });
    if (!batch) throw new ApiError(404, 'Batch not found');

    // Check if batch has students
    const studentCount = await prisma.student.count({
        where: { batch_id: id },
    });
    if (studentCount > 0) {
        throw new ApiError(
            400,
            'Cannot delete batch with existing students. Please reassign or remove students first.',
        );
    }

    // Hard delete cascade (Sections and their related data)
    await prisma.$transaction(async tx => {
        // Find all sections for this batch
        const sections = await tx.section.findMany({
            where: { batch_id: id },
            select: { id: true },
        });
        const sectionIds = sections.map(s => s.id);

        if (sectionIds.length > 0) {
            // Find all assignments for these sections
            const assignments = await tx.teachingAssignment.findMany({
                where: { section_id: { in: sectionIds } },
                select: { id: true },
            });
            const assignmentIds = assignments.map(a => a.id);

            if (assignmentIds.length > 0) {
                // Find and delete sessions/records for these assignments
                const sessions = await tx.attendanceSession.findMany({
                    where: { teaching_assignment_id: { in: assignmentIds } },
                    select: { id: true },
                });
                const sessionIds = sessions.map(s => s.id);

                if (sessionIds.length > 0) {
                    await tx.attendanceRecord.deleteMany({
                        where: { session_id: { in: sessionIds } },
                    });
                    await tx.attendanceSession.deleteMany({
                        where: { id: { in: sessionIds } },
                    });
                }

                await tx.teachingAssignment.deleteMany({
                    where: { id: { in: assignmentIds } },
                });
            }

            // Delete sections
            await tx.section.deleteMany({
                where: { id: { in: sectionIds } },
            });
        }

        // Finally delete the batch
        return await tx.batch.delete({ where: { id } });
    });

    return { message: 'Batch and related sections deleted permanently' };
};
