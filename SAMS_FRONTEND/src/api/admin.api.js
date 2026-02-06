import axiosInstance from "./axiosInstance.js";

/* =====================================================
   USER MANAGEMENT
===================================================== */

/**
 * Get All Users
 * GET /admin/users
 */
export const getAllUsers = (params = {}) => {
  return axiosInstance.get("/admin/users", { params });
};

/**
 * Get User By ID
 * GET /admin/users/:id
 */
export const getUserById = (id) => {
  return axiosInstance.get(`/admin/users/${id}`);
};

/**
 * Activate User
 * PATCH /admin/users/:id/activate
 */
export const activateUser = (id) => {
  return axiosInstance.patch(`/admin/users/${id}/activate`);
};

/**
 * Deactivate User
 * PATCH /admin/users/:id/deactivate
 */
export const deactivateUser = (id) => {
  return axiosInstance.patch(`/admin/users/${id}/deactivate`);
};

/**
 * Create User
 * POST /admin/users
 */
export const createUser = (data) => {
  return axiosInstance.post("/admin/users", data);
};

/**
 * Update User
 * PATCH /admin/users/:id
 */
export const updateUser = (id, formData) => {
  return axiosInstance.patch(`/admin/users/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

/**
 * Delete User
 * DELETE /admin/users/:id
 */
export const deleteUser = (id) => {
  return axiosInstance.delete(`/admin/users/${id}`);
};

/* =====================================================
   STUDENT MANAGEMENT
===================================================== */

/**
 * Create Student
 * POST /admin/students
 */
export const createStudent = (formData) => {
  return axiosInstance.post("/admin/students", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

/**
 * Get All Students
 * GET /admin/students
 */
export const getAllStudents = (params = {}) => {
  return axiosInstance.get("/admin/students", { params });
};

/**
 * Bulk Create Students from CSV
 * POST /admin/students/bulk
 */
export const bulkCreateStudents = (formData) => {
  return axiosInstance.post("/admin/students/bulk", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

/* =====================================================
   TEACHER MANAGEMENT
===================================================== */

/**
 * Create Teacher
 * POST /admin/teachers
 */
export const createTeacher = (formData) => {
  return axiosInstance.post("/admin/teachers", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

/**
 * Get All Teachers
 * GET /admin/teachers
 */
export const getAllTeachers = (params = {}) => {
  return axiosInstance.get("/admin/teachers", { params });
};

/**
 * Bulk Create Teachers from CSV
 * POST /admin/teachers/bulk
 */
export const bulkCreateTeachers = (formData) => {
  return axiosInstance.post("/admin/teachers/bulk", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

/* =====================================================
   ADMIN MANAGEMENT
===================================================== */

/**
 * Create Admin
 * POST /admin/admins
 */
export const createAdmin = (formData) => {
  return axiosInstance.post("/admin/admins", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

/**
 * Update Admin
 * PATCH /admin/admins/:id
 */
export const updateAdmin = (id, data) => {
  return axiosInstance.patch(`/admin/admins/${id}`, data);
};

/**
 * Delete Admin
 * DELETE /admin/admins/:id
 */
export const deleteAdmin = (id) => {
  return axiosInstance.delete(`/admin/admins/${id}`);
};

/* =====================================================
   DEPARTMENTS
===================================================== */

/**
 * Create Department
 * POST /admin/departments
 */
export const createDepartment = (data) => {
  return axiosInstance.post("/admin/departments", data);
};

/**
 * Get All Departments
 * GET /admin/departments
 */
export const getAllDepartments = (params = {}) => {
  return axiosInstance.get("/admin/departments", { params });
};

/**
 * Get Department By ID
 * GET /admin/departments/:id
 */
export const getDepartmentById = (id) => {
  return axiosInstance.get(`/admin/departments/${id}`);
};

/**
 * Update Department
 * PATCH /admin/departments/:id
 */
export const updateDepartment = (id, data) => {
  return axiosInstance.patch(`/admin/departments/${id}`, data);
};

/**
 * Delete Department
 * DELETE /admin/departments/:id
 */
export const deleteDepartment = (id) => {
  return axiosInstance.delete(`/admin/departments/${id}`);
};

/* =====================================================
   SEMESTERS
===================================================== */

/**
 * Create Semester
 * POST /admin/semesters
 */
export const createSemester = (data) => {
  return axiosInstance.post("/admin/semesters", data);
};

/**
 * Get All Semesters
 * GET /admin/semesters
 */
export const getAllSemesters = (params = {}) => {
  return axiosInstance.get("/admin/semesters", { params });
};

/**
 * Get Semester By ID
 * GET /admin/semesters/:id
 */
export const getSemesterById = (id) => {
  return axiosInstance.get(`/admin/semesters/${id}`);
};

/**
 * Update Semester
 * PATCH /admin/semesters/:id
 */
export const updateSemester = (id, data) => {
  return axiosInstance.patch(`/admin/semesters/${id}`, data);
};

/**
 * Delete Semester
 * DELETE /admin/semesters/:id
 */
export const deleteSemester = (id) => {
  return axiosInstance.delete(`/admin/semesters/${id}`);
};

/* =====================================================
   SECTIONS (Updated with Batch Context)
===================================================== */

/**
 * Create Section (with batch_id)
 * POST /admin/sections
 */
export const createSection = (data) => {
  return axiosInstance.post("/admin/sections", data);
};

/**
 * Get All Sections (with filters)
 * GET /admin/sections
 */
export const getAllSections = (params = {}) => {
  return axiosInstance.get("/admin/sections", { params });
};

/**
 * Get Section By ID
 * GET /admin/sections/:id
 */
export const getSectionById = (id) => {
  return axiosInstance.get(`/admin/sections/${id}`);
};

/**
 * Update Section
 * PUT /admin/sections/:id
 */
export const updateSection = (id, data) => {
  return axiosInstance.put(`/admin/sections/${id}`, data);
};

/**
 * Delete Section
 * DELETE /admin/sections/:id
 */
export const deleteSection = (id) => {
  return axiosInstance.delete(`/admin/sections/${id}`);
};

/**
 * Archive Section
 * POST /admin/sections/:id/archive
 */
export const archiveSection = (id) => {
  return axiosInstance.post(`/admin/sections/${id}/archive`);
};

/**
 * Restore Section
 * POST /admin/sections/:id/restore
 */
export const restoreSection = (id) => {
  return axiosInstance.post(`/admin/sections/${id}/restore`);
};

/**
 * Get Archived Sections
 * GET /admin/sections/archived
 */
export const getArchivedSections = (params = {}) => {
  return axiosInstance.get("/admin/sections/archived", { params });
};

/**
 * Promote Semester
 * POST /admin/sections/promote
 */
export const promoteSemester = (data) => {
  return axiosInstance.post("/admin/sections/promote", data);
};

/* =====================================================
   SUBJECTS
===================================================== */

/**
 * Create Subject
 * POST /admin/subjects
 */
export const createSubject = (data) => {
  return axiosInstance.post("/admin/subjects", data);
};

/**
 * Get All Subjects
 * GET /admin/subjects
 */
export const getAllSubjects = (params = {}) => {
  return axiosInstance.get("/admin/subjects", { params });
};

/**
 * Get Subject By ID
 * GET /admin/subjects/:id
 */
export const getSubjectById = (id) => {
  return axiosInstance.get(`/admin/subjects/${id}`);
};

/**
 * Update Subject
 * PATCH /admin/subjects/:id
 */
export const updateSubject = (id, data) => {
  return axiosInstance.patch(`/admin/subjects/${id}`, data);
};

/**
 * Delete Subject
 * DELETE /admin/subjects/:id
 */
export const deleteSubject = (id) => {
  return axiosInstance.delete(`/admin/subjects/${id}`);
};

/* =====================================================
   TEACHING ASSIGNMENTS
===================================================== */

/**
 * Create Teaching Assignment
 * POST /admin/teaching-assignments
 */
export const createTeachingAssignment = (data) => {
  return axiosInstance.post("/admin/teaching-assignments", data);
};

/**
 * Get All Teaching Assignments
 * GET /admin/teaching-assignments
 */
export const getAllTeachingAssignments = (params = {}) => {
  return axiosInstance.get("/admin/teaching-assignments", { params });
};

/**
 * Get Teaching Assignment By ID
 * GET /admin/teaching-assignments/:id
 */
export const getTeachingAssignmentById = (id) => {
  return axiosInstance.get(`/admin/teaching-assignments/${id}`);
};

/**
 * Update Teaching Assignment
 * PATCH /admin/teaching-assignments/:id
 */
export const updateTeachingAssignment = (id, data) => {
  return axiosInstance.patch(`/admin/teaching-assignments/${id}`, data);
};

/**
 * Delete Teaching Assignment
 * DELETE /admin/teaching-assignments/:id
 */
export const deleteTeachingAssignment = (id) => {
  return axiosInstance.delete(`/admin/teaching-assignments/${id}`);
};

/* =====================================================
   ATTENDANCE SESSIONS & RECORDS
===================================================== */

/**
 * Get All Attendance Sessions
 * GET /admin/attendance/sessions
 */
export const getAllAttendanceSessions = (params = {}) => {
  return axiosInstance.get("/admin/attendance/sessions", { params });
};

/**
 * Get Attendance Session By ID
 * GET /admin/attendance/sessions/:id
 */
export const getAttendanceSessionById = (id) => {
  return axiosInstance.get(`/admin/attendance/sessions/${id}`);
};

/**
 * Create Attendance Session
 * POST /admin/attendance/sessions
 */
export const createAttendanceSession = (data) => {
  return axiosInstance.post("/admin/attendance/sessions", data);
};

/**
 * Update Attendance Session
 * PATCH /admin/attendance/sessions/:id
 */
export const updateAttendanceSession = (id, data) => {
  return axiosInstance.patch(`/admin/attendance/sessions/${id}`, data);
};

/**
 * Delete Attendance Session
 * DELETE /admin/attendance/sessions/:id
 */
export const deleteAttendanceSession = (id) => {
  return axiosInstance.delete(`/admin/attendance/sessions/${id}`);
};

/**
 * Mark Attendance (create/update records)
 * POST /admin/attendance/records
 */
export const markAttendance = (data) => {
  return axiosInstance.post("/admin/attendance/records", data);
};

/**
 * Update Single Attendance Record
 * PATCH /admin/attendance/records/:id
 */
export const updateAttendanceRecord = (id, data) => {
  return axiosInstance.patch(`/admin/attendance/records/${id}`, data);
};

/**
 * Delete Attendance Record
 * DELETE /admin/attendance/records/:id
 */
export const deleteAttendanceRecord = (id) => {
  return axiosInstance.delete(`/admin/attendance/records/${id}`);
};

/**
 * Get Attendance Summary By Section
 * GET /admin/attendance/summary/section/:section_id
 */
export const getAttendanceSummaryBySection = (sectionId) => {
  return axiosInstance.get(`/admin/attendance/summary/section/${sectionId}`);
};

/* =====================================================
   REPORTS
===================================================== */

/**
 * Get Attendance Report
 * GET /admin/reports/attendance
 */
export const getAttendanceReport = (params = {}) => {
  return axiosInstance.get("/admin/reports/attendance", { params });
};

/**
 * Export Attendance Report
 * GET /admin/reports/attendance/export
 */
export const exportAttendanceReport = (params = {}) => {
  return axiosInstance.get("/admin/reports/attendance/export", {
    params,
    responseType: "blob",
  });
};

/**
 * Get Department-wise Attendance Report
 * GET /admin/reports/attendance/department
 */
export const getDepartmentAttendanceReport = (params = {}) => {
  return axiosInstance.get("/admin/reports/attendance/department", { params });
};

/**
 * Export Department-wise Attendance Report as CSV
 * GET /admin/reports/attendance/department/export
 */
export const exportDepartmentAttendanceReport = (params = {}) => {
  return axiosInstance.get("/admin/reports/attendance/department/export", {
    params,
    responseType: "blob",
  });
};

/* =====================================================
   DASHBOARD
===================================================== */

/**
 * Get Admin Dashboard Stats
 * GET /admin/dashboard
 */
export const getAdminDashboard = () => {
  return axiosInstance.get("/admin/dashboard");
};

// Alias for backward compatibility
export const getDashboardStats = getAdminDashboard;

/* =====================================================
   BATCHES
===================================================== */

/**
 * Create Batch
 * POST /admin/batches
 */
export const createBatch = (data) => {
  return axiosInstance.post("/admin/batches", data);
};

/**
 * Get All Batches
 * GET /admin/batches
 */
export const getAllBatches = (params = {}) => {
  return axiosInstance.get("/admin/batches", { params });
};

/**
 * Get Batch By ID
 * GET /admin/batches/:id
 */
export const getBatchById = (id) => {
  return axiosInstance.get(`/admin/batches/${id}`);
};

/**
 * Update Batch
 * PATCH /admin/batches/:id
 */
export const updateBatch = (id, data) => {
  return axiosInstance.patch(`/admin/batches/${id}`, data);
};

/**
 * Delete Batch
 * DELETE /admin/batches/:id
 */
export const deleteBatch = (id) => {
  return axiosInstance.delete(`/admin/batches/${id}`);
};

/* =====================================================
   ACTIVITY LOGS
===================================================== */

/**
 * Get Recent Activity Logs
 * GET /admin/activity-logs
 */
export const getRecentActivityLogs = (params = {}) => {
  return axiosInstance.get("/admin/activity-logs", { params });
};

/**
 * Get All Activity Logs with pagination
 * GET /admin/activity-logs/all
 */
export const getAllActivityLogs = (params = {}) => {
  return axiosInstance.get("/admin/activity-logs/all", { params });
};
