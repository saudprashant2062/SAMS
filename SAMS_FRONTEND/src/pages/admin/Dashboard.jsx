import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  HiOutlineUsers,
  HiOutlineAcademicCap,
  HiOutlineOfficeBuilding,
  HiOutlineClipboardCheck,
  HiOutlineClock,
  HiOutlineCheckCircle,
} from "react-icons/hi";
import { getDashboardStats, getRecentActivityLogs } from "../../api/admin.api";
import { getRelativeTime } from "../../utils/formatDate";
import DashboardSkeleton from "../../components/common/DashboardSkeleton";

const AdminDashboard = () => {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["adminDashboardStats"],
    queryFn: () => getDashboardStats(),
    select: (res) => res.data.data,
    staleTime: 60000, // Cache for 1 minute to prevent refetching
  });

  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ["recentActivityLogs"],
    queryFn: () => getRecentActivityLogs({ limit: 20 }),
    select: (res) => {
      const activities = res.data.data?.activities || [];
      // Filter to only show activities from the last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return activities.filter(a => new Date(a.created_at) > oneDayAgo);
    },
    staleTime: 30000, // Cache for 30 seconds
  });

  if (statsLoading) {
    return <DashboardSkeleton />;
  }

  const statCards = [
    {
      title: "Total Students",
      value: stats?.totalStudents || 0,
      icon: HiOutlineAcademicCap,
      color: "var(--primary)",
    },
    {
      title: "Total Teachers",
      value: stats?.totalTeachers || 0,
      icon: HiOutlineUsers,
      color: "#16A34A",
    },
    {
      title: "Departments",
      value: stats?.totalDepartments || 0,
      icon: HiOutlineOfficeBuilding,
      color: "#D97706",
    },
    {
      title: "Today's Sessions",
      value: stats?.todaySessions || 0,
      icon: HiOutlineClipboardCheck,
      color: "#7C3AED",
    },
  ];

  // Get action icon and color
  const getActionStyle = (action) => {
    switch (action) {
      case "CREATE":
        return { icon: HiOutlineCheckCircle, color: "#16A34A", bg: "#D1FAE5" };
      case "UPDATE":
        return {
          icon: HiOutlineClipboardCheck,
          color: "#D97706",
          bg: "#FEF3C7",
        };
      case "DELETE":
        return { icon: HiOutlineUsers, color: "#DC2626", bg: "#FEE2E2" };
      case "LOGIN":
        return { icon: HiOutlineClock, color: "#7C3AED", bg: "#EDE9FE" };
      default:
        return {
          icon: HiOutlineCheckCircle,
          color: "var(--primary)",
          bg: "var(--primary-light)",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1
          className="text-xl font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Overview of your attendance management system
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="rounded-xl p-5 shadow-sm"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {stat.title}
                  </p>
                  <p
                    className="text-2xl font-semibold mt-1"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {statsLoading ? "—" : stat.value}
                  </p>
                </div>
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <Icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div
        className="rounded-xl p-6 shadow-sm"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        <h2
          className="text-base font-medium mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin/users"
            className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: "var(--primary)" }}
          >
            Manage Users
          </Link>
          <Link
            to="/admin/attendance"
            className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors hover:bg-gray-100"
            style={{
              backgroundColor: "var(--bg-main)",
              color: "var(--primary)",
              border: "1px solid var(--border)",
            }}
          >
            View Attendance
          </Link>
          <Link
            to="/admin/teaching-assignments"
            className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors hover:bg-gray-100"
            style={{
              backgroundColor: "var(--bg-main)",
              color: "var(--primary)",
              border: "1px solid var(--border)",
            }}
          >
            Assignments
          </Link>
          <Link
            to="/admin/reports"
            className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors hover:bg-gray-100"
            style={{
              backgroundColor: "var(--bg-main)",
              color: "var(--primary)",
              border: "1px solid var(--border)",
            }}
          >
            Reports
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div
        className="rounded-xl p-6 shadow-sm"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-base font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            Recent Activity
          </h2>
          <Link
            to="/admin/activity-logs"
            className="text-sm hover:underline"
            style={{ color: "var(--primary)" }}
          >
            View all
          </Link>
        </div>

        {activityLoading ? (
          <div className="flex items-center justify-center py-8">
            <div
              className="animate-spin rounded-full h-6 w-6 border-b-2"
              style={{ borderColor: "var(--primary)" }}
            ></div>
          </div>
        ) : activityData?.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No recent activity to display.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activityData?.map((activity) => {
              const actionStyle = getActionStyle(activity.action);
              const ActionIcon = actionStyle.icon;

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg"
                  style={{ backgroundColor: "var(--bg-main)" }}
                >
                  <div
                    className="p-1.5 rounded-full mt-0.5 shrink-0"
                    style={{ backgroundColor: actionStyle.bg }}
                  >
                    <ActionIcon
                      className="w-3 h-3"
                      style={{ color: actionStyle.color }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: actionStyle.bg,
                          color: actionStyle.color,
                        }}
                      >
                        {activity.action}
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        by {activity.user?.fullname || "System"}
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        • {getRelativeTime(activity.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
