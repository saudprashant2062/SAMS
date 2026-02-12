import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  selectIsAuthenticated,
  selectUserRole,
  selectAuthStatus,
} from "../features/auth/auth.selector";
import { getDashboardPath } from "../utils/roleRedirect";

const AuthLayout = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const userRole = useSelector(selectUserRole);
  const authStatus = useSelector(selectAuthStatus);

  // Still verifying auth — don't render anything yet
  if (authStatus === "loading") {
    return null;
  }

  // Already logged in — redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to={getDashboardPath(userRole)} replace />;
  }
  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row"
      style={{ backgroundColor: "var(--bg-main)" }}
    >
      {/* Left Side - Branding (Desktop Only) */}
      <div
        className="hidden lg:flex lg:w-1/2 xl:w-2/5 flex-col items-center justify-center p-8"
        style={{ backgroundColor: "var(--primary)" }}
      >
        <div className="text-center max-w-md">
          <div className="mb-6">
            <img
              src="/Academia.png"
              alt="Academia College"
              className="w-32 h-32 mx-auto object-contain"
            />
          </div>
          <h1 className="text-3xl xl:text-4xl font-bold text-white mb-2">
            Academia College
          </h1>
          <h2 className="text-lg xl:text-xl font-medium text-white/80">
            Student Attendance Management System
          </h2>
        </div>
      </div>

      {/* Right Side - Auth Forms */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
