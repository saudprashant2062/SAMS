import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import {
  selectIsAuthenticated,
  selectUserRole,
  selectAuthStatus,
} from "../features/auth/auth.selector";

/**
 * ProtectedRoute Component
 * Protects routes that require authentication and optionally specific roles
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The component to render if authorized
 * @param {string[]} props.allowedRoles - Optional array of roles that can access this route
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const userRole = useSelector(selectUserRole);
  const authStatus = useSelector(selectAuthStatus);
  const location = useLocation();

  // Still checking auth — don't redirect yet, show nothing (App.jsx shows loader)
  if (authStatus === "loading") {
    return null;
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if allowedRoles is provided
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(userRole)) {
      // User doesn't have the required role - redirect to their dashboard
      const redirectPath = getRoleBasedRedirect(userRole);
      return <Navigate to={redirectPath} replace />;
    }
  }

  // Authorized - render the protected component
  return children;
};

/**
 * Get redirect path based on user role
 */
const getRoleBasedRedirect = (role) => {
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard";
    case "TEACHER":
      return "/teacher/dashboard";
    case "STUDENT":
      return "/student/dashboard";
    default:
      return "/dashboard";
  }
};

export default ProtectedRoute;
