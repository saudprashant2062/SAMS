import asyncHandler from '../../utils/asyncHandler.utils.js';
import ApiError from '../../utils/ApiError.utils.js';
import ApiResponse from '../../utils/ApiResponse.utils.js';

import {
    createStudentWithUserSchema,
    createTeacherWithUserSchema,
    createAdminSchema,
} from '../../validators/user.validator.js';

import {
    createStudentService,
    createTeacherService,
    getAllUsersService,
    getUserByIdService,
    getAllStudentsService,
    getAllTeachersService,
    activateUserService,
    deactivateUserService,
    bulkCreateTeachersCSVService,
    bulkCreateStudentsCSVService,
    createAdminService,
    updateAdminService,
    deleteAdminService,
    getDashboardStatsService,
    updateUserService,
} from '../../services/admin/user.service.js';
import { logActivity } from '../../services/admin/activityLog.service.js';

/* =============================
   SINGLE CREATE STUDENT
============================= */
export const createStudent = asyncHandler(async (req, res) => {
    // Validate request body using Zod
    const parsed = createStudentWithUserSchema.safeParse({ body: req.body });
    if (!parsed.success) {
        throw new ApiError(422, 'Validation failed', parsed.error.format());
    }

    const student = await createStudentService({ ...parsed.data.body, file: req.file });

    // Log activity
    await logActivity({
        user_id: req.user.id,
        action: 'CREATE',
        entity_type: 'Student',
        entity_id: student.student?.id,
        description: `Created new student: ${student.fullname}`,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
    });

    res.status(201).json(new ApiResponse(201, student, 'Student created'));
});

/* =============================
   SINGLE CREATE TEACHER
============================= */
export const createTeacher = asyncHandler(async (req, res) => {
    const parsed = createTeacherWithUserSchema.safeParse({ body: req.body });
    if (!parsed.success) {
        throw new ApiError(422, 'Validation failed', parsed.error.format());
    }

    const teacher = await createTeacherService({ ...parsed.data.body, file: req.file });

    // Log activity
    await logActivity({
        user_id: req.user.id,
        action: 'CREATE',
        entity_type: 'Teacher',
        entity_id: teacher.teacher?.id,
        description: `Created new teacher: ${teacher.fullname}`,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
    });

    res.status(201).json(new ApiResponse(201, teacher, 'Teacher created'));
});

/* =============================
   BULK CREATE STUDENTS CSV
============================= */
export const bulkCreateStudentsCSV = asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError(400, 'Please upload a CSV file');

    const section_id = req.body.section_id;
    const batch_id = req.body.batch_id;

    if (!section_id) throw new ApiError(400, 'Please select a section for the students');
    if (!batch_id) throw new ApiError(400, 'Please select a batch for the students');

    const result = await bulkCreateStudentsCSVService(req.file.path, section_id, batch_id);

    // Log activity
    await logActivity({
        user_id: req.user.id,
        action: 'BULK_CREATE',
        entity_type: 'Student',
        description: `Bulk created ${result.created?.length || 0} students from CSV`,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
    });

    res.status(201).json(new ApiResponse(201, result, 'Students created successfully'));
});

/* =============================
   BULK CREATE TEACHERS CSV
============================= */
export const bulkCreateTeachersCSV = asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError(400, 'CSV file is required');

    const result = await bulkCreateTeachersCSVService(req.file.path);

    // Log activity
    await logActivity({
        user_id: req.user.id,
        action: 'BULK_CREATE',
        entity_type: 'Teacher',
        description: `Bulk created ${result.created?.length || 0} teachers from CSV`,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
    });

    res.status(201).json(new ApiResponse(201, result, 'Bulk teachers created'));
});

/* ===============================
   GET ALL USERS
================================ */
export const getAllUsers = asyncHandler(async (req, res) => {
    const { search, role } = req.query;
    const users = await getAllUsersService({ search, role });
    res.status(200).json(new ApiResponse(200, users, 'Users fetched'));
});

/* ===============================
   GET USER BY ID
================================ */
export const getUserById = asyncHandler(async (req, res) => {
    const user = await getUserByIdService(req.params.id);

    // Log activity
    await logActivity({
        user_id: req.user.id,
        action: 'VIEW',
        entity_type: 'User',
        entity_id: req.params.id,
        description: `Viewed user details: ${user.fullname}`,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
    });

    res.status(200).json(new ApiResponse(200, user, 'User fetched'));
});

/* ===============================
   GET ALL STUDENTS (with filters)
   Query params: department_id, semester_id, section_id, is_active
================================ */
export const getAllStudents = asyncHandler(async (req, res) => {
    const { department_id, semester_id, section_id, is_active } = req.query;
    const students = await getAllStudentsService({
        department_id,
        semester_id,
        section_id,
        is_active,
    });
    res.status(200).json(
        new ApiResponse(200, { students, count: students.length }, 'Students fetched'),
    );
});

/* ===============================
   GET ALL TEACHERS (with filters)
   Query params: is_active, designation
================================ */
export const getAllTeachers = asyncHandler(async (req, res) => {
    const { is_active, designation } = req.query;
    const teachers = await getAllTeachersService({ is_active, designation });
    res.status(200).json(
        new ApiResponse(200, { teachers, count: teachers.length }, 'Teachers fetched'),
    );
});

/* ===============================
   DEACTIVATE USER
================================ */
export const deactivateUser = asyncHandler(async (req, res) => {
    const user = await deactivateUserService(req.params.id);

    // Log activity
    await logActivity({
        user_id: req.user.id,
        action: 'UPDATE',
        entity_type: 'User',
        entity_id: req.params.id,
        description: `Deactivated user: ${user.fullname}`,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
    });

    res.status(200).json(new ApiResponse(200, user, 'User deactivated'));
});

/* ===============================
   ACTIVATE USER
================================ */
export const activateUser = asyncHandler(async (req, res) => {
    const user = await activateUserService(req.params.id);

    // Log activity
    await logActivity({
        user_id: req.user.id,
        action: 'UPDATE',
        entity_type: 'User',
        entity_id: req.params.id,
        description: `Activated user: ${user.fullname}`,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
    });

    res.status(200).json(new ApiResponse(200, user, 'User activated'));
});

/* ===============================
   CREATE ADMIN
================================ */
export const createAdmin = asyncHandler(async (req, res) => {
    const parsed = createAdminSchema.safeParse({ body: req.body });
    if (!parsed.success) {
        throw new ApiError(422, 'Validation failed', parsed.error.format());
    }

    const admin = await createAdminService({ ...parsed.data.body, file: req.file });

    // Log activity
    await logActivity({
        user_id: req.user.id,
        action: 'CREATE',
        entity_type: 'Admin',
        entity_id: admin.id,
        description: `Created new admin: ${admin.fullname}`,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
    });

    res.status(201).json(new ApiResponse(201, admin, 'Admin created'));
});

/* ===============================
   UPDATE ADMIN
================================ */
export const updateAdmin = asyncHandler(async (req, res) => {
    const admin = await updateAdminService(req.params.id, req.body);

    // Log activity
    await logActivity({
        user_id: req.user.id,
        action: 'UPDATE',
        entity_type: 'Admin',
        entity_id: req.params.id,
        description: `Updated admin details: ${admin.fullname}`,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
    });

    res.status(200).json(new ApiResponse(200, admin, 'Admin updated'));
});

/* ===============================
   DELETE ADMIN
================================ */
export const deleteAdmin = asyncHandler(async (req, res) => {
    await deleteAdminService(req.params.id);

    // Log activity
    await logActivity({
        user_id: req.user.id,
        action: 'DELETE',
        entity_type: 'Admin',
        entity_id: req.params.id,
        description: `Deleted admin user`,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
    });

    res.status(200).json(new ApiResponse(200, null, 'Admin deleted'));
});

/* ===============================
   GET DASHBOARD STATS
================================ */
export const getDashboardStats = asyncHandler(async (_req, res) => {
    const stats = await getDashboardStatsService();
    res.status(200).json(new ApiResponse(200, stats, 'Dashboard stats fetched'));
});

/* ===============================
   UPDATE USER (ADMIN EDIT)
================================ */
export const updateUser = asyncHandler(async (req, res) => {
    const user = await updateUserService(req.params.id, req.body, req.file);

    // Log activity
    await logActivity({
        user_id: req.user.id,
        action: 'UPDATE',
        entity_type: 'User',
        entity_id: req.params.id,
        description: `Updated user details: ${user.fullname}`,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
    });

    res.status(200).json(new ApiResponse(200, user, 'User updated'));
});
