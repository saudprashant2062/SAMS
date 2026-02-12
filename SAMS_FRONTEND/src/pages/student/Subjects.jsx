import { useQuery } from "@tanstack/react-query";
import {
  HiOutlineAcademicCap,
  HiOutlineUserGroup,
  HiOutlineChartBar,
  HiOutlineBookOpen,
} from "react-icons/hi";
import { getStudentSubjects } from "../../api/student.api";

const StudentSubjects = () => {
  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ["studentSubjects"],
    queryFn: () => getStudentSubjects(),
    select: (res) => res.data.data?.subjects || [],
  });

  const getAttendanceColor = (percentage) => {
    if (percentage >= 80) return "var(--status-present)";
    if (percentage >= 60) return "var(--status-warning)";
    return "var(--status-absent)";
  };

  const getAttendanceBg = (percentage) => {
    if (percentage >= 80) return "#D1FAE5";
    if (percentage >= 60) return "#FEF3C7";
    return "#FEE2E2";
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1
          className="text-xl font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          My Subjects
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          View your enrolled subjects and attendance
        </p>
      </div>

      {/* Subjects Grid */}
      {subjects?.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center shadow-sm"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <HiOutlineBookOpen
            className="w-16 h-16 mx-auto mb-4"
            style={{ color: "var(--text-muted)" }}
          />
          <h3
            className="text-lg font-medium mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            No Subjects Found
          </h3>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            You haven't been enrolled in any subjects yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects?.map((subject) => (
            <div
              key={subject.id}
              className="rounded-xl shadow-sm overflow-hidden"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border)",
              }}
            >
              {/* Card Header */}
              <div
                className="p-4"
                style={{ backgroundColor: "var(--primary)", color: "white" }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{subject.name}</h3>
                    <p className="text-sm opacity-90">{subject.code}</p>
                  </div>
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                  >
                    <HiOutlineAcademicCap className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-4">
                {/* Teacher Info */}
                <div className="flex items-center gap-3">
                  {subject.teacherPhoto ? (
                    <img
                      src={subject.teacherPhoto}
                      alt={subject.teacher}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
                      style={{
                        backgroundColor: "var(--primary-light)",
                        color: "var(--primary)",
                      }}
                    >
                      {subject.teacher?.charAt(0) || "T"}
                    </div>
                  )}
                  <div>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Teacher
                    </p>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {subject.teacher || "Not Assigned"}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: "var(--bg-main)" }}
                  >
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Classes
                    </p>
                    <p
                      className="text-lg font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {subject.totalClasses || 0}
                    </p>
                  </div>
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: "var(--bg-main)" }}
                  >
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Attended
                    </p>
                    <p
                      className="text-lg font-semibold"
                      style={{ color: "var(--status-present)" }}
                    >
                      {subject.classesAttended || 0}
                    </p>
                  </div>
                </div>

                {/* Attendance Progress */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Attendance
                    </span>
                    <span
                      className="text-sm font-semibold"
                      style={{
                        color:
                          subject.totalClasses === 0
                            ? "var(--text-muted)"
                            : getAttendanceColor(
                                subject.attendancePercentage || 0,
                              ),
                      }}
                    >
                      {subject.totalClasses === 0
                        ? "Pending"
                        : `${subject.attendancePercentage?.toFixed(1) || 0}%`}
                    </span>
                  </div>
                  {subject.totalClasses > 0 ? (
                    <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${subject.attendancePercentage || 0}%`,
                          backgroundColor: getAttendanceColor(
                            subject.attendancePercentage || 0,
                          ),
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      className="w-full h-2 rounded-full bg-gray-100"
                      style={{ backgroundColor: "#F1F5F9" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: "0%",
                          backgroundColor: "var(--text-muted)",
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Credit Hours */}
                <div
                  className="flex items-center justify-between pt-2 border-t"
                  style={{ borderColor: "var(--border)" }}
                >
                  <span
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Credit Hours
                  </span>
                  <span
                    className="px-2 py-1 rounded text-xs font-medium"
                    style={{
                      backgroundColor: "var(--primary-light)",
                      color: "var(--primary)",
                    }}
                  >
                    {subject.creditHours || 0} hrs
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Card */}
      {subjects?.length > 0 && (
        <div
          className="rounded-xl p-6 shadow-sm"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <HiOutlineChartBar
              className="w-5 h-5"
              style={{ color: "var(--primary)" }}
            />
            <h3
              className="font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              Overall Summary
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Total Subjects
              </p>
              <p
                className="text-2xl font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {subjects?.length || 0}
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Total Classes
              </p>
              <p
                className="text-2xl font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {subjects?.reduce((sum, s) => sum + (s.totalClasses || 0), 0)}
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Classes Attended
              </p>
              <p
                className="text-2xl font-semibold"
                style={{ color: "var(--status-present)" }}
              >
                {subjects?.reduce(
                  (sum, s) => sum + (s.classesAttended || 0),
                  0,
                )}
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Total Credit Hours
              </p>
              <p
                className="text-2xl font-semibold"
                style={{ color: "var(--primary)" }}
              >
                {subjects?.reduce((sum, s) => sum + (s.creditHours || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentSubjects;
