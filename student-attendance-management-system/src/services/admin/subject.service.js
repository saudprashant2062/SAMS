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

    return prisma.subject.create({ data: { name, code, department_id, semester_id } });
};

export const getAllSubjectsService = async () =>
    prisma.subject.findMany({
        where: { is_deleted: false },
        include: {
            department: true,
            semester: true,
            _count: {
                select: { teaching_assignments: { where: { is_deleted: false } } },
            },
        },
    });

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
    return prisma.subject.update({ where: { id }, data });
};

export const deleteSubjectService = async id => {
    const subj = await prisma.subject.findUnique({ where: { id } });
    if (!subj) throw new ApiError(404, 'Subject not found');
    return prisma.subject.update({ where: { id }, data: { is_deleted: true } });
};
