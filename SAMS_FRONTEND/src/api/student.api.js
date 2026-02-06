import axiosInstance from "./axiosInstance.js";

/* =====================================================
   STUDENT - ATTENDANCE
===================================================== */

/**
 * Get My Attendance
 * GET /students/attendance
 */
export const getMyAttendance = (params = {}) => {
  return axiosInstance.get("/students/attendance", { params });
};

/**
 * Get My Attendance Summary
 * GET /students/attendance/summary
 */
export const getMyAttendanceSummary = () => {
  return axiosInstance.get("/students/attendance/summary");
};

/* =====================================================
   STUDENT - SUBJECTS & SECTION
===================================================== */

/**
 * Get My Subjects
 * GET /students/subjects
 */
export const getMySubjects = () => {
  return axiosInstance.get("/students/subjects");
};

/**
 * Get My Section
 * GET /students/section
 */
export const getMySection = () => {
  return axiosInstance.get("/students/section");
};

/* =====================================================
   STUDENT - DASHBOARD
===================================================== */

/**
 * Get Student Dashboard Data
 * GET /students/dashboard
 */
export const getStudentDashboard = () => {
  return axiosInstance.get("/students/dashboard");
};

/**
 * Get Student Attendance
 * GET /students/attendance
 */
export const getStudentAttendance = (filters = {}) => {
  const params = {};

  if (filters.subjectId) {
    params.subject_id = filters.subjectId;
  }

  if (filters.status) {
    params.status = filters.status;
  }

  if (filters.month) {
    const year = new Date().getFullYear();
    const monthIndex = parseInt(filters.month) - 1;
    const startDate = new Date(year, monthIndex, 1);
    const endDate = new Date(year, monthIndex + 1, 0);

    // Format as YYYY-MM-DD
    params.start_date = startDate.toISOString().split("T")[0];
    params.end_date = endDate.toISOString().split("T")[0];
  }

  return axiosInstance.get("/students/attendance", { params });
};

/**
 * Get Student Subjects
 * GET /students/subjects
 */
export const getStudentSubjects = () => {
  return axiosInstance.get("/students/subjects");
};
