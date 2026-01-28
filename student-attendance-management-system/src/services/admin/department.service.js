import prisma from '../../config/prisma.js';
import ApiError from '../../utils/ApiError.utils.js';

export const createDepartmentService = async ({ name }) => {
    const exists = await prisma.department.findUnique({ where: { name } });
    if (exists) throw new ApiError(409, 'Department already exists');

    return prisma.department.create({ data: { name } });
};

export const getAllDepartmentsService = async () =>
    prisma.department.findMany({
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
    return prisma.department.update({ where: { id }, data });
};

export const deleteDepartmentService = async id => {
    const dept = await prisma.department.findUnique({ where: { id } });
    if (!dept) throw new ApiError(404, 'Department not found');
    return prisma.department.update({ where: { id }, data: { is_deleted: true } });
};
