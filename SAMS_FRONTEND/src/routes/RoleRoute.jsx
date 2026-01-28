import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import {
  selectIsAuthenticated,
  selectUserRole,
} from "../features/auth/auth.selector";

/**
 * RoleRoute Component
 * Restricts access to specific roles
 */
const RoleRoute = ({ children, allowedRoles }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const userRole = useSelector(selectUserRole);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(userRole)) {
    // Redirect to appropriate dashboard based on role
    const redirectMap = {
      ADMIN: "/admin/dashboard",
      TEACHER: "/teacher/dashboard",
      STUDENT: "/student/dashboard",
    };
    return <Navigate to={redirectMap[userRole] || "/login"} replace />;
  }

  return children;
};

export default RoleRoute;
