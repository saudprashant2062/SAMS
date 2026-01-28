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
export const getStudentAttendance = (params = {}) => {
  return axiosInstance.get("/students/attendance", { params });
};

/**
 * Get Student Subjects
 * GET /students/subjects
 */
export const getStudentSubjects = () => {
  return axiosInstance.get("/students/subjects");
};
