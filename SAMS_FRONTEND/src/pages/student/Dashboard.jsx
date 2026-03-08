import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import {
  HiOutlineChartBar,
  HiOutlineCalendar,
  HiOutlineAcademicCap,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineExclamation,
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineBookOpen,
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
  const subjects = summary?.subjects || [];
  const totalSubjects = subjects.length;

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

  // Derived stats
  const subjectsWithClasses = subjects.filter((s) => s.total_sessions > 0);
  const bestSubject = subjectsWithClasses.length
    ? subjectsWithClasses.reduce((best, s) =>
        s.attendance_percentage > best.attendance_percentage ? s : best,
      )
    : null;
  const worstSubject = subjectsWithClasses.length
    ? subjectsWithClasses.reduce((worst, s) =>
        s.attendance_percentage < worst.attendance_percentage ? s : worst,
      )
    : null;
  const lowAttendanceSubjects = subjectsWithClasses.filter(
    (s) => s.attendance_percentage < 80,
  );

  // Calculate classes needed to reach 80% overall
  const classesNeededFor80 =
    overallAttendance < 80 && totalClasses > 0
      ? Math.ceil((0.8 * totalClasses - classesAttended) / (1 - 0.8))
      : 0;

  // SVG circle gauge parameters
  const gaugeRadius = 52;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const gaugeOffset =
    gaugeCircumference - (overallAttendance / 100) * gaugeCircumference;

  return (
    <div className="space-y-6">
      {/* Welcome Card with Attendance Gauge */}
      <div
        className="rounded-xl p-6 shadow-sm"
        style={{
          background:
            "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)",
          color: "white",
        }}
      >
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <h1 className="text-xl font-semibold">
              Welcome back, {user?.fullname || "Student"}! 👋
            </h1>
            <p className="text-sm mt-1 opacity-90">
              Here's your attendance overview for this semester.
            </p>
            <div className="mt-4 flex flex-wrap gap-6">
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
                    {section.batch.name || `${section.batch.start_year}`}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs opacity-75">Roll Number</p>
                <p className="text-lg font-semibold mt-1">
                  {summary?.student?.roll_no || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs opacity-75">Student ID</p>
                <p className="text-lg font-semibold mt-1">
                  {summary?.student?.stdId || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Circular Attendance Gauge */}
          <div className="shrink-0">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r={gaugeRadius}
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="10"
                />
                <circle
                  cx="60"
                  cy="60"
                  r={gaugeRadius}
                  fill="none"
                  stroke="white"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={gaugeCircumference}
                  strokeDashoffset={gaugeOffset}
                  style={{ transition: "stroke-dashoffset 0.8s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">
                  {overallAttendance.toFixed(0)}%
                </span>
                <span className="text-[10px] opacity-75">Attendance</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                Attended
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
                Missed
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
                Subjects
              </p>
              <p
                className="text-2xl font-semibold mt-1"
                style={{ color: "var(--primary)" }}
              >
                {totalSubjects}
              </p>
            </div>
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: "var(--primary-light)" }}
            >
              <HiOutlineBookOpen
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
            className="w-5 h-5 mt-0.5 shrink-0"
            style={{ color: "#D97706" }}
          />
          <div>
            <p className="font-medium" style={{ color: "#92400E" }}>
              Low Attendance Warning
            </p>
            <p className="text-sm mt-1" style={{ color: "#B45309" }}>
              Your attendance is below 80%.
              {classesNeededFor80 > 0 && (
                <>
                  {" "}
                  You need to attend the next{" "}
                  <strong>{classesNeededFor80} consecutive classes</strong> to
                  reach 80%.
                </>
              )}
            </p>
            {lowAttendanceSubjects.length > 0 && (
              <p className="text-xs mt-2" style={{ color: "#B45309" }}>
                Subjects below 80%:{" "}
                {lowAttendanceSubjects
                  .map(
                    (s) =>
                      `${s.subject.name} (${s.attendance_percentage.toFixed(0)}%)`,
                  )
                  .join(", ")}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Best & Worst Subject Highlights */}
      {bestSubject && worstSubject && subjectsWithClasses.length >= 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className="rounded-xl p-4 shadow-sm"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <HiOutlineTrendingUp
                className="w-4 h-4"
                style={{ color: "var(--status-present)" }}
              />
              <p
                className="text-xs font-medium"
                style={{ color: "var(--text-muted)" }}
              >
                Best Performing Subject
              </p>
            </div>
            <p
              className="font-semibold text-sm"
              style={{ color: "var(--text-primary)" }}
            >
              {bestSubject.subject.name}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-lg font-bold"
                style={{ color: "var(--status-present)" }}
              >
                {bestSubject.attendance_percentage.toFixed(1)}%
              </span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                ({bestSubject.attended_sessions}/{bestSubject.total_sessions}{" "}
                classes)
              </span>
            </div>
          </div>

          <div
            className="rounded-xl p-4 shadow-sm"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <HiOutlineTrendingDown
                className="w-4 h-4"
                style={{
                  color: getAttendanceColor(worstSubject.attendance_percentage),
                }}
              />
              <p
                className="text-xs font-medium"
                style={{ color: "var(--text-muted)" }}
              >
                Needs Improvement
              </p>
            </div>
            <p
              className="font-semibold text-sm"
              style={{ color: "var(--text-primary)" }}
            >
              {worstSubject.subject.name}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-lg font-bold"
                style={{
                  color: getAttendanceColor(worstSubject.attendance_percentage),
                }}
              >
                {worstSubject.attendance_percentage.toFixed(1)}%
              </span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                ({worstSubject.attended_sessions}/{worstSubject.total_sessions}{" "}
                classes)
              </span>
            </div>
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
          {subjects.length === 0 ? (
            <p
              className="text-sm text-center py-4"
              style={{ color: "var(--text-muted)" }}
            >
              No subjects enrolled
            </p>
          ) : (
            <div className="space-y-4">
              {subjects.map((subject, index) => {
                const pct = subject.attendance_percentage;
                return (
                  <div key={index}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
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
                          {subject.subject.code}
                          {subject.subject.credit_hours
                            ? ` • ${subject.subject.credit_hours} Cr`
                            : ""}
                          {subject.teacher?.name
                            ? ` • ${subject.teacher.name}`
                            : ""}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <span
                          className="text-sm font-bold"
                          style={{
                            color:
                              subject.total_sessions === 0
                                ? "var(--text-muted)"
                                : getAttendanceColor(pct),
                          }}
                        >
                          {subject.total_sessions === 0
                            ? "—"
                            : `${pct.toFixed(1)}%`}
                        </span>
                        <p
                          className="text-[10px]"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {subject.total_sessions === 0
                            ? "No classes"
                            : `${subject.attended_sessions}/${subject.total_sessions}`}
                        </p>
                      </div>
                    </div>
                    {subject.total_sessions > 0 && (
                      <div
                        className="w-full h-2 rounded-full overflow-hidden"
                        style={{ backgroundColor: "var(--bg-main)" }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: getAttendanceColor(pct),
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
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
              View enrolled subjects & teachers
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default StudentDashboard;
