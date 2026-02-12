import prisma from '../../config/prisma.js';
import ApiError from '../../utils/ApiError.utils.js';
import bcrypt from '../../utils/bcrypt.js';
import { parsePagination, paginatedResponse } from '../../utils/pagination.utils.js';

/* ============================================================
   STUDENT SERVICE - Updated for Batch Context
   ============================================================
   
   Key Changes:
   - All students now have batch_id
   - current_semester field tracks academic progress
   - Promotion updates both section and semester
============================================================ */

/* ---------- CREATE ---------- */
export const createStudentService = async (data, userData) => {
    const {
        stdId,
        roll_no,
        registration_no,
        section_id,
        batch_id,
        fullname,
        email,
        phone_number,
        password,
    } = data;

    // Validate section exists
    const section = await prisma.section.findUnique({
        where: { id: section_id },
        include: {
            semester: true,
            batch: true,
        },
    });

    if (!section || section.is_deleted || section.is_archived) {
        throw new ApiError(404, 'The selected section does not exist or is not active');
    }

    // Validate batch matches section's batch
    if (section.batch_id !== batch_id) {
        throw new ApiError(400, 'Section and batch do not match');
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });
    if (existingUser) {
        throw new ApiError(409, 'Email already registered');
    }

    // Check if phone already exists
    const existingPhone = await prisma.user.findUnique({
        where: { phone_number },
    });
    if (existingPhone) {
        throw new ApiError(409, 'Phone number already registered');
    }

    // Check for duplicate roll_no
    const existingRoll = await prisma.student.findFirst({
        where: { roll_no },
    });
    if (existingRoll) {
        throw new ApiError(409, 'Roll number already exists');
    }

    // Create user and student in transaction
    const hashedPassword = await bcrypt.hashPassword(password);

    const student = await prisma.$transaction(async tx => {
        // Create user
        const user = await tx.user.create({
            data: {
                fullname,
                email,
                phone_number,
                password: hashedPassword,
                role: 'STUDENT',
            },
        });

        // Create student
        return tx.student.create({
            data: {
                stdId,
                roll_no,
                registration_no,
                user_id: user.id,
                section_id,
                batch_id,
                current_semester: section.semester.number,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fullname: true,
                        email: true,
                        phone_number: true,
                    },
                },
                section: {
                    include: {
                        department: true,
                        semester: true,
                        batch: true,
                    },
                },
                batch: true,
            },
        });
    });

    return student;
};

/* ---------- GET ALL (OPTIMIZED with pagination + select) ---------- */
export const getAllStudentsService = async (filters = {}) => {
    const {
        department_id,
        batch_id,
        semester_id,
        section_id,
        search,
        is_deleted = false,
    } = filters;
    const pagination = parsePagination(filters);

    const where = {
        is_deleted,
        ...(department_id && {
            section: { department_id },
        }),
        ...(batch_id && { batch_id }),
        ...(section_id && { section_id }),
        ...(semester_id && {
            current_semester: semester_id,
        }),
        ...(search && {
            OR: [
                { user: { fullname: { contains: search, mode: 'insensitive' } } },
                { stdId: { contains: search, mode: 'insensitive' } },
                { roll_no: { contains: search, mode: 'insensitive' } },
            ],
        }),
    };

    const [total, students] = await Promise.all([
        prisma.student.count({ where }),
        prisma.student.findMany({
            where,
            select: {
                id: true,
                stdId: true,
                roll_no: true,
                registration_no: true,
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
                batch: {
                    select: {
                        id: true,
                        name: true,
                        start_year: true,
                        end_year: true,
                    },
                },
            },
            orderBy: [{ section: { name: 'asc' } }, { roll_no: 'asc' }],
            skip: pagination.skip,
            take: pagination.take,
        }),
    ]);

    return paginatedResponse(students, total, pagination);
};

/* ---------- GET BY ID (OPTIMIZED - single query instead of two) ---------- */
export const getStudentByIdService = async id => {
    const student = await prisma.student.findUnique({
        where: { id },
        select: {
            id: true,
            stdId: true,
            roll_no: true,
            registration_no: true,
            current_semester: true,
            is_deleted: true,
            user_id: true,
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
                    batch: { select: { id: true, name: true, start_year: true, end_year: true } },
                },
            },
            batch: {
                select: { id: true, name: true, start_year: true, end_year: true },
            },
            attendance: {
                where: { is_deleted: false },
                select: {
                    id: true,
                    status: true,
                    session: {
                        select: {
                            session_date: true,
                            teaching_assignment: {
                                select: {
                                    subject: { select: { id: true, name: true } },
                                    section: { select: { id: true, name: true } },
                                },
                            },
                        },
                    },
                },
                orderBy: { session: { session_date: 'desc' } },
                take: 50, // Limit recent attendance records for performance
            },
        },
    });

    if (!student || student.is_deleted) {
        throw new ApiError(404, 'Student not found');
    }

    return student;
};

/* ---------- UPDATE ---------- */
export const updateStudentService = async (id, data) => {
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student || student.is_deleted) {
        throw new ApiError(404, 'Student not found');
    }

    const {
        roll_no,
        registration_no,
        section_id,
        batch_id,
        current_semester,
        fullname,
        email,
        phone_number,
    } = data;

    // If changing section, validate new section
    if (section_id) {
        const newSection = await prisma.section.findUnique({
            where: { id: section_id },
        });
        if (!newSection || newSection.is_deleted || newSection.is_archived) {
            throw new ApiError(404, 'New section does not exist or is not active');
        }
    }

    // Validate roll_no uniqueness if changed
    if (roll_no && roll_no !== student.roll_no) {
        const existing = await prisma.student.findFirst({
            where: { roll_no, NOT: { id } },
        });
        if (existing) {
            throw new ApiError(409, 'Roll number already exists');
        }
    }

    return await prisma.$transaction(async tx => {
        // Update user if needed
        const userUpdateData = {};
        if (fullname) userUpdateData.fullname = fullname;
        if (email) userUpdateData.email = email;
        if (phone_number) userUpdateData.phone_number = phone_number;

        if (Object.keys(userUpdateData).length > 0) {
            await tx.user.update({
                where: { id: student.user_id },
                data: userUpdateData,
            });
        }

        // Update student
        return await tx.student.update({
            where: { id },
            data: {
                roll_no,
                registration_no,
                section_id,
                batch_id,
                current_semester,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fullname: true,
                        email: true,
                        phone_number: true,
                    },
                },
                section: {
                    include: {
                        department: true,
                        semester: true,
                        batch: true,
                    },
                },
                batch: true,
            },
        });
    });
};

/* ---------- DELETE (Soft Delete) ---------- */
export const deleteStudentService = async id => {
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student || student.is_deleted) {
        throw new ApiError(404, 'Student not found');
    }

    await prisma.student.update({
        where: { id },
        data: { is_deleted: true },
    });

    // Optionally deactivate user
    await prisma.user.update({
        where: { id: student.user_id },
        data: { is_active: false },
    });

    return { message: 'Student deleted successfully' };
};

/* ---------- PROMOTE STUDENTS (Single) ---------- */
export const promoteStudentService = async (id, targetSectionId) => {
    const student = await prisma.student.findUnique({
        where: { id },
        include: { section: { include: { semester: true } } },
    });

    if (!student || student.is_deleted) {
        throw new ApiError(404, 'Student not found');
    }

    const targetSection = await prisma.section.findUnique({
        where: { id: targetSectionId },
        include: { semester: true },
    });

    if (!targetSection || targetSection.is_deleted || targetSection.is_archived) {
        throw new ApiError(404, 'Target section does not exist or is not active');
    }

    // Verify same batch
    if (targetSection.batch_id !== student.batch_id) {
        throw new ApiError(400, 'Target section must be in the same batch');
    }

    return await prisma.student.update({
        where: { id },
        data: {
            section_id: targetSectionId,
            current_semester: targetSection.semester.number,
        },
        include: {
            user: {
                select: {
                    id: true,
                    fullname: true,
                    email: true,
                },
            },
            section: {
                include: {
                    department: true,
                    semester: true,
                    batch: true,
                },
            },
            batch: true,
        },
    });
};

/* ---------- GET STUDENTS BY SECTION (OPTIMIZED with pagination + select) ---------- */
export const getStudentsBySectionService = async (sectionId, filters = {}) => {
    const pagination = parsePagination(filters);

    const where = {
        section_id: sectionId,
        is_deleted: false,
    };

    const [total, students] = await Promise.all([
        prisma.student.count({ where }),
        prisma.student.findMany({
            where,
            select: {
                id: true,
                stdId: true,
                roll_no: true,
                registration_no: true,
                current_semester: true,
                user: {
                    select: {
                        id: true,
                        fullname: true,
                        email: true,
                        phone_number: true,
                        photo_url: true,
                    },
                },
                section: {
                    select: {
                        id: true,
                        name: true,
                        department: { select: { id: true, name: true } },
                        semester: { select: { id: true, number: true } },
                        batch: { select: { id: true, name: true } },
                    },
                },
                batch: {
                    select: { id: true, name: true, start_year: true, end_year: true },
                },
            },
            orderBy: { roll_no: 'asc' },
            skip: pagination.skip,
            take: pagination.take,
        }),
    ]);

    return paginatedResponse(students, total, pagination);
};

/* ---------- GET STUDENTS BY BATCH (OPTIMIZED with pagination + select) ---------- */
export const getStudentsByBatchService = async (batchId, semesterNumber = null, filters = {}) => {
    const pagination = parsePagination(filters);

    const where = {
        batch_id: batchId,
        is_deleted: false,
        ...(semesterNumber && { current_semester: semesterNumber }),
    };

    const [total, students] = await Promise.all([
        prisma.student.count({ where }),
        prisma.student.findMany({
            where,
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
            orderBy: [{ section: { name: 'asc' } }, { roll_no: 'asc' }],
            skip: pagination.skip,
            take: pagination.take,
        }),
    ]);

    return paginatedResponse(students, total, pagination);
};
