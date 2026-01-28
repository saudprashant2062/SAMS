import prisma from '../../config/prisma.js';
import ApiError from '../../utils/ApiError.utils.js';
import { hashPassword } from '../../utils/bcrypt.js';
import cloudinary from '../../config/cloudinary.js';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import csv from 'csv-parser';
import { bulkStudentRowSchema, bulkTeacherRowSchema } from '../../validators/user.validator.js';
import { userBasicSelect } from '../../utils/prisma.selects.js';

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
    const year = batch.year.toString().slice(-2);
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

/* ---------- Upload photo to Cloudinary ---------- */
const uploadPhoto = async filePath => {
    try {
        console.log('Uploading photo to Cloudinary:', filePath);

        const result = await cloudinary.uploader.upload(filePath, {
            folder: 'profile_photos',
            use_filename: true,
            unique_filename: true,
            timeout: 60000, // 60 second timeout
        });

        console.log('Cloudinary upload successful:', result.secure_url);

        // Delete local file after successful upload
        try {
            await fsPromises.unlink(filePath);
            console.log('Local file deleted:', filePath);
        } catch (unlinkErr) {
            console.error('Error deleting local file after upload:', unlinkErr.message);
        }

        return result.secure_url;
    } catch (error) {
        console.error('Cloudinary upload error:', error.message);

        // Try to delete file even if upload failed
        try {
            await fsPromises.unlink(filePath);
        } catch (unlinkError) {
            console.error('Error deleting temp file:', unlinkError.message);
        }
        throw new ApiError(500, 'Failed to upload photo. Please try again.');
    }
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
    if (file) photo_url = await uploadPhoto(file.path);

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
    if (file) photo_url = await uploadPhoto(file.path);

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

/* ---------- Upload photo to Cloudinary from URL or path ---------- */
const uploadPhotoFromUrl = async photoUrl => {
    if (!photoUrl) return null;

    try {
        // Upload to Cloudinary (works with URLs and local paths)
        const result = await cloudinary.uploader.upload(photoUrl, {
            folder: 'profile_photos',
            use_filename: true,
            unique_filename: true,
        });
        return result.secure_url;
    } catch (error) {
        console.error('Photo upload failed:', error.message);
        return null; // Return null if upload fails, don't break bulk creation
    }
};

/* ---------- Bulk Create Students via CSV ---------- */
export const bulkCreateStudentsCSVService = async (filePath, defaultSectionId, defaultBatchId) => {
    const results = [];
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

    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', row => results.push(row))
            .on('end', async () => {
                const createdStudents = [];

                for (const [index, row] of results.entries()) {
                    try {
                        // Use default section_id if provided, otherwise use from CSV
                        const section_id = defaultSectionId || row.section_id;
                        if (!section_id) {
                            errors.push({
                                row: index + 1,
                                error: 'Section is required for each student',
                            });
                            continue;
                        }

                        // Use default batch_id if provided, otherwise use from CSV
                        const batch_id = defaultBatchId || row.batch_id;
                        if (!batch_id) {
                            errors.push({
                                row: index + 1,
                                error: 'Batch is required for each student',
                            });
                            continue;
                        }

                        // Create modified row with section_id and batch_id
                        const rowWithData = { ...row, section_id, batch_id };

                        // Validate row using Zod
                        const parsed = bulkStudentRowSchema.safeParse(rowWithData);
                        if (!parsed.success) {
                            const errorMessages = Object.entries(parsed.error.format())
                                .filter(([key]) => key !== '_errors')
                                .map(([field, err]) => `${field}: ${err._errors?.join(', ')}`)
                                .join('; ');
                            errors.push({
                                row: index + 1,
                                error: errorMessages || 'Validation failed',
                            });
                            continue;
                        }

                        const {
                            fullname,
                            email,
                            password,
                            roll_no,
                            registration_no,
                            phone_number,
                            photo_url,
                        } = parsed.data;

                        // Check for existing email
                        if (await prisma.user.findUnique({ where: { email } })) {
                            errors.push({
                                row: index + 1,
                                error: `Email "${email}" is already registered`,
                            });
                            continue;
                        }

                        // Check for existing phone
                        if (await prisma.user.findUnique({ where: { phone_number } })) {
                            errors.push({
                                row: index + 1,
                                error: `Phone number "${phone_number}" is already registered`,
                            });
                            continue;
                        }

                        const hashedPassword = await hashPassword(password);
                        const stdId = await generateStudentId(section_id, batch_id);

                        // Upload photo to Cloudinary if provided
                        const uploadedPhotoUrl = await uploadPhotoFromUrl(photo_url);

                        const student = await prisma.user.create({
                            data: {
                                fullname,
                                email,
                                password: hashedPassword,
                                role: 'STUDENT',
                                photo_url: uploadedPhotoUrl,
                                phone_number,
                                student: {
                                    create: {
                                        stdId,
                                        roll_no,
                                        registration_no,
                                        section_id,
                                        batch_id,
                                    },
                                },
                            },
                            select: userResponseSelect,
                        });

                        createdStudents.push(student);
                    } catch (err) {
                        errors.push({ row: index + 1, error: err.message });
                    }
                }

                // Delete CSV after processing
                try {
                    await fsPromises.unlink(filePath);
                } catch (unlinkErr) {
                    console.error('Error deleting CSV file:', unlinkErr.message);
                }

                resolve({ created: createdStudents, errors });
            })
            .on('error', async err => {
                // Clean up CSV on error
                try {
                    await fsPromises.unlink(filePath);
                } catch (unlinkErr) {
                    console.error('Error deleting CSV file:', unlinkErr.message);
                }
                reject(err);
            });
    });
};

/* ---------- Bulk Create Teachers via CSV ---------- */
export const bulkCreateTeachersCSVService = async filePath => {
    const results = [];
    const errors = [];

    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', row => results.push(row))
            .on('end', async () => {
                const createdTeachers = [];

                for (const [index, row] of results.entries()) {
                    try {
                        // Validate row using Zod
                        const parsed = bulkTeacherRowSchema.safeParse(row);
                        if (!parsed.success) {
                            errors.push({ row: index + 1, error: parsed.error.format() });
                            continue;
                        }

                        const { fullname, email, password, designation, phone_number, photo_url } =
                            parsed.data;

                        if (await prisma.user.findUnique({ where: { email } })) {
                            errors.push({ row: index + 1, error: 'Email already exists' });
                            continue;
                        }

                        const hashedPassword = await hashPassword(password);
                        const teacherId = await generateTeacherId();

                        // Upload photo to Cloudinary if provided
                        const uploadedPhotoUrl = await uploadPhotoFromUrl(photo_url);

                        const teacher = await prisma.user.create({
                            data: {
                                fullname,
                                email,
                                password: hashedPassword,
                                role: 'TEACHER',
                                photo_url: uploadedPhotoUrl,
                                phone_number,
                                teacher: { create: { teacherId, designation } },
                            },
                            select: userResponseSelect,
                        });

                        createdTeachers.push(teacher);
                    } catch (err) {
                        errors.push({ row: index + 1, error: err.message });
                    }
                }

                // Delete CSV after processing
                try {
                    await fsPromises.unlink(filePath);
                } catch (unlinkErr) {
                    console.error('Error deleting CSV file:', unlinkErr.message);
                }

                resolve({ created: createdTeachers, errors });
            })
            .on('error', async err => {
                // Clean up CSV on error
                try {
                    await fsPromises.unlink(filePath);
                } catch (unlinkErr) {
                    console.error('Error deleting CSV file:', unlinkErr.message);
                }
                reject(err);
            });
    });
};

/* ===============================
   GET ALL USERS (ADMIN)
================================ */
export const getAllUsersService = async (filters = {}) => {
    const { search, role } = filters;
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

    return prisma.user.findMany({
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
    });
};

/* ===============================
   GET USER BY ID
================================ */
export const getUserByIdService = async id => {
    const user = await prisma.user.findUnique({
        where: { id },
        include: {
            student: {
                include: {
                    section: {
                        include: {
                            department: true,
                            semester: {
                                include: {
                                    department: true,
                                },
                            },
                        },
                    },
                },
            },
            teacher: {
                include: {
                    teaching_assignments: {
                        where: { is_deleted: false },
                        include: {
                            subject: true,
                            section: {
                                include: {
                                    department: true,
                                    semester: true,
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

    return prisma.student.findMany({
        where,
        include: {
            user: { select: { ...userBasicSelect, is_active: true } },
            section: {
                include: { department: true, semester: true },
            },
        },
        orderBy: [{ section: { name: 'asc' } }, { roll_no: 'asc' }],
    });
};

/* ===============================
   GET ALL TEACHERS (with filters)
================================ */
export const getAllTeachersService = async (filters = {}) => {
    const { is_active, designation } = filters;

    const where = { is_deleted: false };

    if (designation) where.designation = designation;
    if (is_active !== undefined) {
        where.user = { is_active: is_active === 'true' || is_active === true };
    }

    return prisma.teacher.findMany({
        where,
        include: {
            user: { select: { ...userBasicSelect, is_active: true } },
            teaching_assignments: {
                where: { is_deleted: false },
                select: { id: true, subject: true, section: true },
            },
        },
        orderBy: { user: { fullname: 'asc' } },
    });
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

    // Upload photo if provided
    let photoUrl = null;
    if (file) {
        photoUrl = await uploadPhoto(file.path);
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

    const deletedAdmin = await prisma.user.update({
        where: { id },
        data: { is_active: false },
    });

    return deletedAdmin;
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

    return {
        totalStudents,
        totalTeachers,
        totalDepartments,
        todaySessions,
    };
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

    // Upload photo if provided
    let photo_url = user.photo_url;
    if (file) {
        const result = await cloudinary.uploader.upload(file.path, {
            folder: 'sams/users',
            width: 300,
            crop: 'scale',
        });
        photo_url = result.secure_url;
        await fsPromises.unlink(file.path).catch(() => {});
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
