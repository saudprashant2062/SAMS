import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import {
  HiOutlineChartBar,
  HiOutlineCalendar,
  HiOutlineAcademicCap,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineExclamation,
} from "react-icons/hi";
import { getMyAttendanceSummary, getMySection } from "../../api/student.api";
import { selectUser } from "../../features/auth/auth.selector";
import { Link } from "react-router-dom";

import DashboardSkeleton from "../../components/common/DashboardSkeleton";

const StudentDashboard = () => {
  const user = useSelector(selectUser);

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["studentAttendanceSummary"],
    queryFn: () => getMyAttendanceSummary(),
    select: (res) => res.data.data,
  });

  const { data: section, isLoading: sectionLoading } = useQuery({
    queryKey: ["studentSection"],
    queryFn: () => getMySection(),
    select: (res) => res.data.data,
  });

  const isLoading = summaryLoading || sectionLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const overallAttendance = summary?.overall?.attendance_percentage || 0;
  const classesAttended = summary?.overall?.attended_sessions || 0;
  const classesMissed = summary?.overall?.absent_sessions || 0;
  const totalClasses = summary?.overall?.total_sessions || 0;

  const getAttendanceColor = (percentage) => {
    if (percentage >= 80) return "var(--status-present)";
    if (percentage >= 60) return "var(--status-warning)";
    return "var(--status-absent)";
  };

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div
        className="rounded-xl p-6 shadow-sm"
        style={{
          background:
            "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)",
          color: "white",
        }}
      >
        <h1 className="text-xl font-semibold">
          Welcome back, {user?.fullname || "Student"}! 👋
        </h1>
        <p className="text-sm mt-1 opacity-90">
          Here's your attendance overview for this semester.
        </p>
        <div className="mt-4 flex flex-wrap gap-6">
          <div>
            <p className="text-xs opacity-75">Overall Attendance</p>
            <p className="text-3xl font-bold mt-1">
              {overallAttendance.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs opacity-75">Section</p>
            <p className="text-lg font-semibold mt-1">
              {section?.section?.name || "—"}
            </p>
          </div>
          {section?.batch && (
            <div>
              <p className="text-xs opacity-75">Batch</p>
              <p className="text-lg font-semibold mt-1">
                {section.batch.name || "—"}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs opacity-75">Roll Number</p>
            <p className="text-lg font-semibold mt-1">
              {summary?.student?.roll_no || "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className="rounded-xl p-4 shadow-sm"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Classes Attended
              </p>
              <p
                className="text-2xl font-semibold mt-1"
                style={{ color: "var(--status-present)" }}
              >
                {classesAttended}
              </p>
            </div>
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: "#D1FAE5" }}
            >
              <HiOutlineCheckCircle
                className="w-5 h-5"
                style={{ color: "var(--status-present)" }}
              />
            </div>
          </div>
        </div>

        <div
          className="rounded-xl p-4 shadow-sm"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Classes Missed
              </p>
              <p
                className="text-2xl font-semibold mt-1"
                style={{ color: "var(--status-absent)" }}
              >
                {classesMissed}
              </p>
            </div>
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: "#FEE2E2" }}
            >
              <HiOutlineXCircle
                className="w-5 h-5"
                style={{ color: "var(--status-absent)" }}
              />
            </div>
          </div>
        </div>

        <div
          className="rounded-xl p-4 shadow-sm"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Total Classes
              </p>
              <p
                className="text-2xl font-semibold mt-1"
                style={{ color: "var(--text-primary)" }}
              >
                {totalClasses}
              </p>
            </div>
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: "var(--primary-light)" }}
            >
              <HiOutlineCalendar
                className="w-5 h-5"
                style={{ color: "var(--primary)" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Low Attendance Warning */}
      {overallAttendance < 80 && totalClasses > 0 && (
        <div
          className="rounded-xl p-4 flex items-start gap-3"
          style={{ backgroundColor: "#FEF3C7", border: "1px solid #F59E0B" }}
        >
          <HiOutlineExclamation
            className="w-5 h-5 mt-0.5"
            style={{ color: "#D97706" }}
          />
          <div>
            <p className="font-medium" style={{ color: "#92400E" }}>
              Low Attendance Warning
            </p>
            <p className="text-sm mt-1" style={{ color: "#B45309" }}>
              Your attendance is below 80%. You need to attend more classes to
              meet the minimum requirement.
            </p>
          </div>
        </div>
      )}

      {/* Subject-wise Attendance */}
      <div
        className="rounded-xl shadow-sm overflow-hidden"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2">
            <HiOutlineAcademicCap
              className="w-5 h-5"
              style={{ color: "var(--primary)" }}
            />
            <h3
              className="font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              Subject-wise Attendance
            </h3>
          </div>
        </div>
        <div className="p-4">
          {!summary?.subjects || summary.subjects.length === 0 ? (
            <p
              className="text-sm text-center py-4"
              style={{ color: "var(--text-muted)" }}
            >
              No subjects enrolled
            </p>
          ) : (
            <div className="space-y-4">
              {summary.subjects.map((subject, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <p
                        className="font-medium text-sm"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {subject.subject.name}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {subject.total_sessions === 0
                          ? "No classes held yet"
                          : `${subject.attended_sessions} / ${subject.total_sessions} classes`}
                      </p>
                    </div>
                    <span
                      className="text-sm font-semibold"
                      style={{
                        color:
                          subject.total_sessions === 0
                            ? "var(--text-muted)"
                            : getAttendanceColor(subject.attendance_percentage),
                      }}
                    >
                      {subject.total_sessions === 0
                        ? "Pending"
                        : `${subject.attendance_percentage.toFixed(1)}%`}
                    </span>
                  </div>
                  {subject.total_sessions > 0 && (
                    <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${subject.attendance_percentage}%`,
                          backgroundColor: getAttendanceColor(
                            subject.attendance_percentage,
                          ),
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/student/attendance"
          className="rounded-xl p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            className="p-3 rounded-lg"
            style={{ backgroundColor: "var(--primary-light)" }}
          >
            <HiOutlineChartBar
              className="w-6 h-6"
              style={{ color: "var(--primary)" }}
            />
          </div>
          <div>
            <p className="font-medium" style={{ color: "var(--text-primary)" }}>
              View Attendance Records
            </p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              See detailed attendance history
            </p>
          </div>
        </Link>

        <Link
          to="/student/subjects"
          className="rounded-xl p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            className="p-3 rounded-lg"
            style={{ backgroundColor: "#D1FAE5" }}
          >
            <HiOutlineAcademicCap
              className="w-6 h-6"
              style={{ color: "var(--status-present)" }}
            />
          </div>
          <div>
            <p className="font-medium" style={{ color: "var(--text-primary)" }}>
              My Subjects
            </p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              View enrolled subjects
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default StudentDashboard;
