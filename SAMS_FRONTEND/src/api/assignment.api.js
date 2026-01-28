import axiosInstance from "./axiosInstance.js";

/* =====================================================
   ADMIN TEACHING ASSIGNMENTS
===================================================== */

/**
 * Create Teaching Assignment (Admin)
 * POST /admin/teaching-assignments
 */
export const createTeachingAssignment = (data) => {
  return axiosInstance.post("/admin/teaching-assignments", data);
};

/**
 * Get All Teaching Assignments (Admin)
 * GET /admin/teaching-assignments
 */
export const getAllTeachingAssignments = (params = {}) => {
  return axiosInstance.get("/admin/teaching-assignments", { params });
};

/**
 * Get Teaching Assignment By ID (Admin)
 * GET /admin/teaching-assignments/:id
 */
export const getTeachingAssignmentById = (id) => {
  return axiosInstance.get(`/admin/teaching-assignments/${id}`);
};

/**
 * Delete Teaching Assignment (Admin)
 * DELETE /admin/teaching-assignments/:id
 */
export const deleteTeachingAssignment = (id) => {
  return axiosInstance.delete(`/admin/teaching-assignments/${id}`);
};
