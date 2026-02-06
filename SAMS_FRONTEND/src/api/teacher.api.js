import axiosInstance from "./axiosInstance.js";

/* =====================================================
   TEACHER - ASSIGNMENTS
===================================================== */

/**
 * Get Teacher's Assignments
 * GET /teachers/assignments
 */
export const getMyAssignments = () => {
  return axiosInstance.get("/teachers/assignments");
};

/**
 * Get Teaching Assignment By ID
 * GET /teachers/assignments/:id
 */
export const getAssignmentById = (id) => {
  return axiosInstance.get(`/teachers/assignments/${id}`);
};

/* =====================================================
   TEACHER - ATTENDANCE
===================================================== */

/**
 * Create Attendance Session
 * POST /teachers/attendance/session
 */
export const createAttendanceSession = (data) => {
  return axiosInstance.post("/teachers/attendance/session", data);
};

/**
 * Update Attendance Session
 * PATCH /teachers/attendance/session/:id
 */
export const updateAttendanceSession = (id, data) => {
  return axiosInstance.patch(`/teachers/attendance/session/${id}`, data);
};

/**
 * Mark Attendance
 * POST /teachers/attendance/mark
 */
export const markAttendance = (data) => {
  return axiosInstance.post("/teachers/attendance/mark", data);
};

/**
 * Get Attendance Records by Session ID
 * GET /teachers/attendance/:session_id
 */
export const getAttendanceRecords = (sessionId) => {
  return axiosInstance.get(`/teachers/attendance/${sessionId}`);
};

/* =====================================================
   TEACHER - DASHBOARD & MISC
===================================================== */

/**
 * Get Teacher Dashboard Data
 * GET /teachers/dashboard
 */
export const getTeacherDashboard = () => {
  return axiosInstance.get("/teachers/dashboard");
};

/**
 * Get Teacher's Teaching Assignments
 * GET /teachers/assignments
 */
export const getTeacherAssignments = () => {
  return axiosInstance.get("/teachers/assignments");
};

/**
 * Get Students by Assignment
 * GET /teachers/assignments/:id/students
 */
export const getStudentsByAssignment = (assignmentId) => {
  return axiosInstance.get(`/teachers/assignments/${assignmentId}/students`);
};

/**
 * Get Attendance History for Assignment
 * GET /teachers/attendance/history/:assignmentId
 */
export const getAttendanceHistory = (assignmentId) => {
  return axiosInstance.get(`/teachers/attendance/history/${assignmentId}`);
};
