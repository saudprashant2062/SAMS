import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectUser } from "../../features/auth/auth.selector";
import { getFileUrl } from "../../utils/constants";
import {
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineCalendar,
  HiOutlineIdentification,
  HiOutlineAcademicCap,
  HiOutlineOfficeBuilding,
  HiOutlineBookOpen,
  HiOutlineBadgeCheck,
  HiOutlinePencil,
  HiOutlineKey,
} from "react-icons/hi";

const Profile = () => {
  const user = useSelector(selectUser);
  const navigate = useNavigate();

  // Determine the base path based on user role
  const getBasePath = () => {
    switch (user?.role) {
      case "ADMIN":
        return "/admin";
      case "TEACHER":
        return "/teacher";
      case "STUDENT":
        return "/student";
      default:
        return "";
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2"
          style={{ borderColor: "var(--primary)" }}
        ></div>
      </div>
    );
  }

  const getRoleBadgeStyles = (role) => {
    switch (role) {
      case "ADMIN":
        return { bg: "#FEE2E2", color: "#DC2626" };
      case "TEACHER":
        return { bg: "#D1FAE5", color: "#065F46" };
      case "STUDENT":
        return { bg: "#DBEAFE", color: "#1D4ED8" };
      default:
        return { bg: "#F3F4F6", color: "#6B7280" };
    }
  };

  const badge = getRoleBadgeStyles(user.role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1
            className="text-xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            My Profile
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            View and manage your account information
          </p>
        </div>
        <button
          onClick={() => navigate(`${getBasePath()}/change-password`)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            backgroundColor: "var(--bg-main)",
            color: "var(--text-primary)",
            border: "1px solid var(--border)",
          }}
        >
          <HiOutlineKey className="w-4 h-4" />
          Change Password
        </button>
      </div>

      {/* Profile Card */}
      <div
        className="rounded-xl p-6 shadow-sm"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar */}
          <div className="text-center">
            {user.photo_url ? (
              <img
                src={getFileUrl(user.photo_url)}
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
            <span
              className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: badge.bg,
                color: badge.color,
              }}
            >
              {user.role}
            </span>
          </div>

          {/* Details */}
          <div className="flex-1 w-full">
            <h2
              className="text-xl font-semibold mb-1 text-center md:text-left"
              style={{ color: "var(--text-primary)" }}
            >
              {user.fullname}
            </h2>
            <p
              className="text-sm mb-4 text-center md:text-left"
              style={{ color: "var(--text-muted)" }}
            >
              {user.email}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
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
                <div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Email
                  </p>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Phone */}
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

              {/* Student-specific: Roll Number */}
              {user.role === "STUDENT" && user.student && (
                <>
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
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Student ID
                      </p>
                      <p
                        className="text-sm font-medium font-mono"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {user.student.stdId || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: "var(--primary-light)" }}
                    >
                      <HiOutlineBadgeCheck
                        className="w-5 h-5"
                        style={{ color: "var(--primary)" }}
                      />
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
                        {user.student.roll_no || "N/A"}
                      </p>
                    </div>
                  </div>
                  {user.student.registration_no && (
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: "var(--primary-light)" }}
                      >
                        <HiOutlineBookOpen
                          className="w-5 h-5"
                          style={{ color: "var(--primary)" }}
                        />
                      </div>
                      <div>
                        <p
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Registration No
                        </p>
                        <p
                          className="text-sm font-medium"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {user.student.registration_no}
                        </p>
                      </div>
                    </div>
                  )}
                  {user.student.section && (
                    <>
                      <div className="flex items-center gap-3">
                        <div
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: "var(--primary-light)" }}
                        >
                          <HiOutlineAcademicCap
                            className="w-5 h-5"
                            style={{ color: "var(--primary)" }}
                          />
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
                            {user.student.section.name}
                            {user.student.batch &&
                              ` (Batch ${user.student.batch.start_year})`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: "var(--primary-light)" }}
                        >
                          <HiOutlineOfficeBuilding
                            className="w-5 h-5"
                            style={{ color: "var(--primary)" }}
                          />
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
                            {user.student.section.department?.name ||
                              user.student.section.semester?.department?.name ||
                              "N/A"}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Teacher-specific: Designation & Teacher ID */}
              {user.role === "TEACHER" && user.teacher && (
                <>
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
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Teacher ID
                      </p>
                      <p
                        className="text-sm font-medium font-mono"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {user.teacher.teacherId || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: "var(--primary-light)" }}
                    >
                      <HiOutlineBadgeCheck
                        className="w-5 h-5"
                        style={{ color: "var(--primary)" }}
                      />
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
                </>
              )}

              {/* Admin: Show Admin ID */}
              {user.role === "ADMIN" && (
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
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Admin ID
                    </p>
                    <p
                      className="text-sm font-medium font-mono"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {user.id?.substring(0, 12)}...
                    </p>
                  </div>
                </div>
              )}

              {/* Member Since */}
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
                    Member Since
                  </p>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Status Card */}
      <div
        className="rounded-xl p-4 shadow-sm"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        <h3
          className="text-sm font-semibold mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          Account Status
        </h3>
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: user.is_active
                ? "var(--status-present)"
                : "var(--danger)",
            }}
          ></span>
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {user.is_active ? "Active Account" : "Inactive Account"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Profile;
