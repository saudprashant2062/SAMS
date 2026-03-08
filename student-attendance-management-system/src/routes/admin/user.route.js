import express from 'express';

import {
    createStudent,
    createTeacher,
    bulkCreateStudentsCSV,
    bulkCreateTeachersCSV,
    getAllUsers,
    getUserById,
    getAllStudents,
    getAllTeachers,
    activateUser,
    deactivateUser,
    createAdmin,
    updateAdmin,
    deleteAdmin,
    getDashboardStats,
    updateUser,
} from '../../controllers/admin/user.controller.js';

import authMiddleware from '../../middlewares/auth.middleware.js';
import roleMiddleware from '../../middlewares/role.middleware.js';
import { upload, uploadPhoto, uploadFile } from '../../utils/multer.utils.js';

const router = express.Router();

/* ===============================
   SECURITY
================================ */
router.use(authMiddleware);
router.use(roleMiddleware('ADMIN'));

/* ===============================
   DASHBOARD
================================ */
router.get('/dashboard', getDashboardStats);

/* ===============================
   CREATE — SINGLE
================================ */
router.post('/students', uploadPhoto.single('photo'), createStudent);
router.post('/teachers', uploadPhoto.single('photo'), createTeacher);

/* ===============================
   CREATE — BULK (CSV)
================================ */
router.post('/students/bulk', uploadFile.single('file'), bulkCreateStudentsCSV);

router.post('/teachers/bulk', uploadFile.single('file'), bulkCreateTeachersCSV);

/* ===============================
   READ — LIST
================================ */
router.get('/users', getAllUsers);
router.get('/students', getAllStudents);
router.get('/teachers', getAllTeachers);

/* ===============================
   READ — SINGLE
================================ */
router.get('/users/:id', getUserById);

/* ===============================
   UPDATE USER
================================ */
router.patch('/users/:id', uploadPhoto.single('photo'), updateUser);

/* ===============================
   STATUS (Soft Enable/Disable)
================================ */
router.patch('/users/:id/activate', activateUser);
router.patch('/users/:id/deactivate', deactivateUser);

/* ===============================
   ADMIN MANAGEMENT
================================ */
router.post('/admins', uploadPhoto.single('photo'), createAdmin);
router.patch('/admins/:id', updateAdmin);
router.delete('/admins/:id', deleteAdmin);

export default router;
