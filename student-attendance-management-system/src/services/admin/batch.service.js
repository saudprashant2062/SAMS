import prisma from '../../config/prisma.js';
import ApiError from '../../utils/ApiError.utils.js';
import { validateBody } from '../../utils/validate.utils.js';
import { createBatchSchema, updateBatchSchema } from '../../validators/batch.validator.js';

/* ---------- CREATE ---------- */
export const createBatchService = async data => {
    const { year, name } = validateBody(createBatchSchema, data);

    // Check if batch year already exists
    const exists = await prisma.batch.findUnique({ where: { year } });
    if (exists) throw new ApiError(409, 'Batch with this year already exists');

    return prisma.batch.create({
        data: { year, name },
    });
};

/* ---------- GET ALL ---------- */
export const getAllBatchesService = async () => {
    return prisma.batch.findMany({
        where: { is_deleted: false },
        include: {
            _count: {
                select: { students: { where: { is_deleted: false } } },
            },
        },
        orderBy: { year: 'desc' },
    });
};

/* ---------- GET BY ID ---------- */
export const getBatchByIdService = async id => {
    const batch = await prisma.batch.findUnique({
        where: { id },
        include: {
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

    const { year, name } = validateBody(updateBatchSchema, data);

    // Check for duplicate year (excluding current batch)
    if (year && year !== batch.year) {
        const exists = await prisma.batch.findUnique({ where: { year } });
        if (exists) throw new ApiError(409, 'Batch with this year already exists');
    }

    return prisma.batch.update({
        where: { id },
        data: { year, name },
    });
};

/* ---------- DELETE ---------- */
export const deleteBatchService = async id => {
    const batch = await prisma.batch.findUnique({ where: { id } });
    if (!batch || batch.is_deleted) throw new ApiError(404, 'Batch not found');

    // Check if batch has students
    const studentCount = await prisma.student.count({
        where: { batch_id: id, is_deleted: false },
    });
    if (studentCount > 0) {
        throw new ApiError(
            400,
            'Cannot delete batch with existing students. Please reassign or remove students first.',
        );
    }

    return prisma.batch.update({
        where: { id },
        data: { is_deleted: true },
    });
};
