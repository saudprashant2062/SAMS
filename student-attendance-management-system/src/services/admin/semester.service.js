import prisma from '../../config/prisma.js';
import ApiError from '../../utils/ApiError.utils.js';

export const createSemesterService = async ({ number, department_id }) => {
    const department = await prisma.department.findUnique({ where: { id: department_id } });
    if (!department) throw new ApiError(404, 'Department not found');

    const exists = await prisma.semester.findFirst({ where: { number, department_id } });
    if (exists) throw new ApiError(409, 'Semester already exists in this department');

    return prisma.semester.create({ data: { number, department_id } });
};

export const getAllSemestersService = async () =>
    prisma.semester.findMany({
        where: { is_deleted: false },
        include: {
            department: true,
            _count: {
                select: { sections: { where: { is_deleted: false } } },
            },
        },
    });

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
    return prisma.semester.update({ where: { id }, data });
};

export const deleteSemesterService = async id => {
    const sem = await prisma.semester.findUnique({ where: { id } });
    if (!sem) throw new ApiError(404, 'Semester not found');
    return prisma.semester.update({ where: { id }, data: { is_deleted: true } });
};
