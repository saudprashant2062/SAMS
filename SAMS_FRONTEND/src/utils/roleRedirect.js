/**
 * Redirect user to appropriate dashboard based on role
 * @param {string} role - User role (ADMIN, TEACHER, STUDENT)
 * @param {function} navigate - React Router navigate function
 */
export const redirectByRole = (role, navigate) => {
  const dashboardRoutes = {
    ADMIN: "/admin/dashboard",
    TEACHER: "/teacher/dashboard",
    STUDENT: "/student/dashboard",
  };

  const destination = dashboardRoutes[role] || "/login";
  navigate(destination, { replace: true });
};

/**
 * Get dashboard path for a role
 * @param {string} role - User role
 * @returns {string} Dashboard path
 */
export const getDashboardPath = (role) => {
  const routes = {
    ADMIN: "/admin/dashboard",
    TEACHER: "/teacher/dashboard",
    STUDENT: "/student/dashboard",
  };
  return routes[role] || "/login";
};

/**
 * Check if user has access to a route
 * @param {string} userRole - Current user's role
 * @param {string[]} allowedRoles - Roles allowed to access the route
 * @returns {boolean}
 */
export const hasAccess = (userRole, allowedRoles) => {
  return allowedRoles.includes(userRole);
};

/**
 * Get home route for unauthenticated users
 * @returns {string}
 */
export const getPublicHome = () => "/login";
