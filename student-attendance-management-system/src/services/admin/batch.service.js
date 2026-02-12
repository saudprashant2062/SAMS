import prisma from '../../config/prisma.js';
import ApiError from '../../utils/ApiError.utils.js';
import { validateBody } from '../../utils/validate.utils.js';
import { createBatchSchema, updateBatchSchema } from '../../validators/batch.validator.js';
import {
    parsePagination,
    paginatedResponse,
    buildPaginationMeta,
} from '../../utils/pagination.utils.js';

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
    if (exists)
        throw new ApiError(409, 'Batch with this start year already exists for this department');

    const created = await prisma.batch.create({
        data: {
            name: name || `${start_year} Batch`,
            department_id,
            start_year,
            end_year,
        },
        select: {
            id: true,
            name: true,
            start_year: true,
            end_year: true,
            created_at: true,
            department: { select: { id: true, name: true } },
        },
    });

    return created;
};

/* ---------- GET ALL ---------- */
export const getAllBatchesService = async (filters = {}) => {
    const { department_id } = filters;
    const pagination = parsePagination(filters);

    const whereClause = { is_deleted: false };
    if (department_id) {
        whereClause.department_id = department_id;
    }

    const [total, batches] = await Promise.all([
        prisma.batch.count({ where: whereClause }),
        prisma.batch.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                department_id: true,
                start_year: true,
                end_year: true,
                created_at: true,
                department: { select: { id: true, name: true } },
                _count: { select: { students: { where: { is_deleted: false } } } },
            },
            orderBy: { start_year: 'desc' },
            skip: pagination.skip,
            take: pagination.take,
        }),
    ]);

    return paginatedResponse(batches, total, pagination);
};

/* ---------- GET BY ID ---------- */
export const getBatchByIdService = async (id, filters = {}) => {
    const pagination = parsePagination(filters);

    const batch = await prisma.batch.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            start_year: true,
            end_year: true,
            is_deleted: true,
            created_at: true,
            department: { select: { id: true, name: true } },
            _count: { select: { students: { where: { is_deleted: false } } } },
        },
    });
    if (!batch || batch.is_deleted) throw new ApiError(404, 'Batch not found');

    const [totalStudents, students] = await Promise.all([
        prisma.student.count({ where: { batch_id: id, is_deleted: false } }),
        prisma.student.findMany({
            where: { batch_id: id, is_deleted: false },
            select: {
                id: true,
                stdId: true,
                roll_no: true,
                current_semester: true,
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
                    select: {
                        id: true,
                        name: true,
                        department: { select: { id: true, name: true } },
                        semester: { select: { id: true, number: true } },
                    },
                },
            },
            orderBy: { roll_no: 'asc' },
            skip: pagination.skip,
            take: pagination.take,
        }),
    ]);

    return {
        ...batch,
        students,
        studentsPagination: buildPaginationMeta({
            total: totalStudents,
            page: pagination.page,
            limit: pagination.limit,
        }),
    };
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
        if (exists)
            throw new ApiError(
                409,
                'Batch with this start year already exists for this department',
            );
    }

    const updated = await prisma.batch.update({
        where: { id },
        data: {
            ...(name !== undefined && { name }),
            ...(department_id && { department_id }),
            ...(start_year && { start_year }),
            ...(end_year && { end_year }),
        },
        select: {
            id: true,
            name: true,
            start_year: true,
            end_year: true,
            created_at: true,
            department: { select: { id: true, name: true } },
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
