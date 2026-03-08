import prisma from '../../config/prisma.js';
import ApiError from '../../utils/ApiError.utils.js';
import { hashPassword } from '../../utils/bcrypt.js';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import csv from 'csv-parser';
import xlsx from 'xlsx';
import { bulkStudentRowSchema, bulkTeacherRowSchema } from '../../validators/user.validator.js';
import { userBasicSelect } from '../../utils/prisma.selects.js';
import { parsePagination, paginatedResponse } from '../../utils/pagination.utils.js';

/* ---------- Common user select for responses ---------- */
const userResponseSelect = {
    id: true,
    fullname: true,
    email: true,
    role: true,
    phone_number: true,
    photo_url: true,
};

/* ---------- Generate Custom Student ID ---------- */
const generateStudentId = async (sectionId, batchId) => {
    const section = await prisma.section.findUnique({
        where: { id: sectionId },
        include: { department: true },
    });
    if (!section) throw new ApiError(404, 'Section not found');

    const batch = await prisma.batch.findUnique({
        where: { id: batchId },
    });
    if (!batch) throw new ApiError(404, 'Batch not found');

    const deptCode = section.department.name.substring(0, 4).toUpperCase();
    const year = batch.start_year.toString().slice(-2);
    const count = await prisma.student.count({
        where: { batch_id: batchId, is_deleted: false },
    });
    const studentNumber = (count + 1).toString().padStart(3, '0');
    return `STD-${deptCode}-${year}-${studentNumber}`;
};

/* ---------- Generate Custom Teacher ID ---------- */
const generateTeacherId = async () => {
    const count = await prisma.teacher.count({ where: { is_deleted: false } });
    const teacherNumber = (count + 1).toString().padStart(4, '0');
    return `TCH-${teacherNumber}`;
};

/* ---------- Save photo locally and return relative path ---------- */
const savePhoto = filePath => {
    // The file is already saved by multer to uploads/profile-pictures/
    // Just return the relative path for database storage
    return '/' + filePath.replace(/\\/g, '/');
};

/* ---------- Create single student ---------- */

export const createStudentService = async ({
    fullname,
    email,
    password,
    roll_no,
    registration_no,
    section_id,
    batch_id,
    phone_number,
    file,
}) => {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists)
        throw new ApiError(
            409,
            'A user with this email address already exists. Please use a different email.',
        );

    // Validate section exists
    const section = await prisma.section.findUnique({ where: { id: section_id } });
    if (!section || section.is_deleted)
        throw new ApiError(404, 'The selected section does not exist or has been removed.');

    // Validate batch exists
    const batch = await prisma.batch.findUnique({ where: { id: batch_id } });
    if (!batch || batch.is_deleted)
        throw new ApiError(404, 'The selected batch does not exist or has been removed.');

    const hashedPassword = await hashPassword(password);
    let photo_url = null;
    if (file) photo_url = savePhoto(file.path);

    const stdId = await generateStudentId(section_id, batch_id);

    const student = await prisma.user.create({
        data: {
            fullname,
            email,
            password: hashedPassword,
            role: 'STUDENT',
            photo_url,
            phone_number,
            student: { create: { stdId, roll_no, registration_no, section_id, batch_id } },
        },
        select: { ...userResponseSelect, student: true },
    });

    return student;
};

/* ---------- Create single teacher ---------- */
export const createTeacherService = async ({
    fullname,
    email,
    password,
    designation,
    phone_number,
    file,
}) => {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists)
        throw new ApiError(
            409,
            'A user with this email address already exists. Please use a different email.',
        );

    // Check phone number uniqueness
    const phoneExists = await prisma.user.findUnique({ where: { phone_number } });
    if (phoneExists)
        throw new ApiError(409, 'This phone number is already registered with another user.');

    const hashedPassword = await hashPassword(password);
    let photo_url = null;
    if (file) photo_url = savePhoto(file.path);

    const teacherId = await generateTeacherId();

    const teacher = await prisma.user.create({
        data: {
            fullname,
            email,
            password: hashedPassword,
            role: 'TEACHER',
            photo_url,
            phone_number,
            teacher: { create: { teacherId, designation } },
        },
        select: { ...userResponseSelect, teacher: true },
    });

    return teacher;
};

/* ---------- Parse CSV or Excel file and return array of rows ---------- */
const parseFile = async filePath => {
    const results = [];
    const extension = filePath.split('.').pop().toLowerCase();

    if (extension === 'csv') {
        return new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', row => results.push(row))
                .on('end', () => resolve(results))
                .on('error', err => reject(err));
        });
    } else if (extension === 'xlsx' || extension === 'xls') {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        return xlsx.utils.sheet_to_json(worksheet);
    } else {
        throw new ApiError(400, 'Unsupported file format. Please use CSV or Excel (.xlsx, .xls)');
    }
};

/* ---------- Bulk Create Students via CSV/Excel ---------- */
export const bulkCreateStudentsCSVService = async (filePath, defaultSectionId, defaultBatchId) => {
    const errors = [];

    // Validate default section_id if provided
    if (defaultSectionId) {
        const section = await prisma.section.findUnique({ where: { id: defaultSectionId } });
        if (!section || section.is_deleted) {
            throw new ApiError(404, 'The selected section does not exist or has been removed.');
        }
    }

    // Validate default batch_id if provided
    if (defaultBatchId) {
        const batch = await prisma.batch.findUnique({ where: { id: defaultBatchId } });
        if (!batch || batch.is_deleted) {
            throw new ApiError(404, 'The selected batch does not exist or has been removed.');
        }
    }

    // Parse the file (CSV or Excel)
    let rows;
    try {
        rows = await parseFile(filePath);
    } catch (err) {
        throw new ApiError(400, `Failed to parse file: ${err.message}`);
    }

    if (!rows || rows.length === 0) {
        throw new ApiError(400, 'The file is empty or contains no valid data.');
    }

    // First pass: validate all rows and collect emails/phones
    const validatedRows = [];
    for (const [index, row] of rows.entries()) {
        // Normalize row keys to lowercase
        const normalizedRow = {};
        Object.keys(row).forEach(key => {
            normalizedRow[key.toLowerCase().trim()] = row[key];
        });

        const section_id = defaultSectionId || normalizedRow.section_id;
        if (!section_id) {
            errors.push({ row: index + 1, error: 'Section is required for each student' });
            continue;
        }

        const batch_id = defaultBatchId || normalizedRow.batch_id;
        if (!batch_id) {
            errors.push({ row: index + 1, error: 'Batch is required for each student' });
            continue;
        }

        const rowWithData = { ...normalizedRow, section_id, batch_id };
        const parsed = bulkStudentRowSchema.safeParse(rowWithData);
        if (!parsed.success) {
            const errorMessages = Object.entries(parsed.error.format())
                .filter(([key]) => key !== '_errors')
                .map(([field, err]) =>
                    err._errors?.length > 0
                        ? `${field}: ${err._errors.join(', ')}`
                        : `${field}: Invalid value`,
                )
                .join('; ');
            errors.push({ row: index + 1, error: errorMessages || 'Validation failed' });
            continue;
        }
        validatedRows.push({ index, parsed: parsed.data, section_id, batch_id });
    }

    // Batch-check existing emails and phones in ONE query each (avoid N+1)
    const allEmails = validatedRows.map(r => r.parsed.email);
    const allPhones = validatedRows.map(r => r.parsed.phone_number).filter(Boolean);

    const [existingEmails, existingPhones] = await Promise.all([
        prisma.user.findMany({ where: { email: { in: allEmails } }, select: { email: true } }),
        allPhones.length > 0
            ? prisma.user.findMany({
                  where: { phone_number: { in: allPhones } },
                  select: { phone_number: true },
              })
            : [],
    ]);

    const emailSet = new Set(existingEmails.map(u => u.email));
    const phoneSet = new Set(existingPhones.map(u => u.phone_number));

    const createdStudents = [];

    for (const { index, parsed, section_id, batch_id } of validatedRows) {
        try {
            const { fullname, email, password, roll_no, registration_no, phone_number, photo_url } =
                parsed;

            if (emailSet.has(email)) {
                errors.push({ row: index + 1, error: `Email "${email}" is already registered` });
                continue;
            }

            if (phone_number && phoneSet.has(phone_number)) {
                errors.push({
                    row: index + 1,
                    error: `Phone number "${phone_number}" is already registered`,
                });
                continue;
            }

            const hashedPassword = await hashPassword(password);
            const stdId = await generateStudentId(section_id, batch_id);

            const student = await prisma.user.create({
                data: {
                    fullname,
                    email,
                    password: hashedPassword,
                    role: 'STUDENT',
                    photo_url: null,
                    phone_number,
                    student: { create: { stdId, roll_no, registration_no, section_id, batch_id } },
                },
                select: userResponseSelect,
            });

            // Track newly created emails/phones to prevent duplicates within the same batch
            emailSet.add(email);
            if (phone_number) phoneSet.add(phone_number);
            createdStudents.push(student);
        } catch (err) {
            errors.push({ row: index + 1, error: err.message });
        }
    }

    // Delete file after processing
    try {
        await fsPromises.unlink(filePath);
    } catch (unlinkErr) {
        if (process.env.NODE_ENV === 'development') {
            console.error('Error deleting file:', unlinkErr.message);
        }
    }

    return { created: createdStudents, errors };
};

/* ---------- Bulk Create Teachers via CSV ---------- */
export const bulkCreateTeachersCSVService = async filePath => {
    const errors = [];

    // Parse the file (CSV or Excel)
    let rows;
    try {
        rows = await parseFile(filePath);
    } catch (err) {
        throw new ApiError(400, `Failed to parse file: ${err.message}`);
    }

    if (!rows || rows.length === 0) {
        throw new ApiError(400, 'The file is empty or contains no valid data.');
    }

    // First pass: validate all rows
    const validatedRows = [];
    for (const [index, row] of rows.entries()) {
        const normalizedRow = {};
        Object.keys(row).forEach(key => {
            normalizedRow[key.toLowerCase().trim()] = row[key];
        });

        const parsed = bulkTeacherRowSchema.safeParse(normalizedRow);
        if (!parsed.success) {
            const errorMessages = Object.entries(parsed.error.format())
                .filter(([key]) => key !== '_errors')
                .map(([field, err]) =>
                    err._errors?.length > 0
                        ? `${field}: ${err._errors.join(', ')}`
                        : `${field}: Invalid value`,
                )
                .join('; ');
            errors.push({ row: index + 1, error: errorMessages || 'Validation failed' });
            continue;
        }
        validatedRows.push({ index, parsed: parsed.data });
    }

    // Batch-check existing emails and phones in ONE query each (avoid N+1)
    const allEmails = validatedRows.map(r => r.parsed.email);
    const allPhones = validatedRows.map(r => r.parsed.phone_number).filter(Boolean);

    const [existingEmails, existingPhones] = await Promise.all([
        prisma.user.findMany({ where: { email: { in: allEmails } }, select: { email: true } }),
        allPhones.length > 0
            ? prisma.user.findMany({
                  where: { phone_number: { in: allPhones } },
                  select: { phone_number: true },
              })
            : [],
    ]);

    const emailSet = new Set(existingEmails.map(u => u.email));
    const phoneSet = new Set(existingPhones.map(u => u.phone_number));

    const createdTeachers = [];

    for (const { index, parsed } of validatedRows) {
        try {
            const { fullname, email, password, designation, phone_number, photo_url } = parsed;

            if (emailSet.has(email)) {
                errors.push({ row: index + 1, error: `Email "${email}" is already registered` });
                continue;
            }

            if (phone_number && phoneSet.has(phone_number)) {
                errors.push({
                    row: index + 1,
                    error: `Phone number "${phone_number}" is already registered`,
                });
                continue;
            }

            const hashedPassword = await hashPassword(password);
            const teacherId = await generateTeacherId();

            const teacher = await prisma.user.create({
                data: {
                    fullname,
                    email,
                    password: hashedPassword,
                    role: 'TEACHER',
                    photo_url: null,
                    phone_number,
                    teacher: { create: { teacherId, designation } },
                },
                select: userResponseSelect,
            });

            emailSet.add(email);
            if (phone_number) phoneSet.add(phone_number);
            createdTeachers.push(teacher);
        } catch (err) {
            errors.push({ row: index + 1, error: err.message });
        }
    }

    // Delete file after processing
    try {
        await fsPromises.unlink(filePath);
    } catch (unlinkErr) {
        if (process.env.NODE_ENV === 'development') {
            console.error('Error deleting file:', unlinkErr.message);
        }
    }

    return { created: createdTeachers, errors };
};

/* ===============================
   GET ALL USERS (ADMIN)
================================ */
export const getAllUsersService = async (filters = {}) => {
    const { search, role, department_id, batch_id, semester_id, section_id } = filters;
    const pagination = parsePagination(filters);
    const where = {};

    // Search by name or email
    if (search) {
        where.OR = [
            { fullname: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
        ];
    }

    // Filter by role
    if (role) {
        where.role = role;
    }

    // Cascading academic filters (apply to students via their section/batch)
    if (department_id || batch_id || semester_id || section_id) {
        const studentWhere = {};
        if (section_id) {
            studentWhere.section_id = section_id;
        } else {
            if (batch_id) studentWhere.batch_id = batch_id;
            if (department_id || semester_id) {
                studentWhere.section = {};
                if (department_id) studentWhere.section.department_id = department_id;
                if (semester_id) studentWhere.section.semester_id = semester_id;
            }
        }
        where.student = { is: studentWhere };
        // Force role to STUDENT when academic filters are used
        where.role = 'STUDENT';
    }

    const [total, users] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
            where,
            select: {
                id: true,
                fullname: true,
                email: true,
                role: true,
                is_active: true,
                created_at: true,
            },
            orderBy: { created_at: 'desc' },
            skip: pagination.skip,
            take: pagination.take,
        }),
    ]);

    return paginatedResponse(users, total, pagination);
};

/* ===============================
   GET USER BY ID
================================ */
export const getUserByIdService = async id => {
    const user = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            fullname: true,
            email: true,
            role: true,
            phone_number: true,
            photo_url: true,
            is_active: true,
            created_at: true,
            student: {
                select: {
                    id: true,
                    stdId: true,
                    roll_no: true,
                    registration_no: true,
                    current_semester: true,
                    batch: { select: { id: true, name: true, start_year: true, end_year: true } },
                    section: {
                        select: {
                            id: true,
                            name: true,
                            department: { select: { id: true, name: true } },
                            semester: {
                                select: {
                                    id: true,
                                    number: true,
                                    department: { select: { id: true, name: true } },
                                },
                            },
                        },
                    },
                },
            },
            teacher: {
                select: {
                    id: true,
                    teacherId: true,
                    designation: true,
                    teaching_assignments: {
                        where: { is_deleted: false },
                        select: {
                            id: true,
                            subject: { select: { id: true, name: true, code: true } },
                            section: {
                                select: {
                                    id: true,
                                    name: true,
                                    department: { select: { id: true, name: true } },
                                    semester: { select: { id: true, number: true } },
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!user) throw new ApiError(404, 'User not found');
    return user;
};

/* ===============================
   GET ALL STUDENTS (with filters)
================================ */
export const getAllStudentsService = async (filters = {}) => {
    const { department_id, semester_id, section_id, is_active } = filters;
    const pagination = parsePagination(filters);

    const where = { is_deleted: false };

    // Build section filter
    if (department_id || semester_id || section_id) {
        where.section = {};
        if (section_id) where.section.id = section_id;
        if (department_id) where.section.department_id = department_id;
        if (semester_id) where.section.semester_id = semester_id;
    }

    // Filter by active status
    if (is_active !== undefined) {
        where.user = { is_active: is_active === 'true' || is_active === true };
    }

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
                    select: { ...userBasicSelect, is_active: true },
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

/* ===============================
   GET ALL TEACHERS (with filters)
================================ */
export const getAllTeachersService = async (filters = {}) => {
    const { is_active, designation } = filters;
    const pagination = parsePagination(filters);

    const where = { is_deleted: false };

    if (designation) where.designation = designation;
    if (is_active !== undefined) {
        where.user = { is_active: is_active === 'true' || is_active === true };
    }

    const [total, teachers] = await Promise.all([
        prisma.teacher.count({ where }),
        prisma.teacher.findMany({
            where,
            select: {
                id: true,
                teacherId: true,
                designation: true,
                user: {
                    select: { ...userBasicSelect, is_active: true },
                },
                _count: {
                    select: { teaching_assignments: { where: { is_deleted: false } } },
                },
            },
            orderBy: { user: { fullname: 'asc' } },
            skip: pagination.skip,
            take: pagination.take,
        }),
    ]);

    return paginatedResponse(teachers, total, pagination);
};

/* ===============================
   DEACTIVATE USER (ADMIN)
================================ */
export const deactivateUserService = async id => {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new ApiError(404, 'User not found');

    return prisma.user.update({
        where: { id },
        data: { is_active: false },
    });
};

/* ===============================
   ACTIVATE USER (ADMIN)
================================ */
export const activateUserService = async id => {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new ApiError(404, 'User not found');

    return prisma.user.update({
        where: { id },
        data: { is_active: true },
    });
};

/* ===============================
   CREATE ADMIN
================================ */
export const createAdminService = async data => {
    const { fullname, email, password, phone_number, file } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new ApiError(400, 'User with this email already exists');

    // Check if phone already exists
    const existingPhone = await prisma.user.findUnique({ where: { phone_number } });
    if (existingPhone) throw new ApiError(400, 'User with this phone number already exists');

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Save photo locally if provided
    let photoUrl = null;
    if (file) {
        photoUrl = savePhoto(file.path);
    }

    // Create admin user
    const admin = await prisma.user.create({
        data: {
            fullname,
            email,
            password: hashedPassword,
            phone_number,
            photo_url: photoUrl,
            role: 'ADMIN',
        },
    });

    return admin;
};

/* ===============================
   UPDATE ADMIN
================================ */
export const updateAdminService = async (id, data) => {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new ApiError(404, 'Admin not found');

    if (user.role !== 'ADMIN') throw new ApiError(400, 'User is not an admin');

    // Check if email is being changed and already exists
    if (data.email && data.email !== user.email) {
        const existingEmail = await prisma.user.findUnique({ where: { email: data.email } });
        if (existingEmail) throw new ApiError(400, 'Email already in use');
    }

    // Check if phone is being changed and already exists
    if (data.phone_number && data.phone_number !== user.phone_number) {
        const existingPhone = await prisma.user.findUnique({
            where: { phone_number: data.phone_number },
        });
        if (existingPhone) throw new ApiError(400, 'Phone number already in use');
    }

    const updatedAdmin = await prisma.user.update({
        where: { id },
        data: {
            fullname: data.fullname || user.fullname,
            email: data.email || user.email,
            phone_number: data.phone_number || user.phone_number,
        },
    });

    return updatedAdmin;
};

/* ===============================
   DELETE ADMIN
================================ */
export const deleteAdminService = async id => {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new ApiError(404, 'Admin not found');

    if (user.role !== 'ADMIN') throw new ApiError(400, 'User is not an admin');

    // Hard delete cascade for user
    await prisma.$transaction(async tx => {
        // Delete tokens and resets
        await tx.refreshToken.deleteMany({ where: { userId: id } });
        await tx.passwordReset.deleteMany({ where: { userId: id } });

        // Delete activity logs where this user is the actor
        await tx.activityLog.deleteMany({ where: { user_id: id } });

        // Finally delete the user
        return await tx.user.delete({ where: { id } });
    });

    return { message: 'Admin user and all related data deleted permanently' };
};

/* ===============================
   GET DASHBOARD STATS
================================ */
export const getDashboardStatsService = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalStudents, totalTeachers, totalDepartments, todaySessions] = await Promise.all([
        prisma.student.count({ where: { is_deleted: false } }),
        prisma.teacher.count({ where: { is_deleted: false } }),
        prisma.department.count({ where: { is_deleted: false } }),
        prisma.attendanceSession.count({
            where: {
                is_deleted: false,
                created_at: { gte: today },
            },
        }),
    ]);

    const stats = {
        totalStudents,
        totalTeachers,
        totalDepartments,
        todaySessions,
    };

    return stats;
};

/* ===============================
   UPDATE USER (ADMIN EDIT)
================================ */
export const updateUserService = async (id, data, file) => {
    const user = await prisma.user.findUnique({
        where: { id },
        include: { student: true, teacher: true },
    });
    if (!user) throw new ApiError(404, 'User not found');

    // Check email uniqueness if changed
    if (data.email && data.email !== user.email) {
        const existingEmail = await prisma.user.findUnique({ where: { email: data.email } });
        if (existingEmail) throw new ApiError(400, 'Email already in use');
    }

    // Check phone uniqueness if changed
    if (data.phone_number && data.phone_number !== user.phone_number) {
        const existingPhone = await prisma.user.findUnique({
            where: { phone_number: data.phone_number },
        });
        if (existingPhone) throw new ApiError(400, 'Phone number already in use');
    }

    // Save photo locally if provided
    let photo_url = user.photo_url;
    if (file) {
        // Delete old photo if it exists and is a local file
        if (photo_url && photo_url.startsWith('/uploads/')) {
            const oldPath = photo_url.substring(1); // Remove leading slash
            await fsPromises.unlink(oldPath).catch(() => {});
        }
        photo_url = savePhoto(file.path);
    }

    // Update user base info
    const updatedUser = await prisma.user.update({
        where: { id },
        data: {
            fullname: data.fullname || user.fullname,
            email: data.email || user.email,
            phone_number: data.phone_number || user.phone_number,
            photo_url,
        },
    });

    // Update role-specific info
    if (user.role === 'STUDENT' && user.student) {
        await prisma.student.update({
            where: { id: user.student.id },
            data: {
                roll_no: data.roll_no || user.student.roll_no,
                registration_no: data.registration_no || user.student.registration_no,
                ...(data.section_id && { section_id: data.section_id }),
            },
        });
    } else if (user.role === 'TEACHER' && user.teacher) {
        await prisma.teacher.update({
            where: { id: user.teacher.id },
            data: {
                designation: data.designation || user.teacher.designation,
            },
        });
    }

    return getUserByIdService(id);
};
