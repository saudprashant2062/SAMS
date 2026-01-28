import prisma from '../../config/prisma.js';
import ApiError from '../../utils/ApiError.utils.js';

/* ---------- CREATE ---------- */
export const createSectionService = async data => {
    const { name, department_id, semester_id } = data;

    // Validate department exists
    const department = await prisma.department.findUnique({ where: { id: department_id } });
    if (!department || department.is_deleted)
        throw new ApiError(404, 'The selected department does not exist or has been removed.');

    // Validate semester exists
    const semester = await prisma.semester.findUnique({ where: { id: semester_id } });
    if (!semester || semester.is_deleted)
        throw new ApiError(404, 'The selected semester does not exist or has been removed.');

    // Check unique constraint (name + semester)
    const exists = await prisma.section.findFirst({
        where: { name, semester_id },
    });
    if (exists)
        throw new ApiError(
            409,
            `Section "${name}" already exists in this semester. Please use a different name.`,
        );

    const section = await prisma.section.create({
        data: { name, department_id, semester_id },
    });

    return section;
};

/* ---------- GET ALL ---------- */
export const getAllSectionsService = async () => {
    return await prisma.section.findMany({
        where: { is_deleted: false },
        include: {
            department: true,
            semester: true,
            _count: {
                select: { students: { where: { is_deleted: false } } },
            },
        },
    });
};

/* ---------- GET BY ID ---------- */
export const getSectionByIdService = async id => {
    const section = await prisma.section.findUnique({ where: { id } });
    if (!section || section.is_deleted) throw new ApiError(404, 'Section not found');

    return await prisma.section.findUnique({
        where: { id },
        include: {
            department: true,
            semester: {
                include: {
                    department: true,
                },
            },
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
                    batch: true,
                },
                orderBy: { roll_no: 'asc' },
            },
            _count: {
                select: { students: { where: { is_deleted: false } } },
            },
        },
    });
};

/* ---------- UPDATE ---------- */
export const updateSectionService = async (id, data) => {
    const section = await prisma.section.findUnique({ where: { id } });
    if (!section || section.is_deleted) throw new ApiError(404, 'Section not found');

    const { name, department_id, semester_id } = data;

    // Validate department and semester
    const department = await prisma.department.findUnique({ where: { id: department_id } });
    if (!department || department.is_deleted)
        throw new ApiError(404, 'The selected department does not exist or has been removed.');

    const semester = await prisma.semester.findUnique({ where: { id: semester_id } });
    if (!semester || semester.is_deleted)
        throw new ApiError(404, 'The selected semester does not exist or has been removed.');

    // Check unique constraint
    const exists = await prisma.section.findFirst({
        where: {
            name,
            semester_id,
            NOT: { id }, // exclude current section
        },
    });
    if (exists)
        throw new ApiError(
            409,
            `Section "${name}" already exists in this semester. Please use a different name.`,
        );

    return await prisma.section.update({
        where: { id },
        data: { name, department_id, semester_id },
    });
};

/* ---------- DELETE (soft delete) ---------- */
export const deleteSectionService = async id => {
    const section = await prisma.section.findUnique({ where: { id } });
    if (!section || section.is_deleted) throw new ApiError(404, 'Section not found');

    // Check if section has students
    const studentCount = await prisma.student.count({
        where: { section_id: id, is_deleted: false },
    });
    if (studentCount > 0) {
        throw new ApiError(
            400,
            'Cannot delete section with existing students. Please reassign or remove students first.',
        );
    }

    await prisma.section.update({ where: { id }, data: { is_deleted: true } });
    return { message: 'Section deleted' };
};

/* ---------- PROMOTE SEMESTER (Bulk) ---------- */
export const promoteSemesterService = async ({
    department_id,
    from_semester_id,
    to_semester_id,
}) => {
    // Validate department
    const department = await prisma.department.findUnique({ where: { id: department_id } });
    if (!department || department.is_deleted) throw new ApiError(404, 'Department not found');

    // Validate semesters
    const fromSemester = await prisma.semester.findUnique({ where: { id: from_semester_id } });
    if (!fromSemester || fromSemester.is_deleted)
        throw new ApiError(404, 'Source semester not found');

    const toSemester = await prisma.semester.findUnique({ where: { id: to_semester_id } });
    if (!toSemester || toSemester.is_deleted) throw new ApiError(404, 'Target semester not found');

    // Ensure semesters belong to the same department
    if (
        fromSemester.department_id !== department_id ||
        toSemester.department_id !== department_id
    ) {
        throw new ApiError(400, 'Semesters must belong to the specified department');
    }

    // Validate that target semester is higher than source semester
    if (toSemester.number <= fromSemester.number) {
        throw new ApiError(
            400,
            `Cannot promote from Semester ${fromSemester.number} to Semester ${toSemester.number}. Target semester must be higher than source semester.`,
        );
    }

    // Get all sections in the source semester for this department
    const sections = await prisma.section.findMany({
        where: {
            department_id,
            semester_id: from_semester_id,
            is_deleted: false,
        },
        include: {
            students: {
                where: { is_deleted: false },
            },
        },
    });

    if (sections.length === 0) {
        throw new ApiError(404, 'No sections found in the source semester');
    }

    // Promote sections to new semester
    const promotedSections = [];

    for (const section of sections) {
        // Check if section already exists in target semester
        const existingSection = await prisma.section.findFirst({
            where: {
                name: section.name,
                semester_id: to_semester_id,
                is_deleted: false,
            },
        });

        if (existingSection) {
            // Update existing section's semester
            await prisma.section.update({
                where: { id: section.id },
                data: { semester_id: to_semester_id },
            });
            promotedSections.push({
                section_id: section.id,
                name: section.name,
                students_promoted: section.students.length,
            });
        } else {
            // Update section to new semester
            await prisma.section.update({
                where: { id: section.id },
                data: { semester_id: to_semester_id },
            });
            promotedSections.push({
                section_id: section.id,
                name: section.name,
                students_promoted: section.students.length,
            });
        }
    }

    const totalStudents = promotedSections.reduce((sum, s) => sum + s.students_promoted, 0);

    return {
        message: 'Semester promotion completed',
        from_semester: fromSemester.number,
        to_semester: toSemester.number,
        department: department.name,
        sections_promoted: promotedSections.length,
        total_students_promoted: totalStudents,
        details: promotedSections,
    };
};
