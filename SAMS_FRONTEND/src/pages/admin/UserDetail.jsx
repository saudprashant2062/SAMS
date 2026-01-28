import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  HiOutlineArrowLeft,
  HiOutlineUser,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineAcademicCap,
  HiOutlineOfficeBuilding,
  HiOutlineIdentification,
  HiOutlineCalendar,
  HiOutlineCheckCircle,
  HiOutlineBan,
  HiOutlineDownload,
  HiOutlinePencil,
} from "react-icons/hi";
import { getUserById } from "../../api/admin.api";

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["user", id],
    queryFn: () => getUserById(id),
    select: (res) => res.data.data,
  });

  const exportToCSV = () => {
    if (!user) return;

    const headers = [
      "ID",
      "Full Name",
      "Email",
      "Phone",
      "Role",
      "Status",
      "Photo URL",
      "Created At",
    ];

    let row = [
      user.id,
      user.fullname,
      user.email,
      user.phone_number || "",
      user.role,
      user.is_active ? "Active" : "Inactive",
      user.photo_url || "",
      user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A",
    ];

    // Add role-specific fields
    if (user.role === "STUDENT" && user.student) {
      headers.push(
        "Roll No",
        "Registration No",
        "Section",
        "Department",
        "Semester",
      );
      row.push(
        user.student.roll_no || "",
        user.student.registration_no || "",
        user.student.section?.name || "",
        user.student.section?.semester?.department?.name || "",
        user.student.section?.semester?.number || "",
      );
    } else if (user.role === "TEACHER" && user.teacher) {
      headers.push("Designation", "Employee ID");
      row.push(user.teacher.designation || "", user.teacher.employee_id || "");
    }

    const csvContent = [
      headers.join(","),
      row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `user-${user.id}-${user.fullname.replace(/\s+/g, "_")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2"
          style={{ borderColor: "var(--primary)" }}
        ></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p style={{ color: "var(--danger)" }}>
          {error.response?.data?.message || "Error loading user details"}
        </p>
        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            onClick={() => navigate("/admin/users")}
            className="text-sm"
            style={{ color: "var(--primary)" }}
          >
            Back to Users
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: "var(--primary)",
              color: "white",
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p style={{ color: "var(--danger)" }}>User not found</p>
        <button
          onClick={() => navigate("/admin/users")}
          className="mt-4 text-sm"
          style={{ color: "var(--primary)" }}
        >
          Back to Users
        </button>
      </div>
    );
  }

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case "ADMIN":
        return { backgroundColor: "#FEE2E2", color: "#DC2626" };
      case "TEACHER":
        return { backgroundColor: "#D1FAE5", color: "#065F46" };
      case "STUDENT":
        return { backgroundColor: "#DBEAFE", color: "#1D4ED8" };
      default:
        return { backgroundColor: "#F3F4F6", color: "#6B7280" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/users")}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            <HiOutlineArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1
              className="text-xl font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              User Details
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              View user information
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => navigate(`/admin/users/${id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 sm:flex-none justify-center"
            style={{
              backgroundColor: "var(--bg-main)",
              color: "var(--primary)",
              border: "1px solid var(--border)",
            }}
          >
            <HiOutlinePencil className="w-4 h-4" />
            <span>Edit</span>
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 sm:flex-none justify-center"
            style={{
              backgroundColor: "var(--primary)",
              color: "white",
            }}
          >
            <HiOutlineDownload className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div
          className="rounded-xl p-6 shadow-sm"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="text-center">
            {user.photo_url ? (
              <img
                src={user.photo_url}
                alt={user.fullname}
                className="w-32 h-32 rounded-full mx-auto object-cover border-4"
                style={{ borderColor: "var(--primary-light)" }}
              />
            ) : (
              <div
                className="w-32 h-32 rounded-full mx-auto flex items-center justify-center text-4xl font-semibold"
                style={{
                  backgroundColor: "var(--primary-light)",
                  color: "var(--primary)",
                }}
              >
                {user.fullname?.charAt(0)?.toUpperCase()}
              </div>
            )}
            <h2
              className="mt-4 text-lg font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {user.fullname}
            </h2>
            <span
              className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium"
              style={getRoleBadgeStyle(user.role)}
            >
              {user.role}
            </span>
            <div className="mt-3 flex items-center justify-center gap-2">
              {user.is_active ? (
                <>
                  <HiOutlineCheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600">Active</span>
                </>
              ) : (
                <>
                  <HiOutlineBan className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-600">Inactive</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Details Card */}
        <div
          className="lg:col-span-2 rounded-xl p-6 shadow-sm"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <h3
            className="text-lg font-medium mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            Contact Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: "var(--primary-light)" }}
              >
                <HiOutlineMail
                  className="w-5 h-5"
                  style={{ color: "var(--primary)" }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Email
                </p>
                <p
                  className="text-sm font-medium break-all"
                  style={{ color: "var(--text-primary)" }}
                >
                  {user.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: "var(--primary-light)" }}
              >
                <HiOutlinePhone
                  className="w-5 h-5"
                  style={{ color: "var(--primary)" }}
                />
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Phone
                </p>
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {user.phone_number || "N/A"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: "var(--primary-light)" }}
              >
                <HiOutlineCalendar
                  className="w-5 h-5"
                  style={{ color: "var(--primary)" }}
                />
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Joined
                </p>
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: "var(--primary-light)" }}
              >
                <HiOutlineIdentification
                  className="w-5 h-5"
                  style={{ color: "var(--primary)" }}
                />
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {user.role === "STUDENT"
                    ? "Student ID"
                    : user.role === "TEACHER"
                      ? "Teacher ID"
                      : "User ID"}
                </p>
                <p
                  className="text-sm font-medium font-mono"
                  style={{ color: "var(--text-primary)" }}
                >
                  {user.role === "STUDENT" && user.student
                    ? user.student.stdId
                    : user.role === "TEACHER" && user.teacher
                      ? user.teacher.teacherId
                      : user.id}
                </p>
              </div>
            </div>
          </div>

          {/* Role-specific Information */}
          {user.role === "STUDENT" && user.student && (
            <>
              <h3
                className="text-lg font-medium mt-6 mb-4"
                style={{ color: "var(--text-primary)" }}
              >
                Academic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: "#D1FAE5" }}
                  >
                    <HiOutlineIdentification className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Roll Number
                    </p>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {user.student.roll_no}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: "#DBEAFE" }}
                  >
                    <HiOutlineIdentification className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Registration Number
                    </p>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {user.student.registration_no}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: "#FEF3C7" }}
                  >
                    <HiOutlineAcademicCap className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Section
                    </p>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {user.student.section?.name || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: "#FCE7F3" }}
                  >
                    <HiOutlineOfficeBuilding className="w-5 h-5 text-pink-600" />
                  </div>
                  <div>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Department
                    </p>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {user.student.section?.semester?.department?.name ||
                        "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {user.role === "TEACHER" && user.teacher && (
            <>
              <h3
                className="text-lg font-medium mt-6 mb-4"
                style={{ color: "var(--text-primary)" }}
              >
                Professional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: "#D1FAE5" }}
                  >
                    <HiOutlineAcademicCap className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Designation
                    </p>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {user.teacher.designation || "N/A"}
                    </p>
                  </div>
                </div>
                {user.teacher.employee_id && (
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: "#DBEAFE" }}
                    >
                      <HiOutlineIdentification className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Employee ID
                      </p>
                      <p
                        className="text-sm font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {user.teacher.employee_id}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Photo URL */}
          {user.photo_url && (
            <>
              <h3
                className="text-lg font-medium mt-6 mb-4"
                style={{ color: "var(--text-primary)" }}
              >
                Photo
              </h3>
              <div
                className="p-3 rounded-lg text-sm break-all"
                style={{ backgroundColor: "var(--bg-main)" }}
              >
                <a
                  href={user.photo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                  style={{ color: "var(--primary)" }}
                >
                  {user.photo_url}
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetail;
