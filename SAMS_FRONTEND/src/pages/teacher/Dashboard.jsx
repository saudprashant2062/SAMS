import { useQuery } from "@tanstack/react-query";
import {
  HiOutlineClipboardList,
  HiOutlineUserGroup,
  HiOutlineCalendar,
  HiOutlineChartBar,
  HiOutlineClock,
  HiOutlineCheckCircle,
} from "react-icons/hi";
import { getTeacherDashboard } from "../../api/teacher.api";
import { Link } from "react-router-dom";
import { getRelativeTime } from "../../utils/formatDate";

const TeacherDashboard = () => {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["teacherDashboard"],
    queryFn: getTeacherDashboard,
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

  const stats = [
    {
      label: "Total Assignments",
      value: dashboard?.totalAssignments || 0,
      icon: HiOutlineClipboardList,
      color: "var(--primary)",
      bg: "var(--primary-light)",
    },
    {
      label: "Total Students",
      value: dashboard?.totalStudents || 0,
      icon: HiOutlineUserGroup,
      color: "var(--status-present)",
      bg: "#D1FAE5",
    },
    {
      label: "Classes Today",
      value: dashboard?.classesToday || 0,
      icon: HiOutlineCalendar,
      color: "var(--status-warning)",
      bg: "#FEF3C7",
    },
    {
      label: "Avg Attendance",
      value: `${dashboard?.avgAttendance?.toFixed(1) || 0}%`,
      icon: HiOutlineChartBar,
      color: "#8B5CF6",
      bg: "#EDE9FE",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1
          className="text-xl font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Welcome back! Here's your teaching overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="rounded-xl p-4 shadow-sm"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {stat.label}
                </p>
                <p
                  className="text-2xl font-semibold mt-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  {stat.value}
                </p>
              </div>
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: stat.bg }}
              >
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div
        className="rounded-xl p-6 shadow-sm"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        <h3
          className="font-medium mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/teacher/attendance"
            className="flex items-center gap-3 p-4 rounded-lg transition-colors hover:bg-gray-50"
            style={{ border: "1px solid var(--border)" }}
          >
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: "var(--primary-light)" }}
            >
              <HiOutlineCheckCircle
                className="w-5 h-5"
                style={{ color: "var(--primary)" }}
              />
            </div>
            <div>
              <p
                className="font-medium text-sm"
                style={{ color: "var(--text-primary)" }}
              >
                Mark Attendance
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Take attendance for your classes
              </p>
            </div>
          </Link>

          <Link
            to="/teacher/assignments"
            className="flex items-center gap-3 p-4 rounded-lg transition-colors hover:bg-gray-50"
            style={{ border: "1px solid var(--border)" }}
          >
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: "#D1FAE5" }}
            >
              <HiOutlineClipboardList
                className="w-5 h-5"
                style={{ color: "var(--status-present)" }}
              />
            </div>
            <div>
              <p
                className="font-medium text-sm"
                style={{ color: "var(--text-primary)" }}
              >
                View Assignments
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                See your teaching assignments
              </p>
            </div>
          </Link>

          <Link
            to="/teacher/attendance"
            className="flex items-center gap-3 p-4 rounded-lg transition-colors hover:bg-gray-50"
            style={{ border: "1px solid var(--border)" }}
          >
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: "#FEF3C7" }}
            >
              <HiOutlineChartBar
                className="w-5 h-5"
                style={{ color: "var(--status-warning)" }}
              />
            </div>
            <div>
              <p
                className="font-medium text-sm"
                style={{ color: "var(--text-primary)" }}
              >
                View History
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Check past attendance records
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Today's Schedule & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <div
          className="rounded-xl shadow-sm overflow-hidden"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            className="p-4 border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-2">
              <HiOutlineClock
                className="w-5 h-5"
                style={{ color: "var(--primary)" }}
              />
              <h3
                className="font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                Today's Schedule
              </h3>
            </div>
          </div>
          <div className="p-4">
            {dashboard?.todaySchedule?.length === 0 ? (
              <p
                className="text-sm text-center py-4"
                style={{ color: "var(--text-muted)" }}
              >
                No classes scheduled for today
              </p>
            ) : (
              <div className="space-y-3">
                {dashboard?.todaySchedule?.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ backgroundColor: "var(--bg-main)" }}
                  >
                    <div>
                      <p
                        className="font-medium text-sm"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {item.subject}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {item.section} • {item.time}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium`}
                      style={{
                        backgroundColor: item.completed
                          ? "#D1FAE5"
                          : "var(--primary-light)",
                        color: item.completed
                          ? "var(--status-present)"
                          : "var(--primary)",
                      }}
                    >
                      {item.completed ? "Completed" : "Pending"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div
          className="rounded-xl shadow-sm overflow-hidden"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            className="p-4 border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-2">
              <HiOutlineCalendar
                className="w-5 h-5"
                style={{ color: "var(--primary)" }}
              />
              <h3
                className="font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                Recent Activity
              </h3>
            </div>
          </div>
          <div className="p-4">
            {dashboard?.recentActivity?.length === 0 ? (
              <p
                className="text-sm text-center py-4"
                style={{ color: "var(--text-muted)" }}
              >
                No recent activity
              </p>
            ) : (
              <div className="space-y-3">
                {dashboard?.recentActivity?.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg"
                    style={{ backgroundColor: "var(--bg-main)" }}
                  >
                    <div
                      className="p-1.5 rounded-full mt-0.5"
                      style={{ backgroundColor: "var(--primary-light)" }}
                    >
                      <HiOutlineCheckCircle
                        className="w-3 h-3"
                        style={{ color: "var(--primary)" }}
                      />
                    </div>
                    <div>
                      <p
                        className="text-sm"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {activity.description}
                      </p>
                      <p
                        className="text-xs mt-1"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {activity.created_at
                          ? getRelativeTime(activity.created_at)
                          : activity.time || "Unknown time"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
