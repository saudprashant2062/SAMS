import axiosInstance from "./axiosInstance.js";

/* =====================================================
   STUDENT ATTENDANCE (Student Role)
===================================================== */

/**
 * Get My Attendance (Student)
 * GET /students/attendance
 */
export const getMyAttendance = (params = {}) => {
  return axiosInstance.get("/students/attendance", { params });
};

/**
 * Get My Attendance Summary (Student)
 * GET /students/attendance/summary
 */
export const getMyAttendanceSummary = () => {
  return axiosInstance.get("/students/attendance/summary");
};

/* =====================================================
   TEACHER ATTENDANCE (Teacher Role)
===================================================== */

/**
 * Create Attendance Session (Teacher)
 * POST /teachers/attendance/session
 */
export const createAttendanceSession = (data) => {
  return axiosInstance.post("/teachers/attendance/session", data);
};

/**
 * Mark Attendance (Teacher)
 * POST /teachers/attendance/mark
 */
export const markAttendance = (data) => {
  return axiosInstance.post("/teachers/attendance/mark", data);
};

/**
 * Get Attendance Records by Session (Teacher)
 * GET /teachers/attendance/:session_id
 */
export const getAttendanceRecords = (sessionId) => {
  return axiosInstance.get(`/teachers/attendance/${sessionId}`);
};

/* =====================================================
   ADMIN ATTENDANCE SESSIONS
===================================================== */

/**
 * Get All Attendance Sessions (Admin)
 * GET /admin/attendance/sessions
 */
export const getAllAttendanceSessions = (params = {}) => {
  return axiosInstance.get("/admin/attendance/sessions", { params });
};

/**
 * Get Attendance Session By ID (Admin)
 * GET /admin/attendance/sessions/:id
 */
export const getAttendanceSessionById = (id) => {
  return axiosInstance.get(`/admin/attendance/sessions/${id}`);
};

/**
 * Create Attendance Session (Admin)
 * POST /admin/attendance/sessions
 */
export const createAdminAttendanceSession = (data) => {
  return axiosInstance.post("/admin/attendance/sessions", data);
};

/**
 * Update Attendance Session (Admin)
 * PATCH /admin/attendance/sessions/:id
 */
export const updateAttendanceSession = (id, data) => {
  return axiosInstance.patch(`/admin/attendance/sessions/${id}`, data);
};

/**
 * Delete Attendance Session (Admin)
 * DELETE /admin/attendance/sessions/:id
 */
export const deleteAttendanceSession = (id) => {
  return axiosInstance.delete(`/admin/attendance/sessions/${id}`);
};

/* =====================================================
   ADMIN ATTENDANCE RECORDS
===================================================== */

/**
 * Mark Attendance (Admin)
 * POST /admin/attendance/records
 */
export const adminMarkAttendance = (data) => {
  return axiosInstance.post("/admin/attendance/records", data);
};

/**
 * Update Attendance Record (Admin)
 * PATCH /admin/attendance/records/:id
 */
export const updateAttendanceRecord = (id, data) => {
  return axiosInstance.patch(`/admin/attendance/records/${id}`, data);
};

/**
 * Delete Attendance Record (Admin)
 * DELETE /admin/attendance/records/:id
 */
export const deleteAttendanceRecord = (id) => {
  return axiosInstance.delete(`/admin/attendance/records/${id}`);
};

/**
 * Get Attendance Summary By Section (Admin)
 * GET /admin/attendance/summary/section/:section_id
 */
export const getAttendanceSummaryBySection = (sectionId) => {
  return axiosInstance.get(`/admin/attendance/summary/section/${sectionId}`);
};

/**
 * Import Attendance from CSV/XLSX (Admin)
 * POST /admin/attendance/import
 */
export const importAttendance = (formData) => {
  return axiosInstance.post("/admin/attendance/import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
