import { useQuery } from "@tanstack/react-query";
import {
  HiOutlineAcademicCap,
  HiOutlineUserGroup,
  HiOutlineCalendar,
  HiOutlineChartBar,
} from "react-icons/hi";
import { getTeacherAssignments } from "../../api/teacher.api";
import { Link } from "react-router-dom";

const TeacherAssignments = () => {
  const { data: assignments, isLoading } = useQuery({
    queryKey: ["teacherAssignments"],
    queryFn: getTeacherAssignments,
    select: (res) => res.data.data,
  });

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
          My Assignments
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Your teaching assignments and sections
        </p>
      </div>

      {/* Assignments Grid */}
      {assignments?.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center shadow-sm"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <HiOutlineAcademicCap
            className="w-16 h-16 mx-auto mb-4"
            style={{ color: "var(--text-muted)" }}
          />
          <h3
            className="text-lg font-medium mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            No Assignments Yet
          </h3>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            You haven't been assigned to any sections yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignments?.map((assignment) => (
            <div
              key={assignment.id}
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
                <h3 className="font-semibold">{assignment.subject?.name}</h3>
                <p className="text-sm opacity-90">{assignment.subject?.code}</p>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <HiOutlineAcademicCap
                    className="w-4 h-4"
                    style={{ color: "var(--text-muted)" }}
                  />
                  <span
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Section:{" "}
                    <span
                      className="font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {assignment.section?.name}
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <HiOutlineUserGroup
                    className="w-4 h-4"
                    style={{ color: "var(--text-muted)" }}
                  />
                  <span
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Students:{" "}
                    <span
                      className="font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {assignment.studentCount || 0}
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <HiOutlineCalendar
                    className="w-4 h-4"
                    style={{ color: "var(--text-muted)" }}
                  />
                  <span
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Semester:{" "}
                    <span
                      className="font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {assignment.section?.semester?.number
                        ? `Semester ${assignment.section.semester.number}`
                        : "—"}
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <HiOutlineChartBar
                    className="w-4 h-4"
                    style={{ color: "var(--text-muted)" }}
                  />
                  <span
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Avg Attendance:{" "}
                    <span
                      className="font-medium"
                      style={{
                        color:
                          (assignment.avgAttendance || 0) >= 80
                            ? "var(--status-present)"
                            : (assignment.avgAttendance || 0) >= 60
                              ? "var(--status-warning)"
                              : "var(--status-absent)",
                      }}
                    >
                      {assignment.avgAttendance?.toFixed(1) || 0}%
                    </span>
                  </span>
                </div>
              </div>

              {/* Card Footer */}
              <div
                className="px-4 py-3 border-t flex justify-between items-center"
                style={{ borderColor: "var(--border)" }}
              >
                <span
                  className="px-2 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: assignment.isActive
                      ? "#D1FAE5"
                      : "#FEE2E2",
                    color: assignment.isActive
                      ? "var(--status-present)"
                      : "var(--status-absent)",
                  }}
                >
                  {assignment.isActive ? "Active" : "Inactive"}
                </span>
                <Link
                  to={`/teacher/attendance?assignmentId=${assignment.id}`}
                  className="text-sm font-medium transition-colors hover:underline"
                  style={{ color: "var(--primary)" }}
                >
                  Take Attendance →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherAssignments;
