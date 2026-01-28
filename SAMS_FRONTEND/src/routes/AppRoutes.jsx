import { Routes, Route, Navigate } from "react-router-dom";

// Auth Pages
import Login from "../pages/auth/Login";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";

// Layouts
import AuthLayout from "../layouts/AuthLayout";
import AdminLayout from "../layouts/AdminLayout";
import TeacherLayout from "../layouts/TeacherLayout";
import StudentLayout from "../layouts/StudentLayout";

// Admin Pages
import AdminDashboard from "../pages/admin/Dashboard";
import AdminUsers from "../pages/admin/Users";
import AdminUserDetail from "../pages/admin/UserDetail";
import AdminUserEdit from "../pages/admin/UserEdit";
import AdminDepartments from "../pages/admin/Departments";
import AdminDepartmentDetail from "../pages/admin/DepartmentDetail";
import AdminSemesters from "../pages/admin/Semesters";
import AdminSemesterDetail from "../pages/admin/SemesterDetail";
import AdminSections from "../pages/admin/Sections";
import AdminSectionDetail from "../pages/admin/SectionDetail";
import AdminSubjects from "../pages/admin/Subjects";
import AdminSubjectDetail from "../pages/admin/SubjectDetail";
import AdminTeachingAssignments from "../pages/admin/TeachingAssignments";
import AdminAttendance from "../pages/admin/Attendance";
import AdminReports from "../pages/admin/Reports";
import AdminBatches from "../pages/admin/Batches";
import AdminActivityLogs from "../pages/admin/ActivityLogs";

// Shared Pages
import Profile from "../pages/shared/Profile";
import ChangePassword from "../pages/shared/ChangePassword";

// Teacher Pages
import TeacherDashboard from "../pages/teacher/Dashboard";
import TeacherAssignments from "../pages/teacher/Assignments";
import TeacherAttendance from "../pages/teacher/Attendance";

// Student Pages
import StudentDashboard from "../pages/student/Dashboard";
import StudentAttendance from "../pages/student/Attendance";
import StudentSubjects from "../pages/student/Subjects";

// Protected Route & Role Route
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

// Roles
const ROLES = {
  ADMIN: "ADMIN",
  TEACHER: "TEACHER",
  STUDENT: "STUDENT",
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes - Auth Layout */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <RoleRoute allowedRoles={[ROLES.ADMIN]}>
            <AdminLayout />
          </RoleRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="users/:id" element={<AdminUserDetail />} />
        <Route path="users/:id/edit" element={<AdminUserEdit />} />
        <Route path="departments" element={<AdminDepartments />} />
        <Route path="departments/:id" element={<AdminDepartmentDetail />} />
        <Route path="semesters" element={<AdminSemesters />} />
        <Route path="semesters/:id" element={<AdminSemesterDetail />} />
        <Route path="batches" element={<AdminBatches />} />
        <Route path="sections" element={<AdminSections />} />
        <Route path="sections/:id" element={<AdminSectionDetail />} />
        <Route path="subjects" element={<AdminSubjects />} />
        <Route path="subjects/:id" element={<AdminSubjectDetail />} />
        <Route
          path="teaching-assignments"
          element={<AdminTeachingAssignments />}
        />
        <Route path="attendance" element={<AdminAttendance />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="profile" element={<Profile />} />
        <Route path="change-password" element={<ChangePassword />} />
        <Route path="activity-logs" element={<AdminActivityLogs />} />
      </Route>

      {/* Teacher Routes */}
      <Route
        path="/teacher"
        element={
          <RoleRoute allowedRoles={[ROLES.TEACHER, ROLES.ADMIN]}>
            <TeacherLayout />
          </RoleRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<TeacherDashboard />} />
        <Route path="assignments" element={<TeacherAssignments />} />
        <Route path="attendance" element={<TeacherAttendance />} />
        <Route path="profile" element={<Profile />} />
        <Route path="change-password" element={<ChangePassword />} />
      </Route>

      {/* Student Routes */}
      <Route
        path="/student"
        element={
          <RoleRoute allowedRoles={[ROLES.STUDENT, ROLES.ADMIN]}>
            <StudentLayout />
          </RoleRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="attendance" element={<StudentAttendance />} />
        <Route path="subjects" element={<StudentSubjects />} />
        <Route path="profile" element={<Profile />} />
        <Route path="change-password" element={<ChangePassword />} />
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* 404 - Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
// 404 Page
const NotFound = () => {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "var(--bg-main)" }}
    >
      <div className="text-center">
        <h1 className="text-8xl font-bold" style={{ color: "var(--primary)" }}>
          404
        </h1>
        <p className="text-xl mt-4" style={{ color: "var(--text-secondary)" }}>
          Page Not Found
        </p>
        <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <a
          href="/login"
          className="mt-6 inline-block px-6 py-3 rounded-lg text-white font-medium transition-colors"
          style={{ backgroundColor: "var(--primary)" }}
        >
          Go to Login
        </a>
      </div>
    </div>
  );
};

export default AppRoutes;
