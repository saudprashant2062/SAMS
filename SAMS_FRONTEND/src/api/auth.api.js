import axiosInstance from "./axiosInstance.js";

/* =====================================================
   AUTHENTICATION
===================================================== */

/**
 * Login
 * POST /auth/login
 */
export const login = (credentials) => {
  return axiosInstance.post("/auth/login", credentials);
};

/**
 * Logout
 * POST /auth/logout
 */
export const logout = () => {
  return axiosInstance.post("/auth/logout");
};

/**
 * Refresh Token
 * POST /auth/refresh-token
 */
export const refreshToken = () => {
  return axiosInstance.post("/auth/refresh-token");
};

/**
 * Get Current User
 * GET /auth/me
 */
export const getMe = () => {
  return axiosInstance.get("/auth/me");
};

/**
 * Reset Password (Authenticated)
 * PATCH /auth/reset-password
 */
export const resetPassword = (data) => {
  return axiosInstance.patch("/auth/reset-password", data);
};

/**
 * Forgot Password
 * POST /auth/forgot-password
 */
export const forgotPassword = (email) => {
  return axiosInstance.post("/auth/forgot-password", { email });
};

/**
 * Reset Password with Token
 * POST /auth/reset-password-token
 */
export const resetPasswordWithToken = (data) => {
  return axiosInstance.post("/auth/reset-password-token", data);
};
