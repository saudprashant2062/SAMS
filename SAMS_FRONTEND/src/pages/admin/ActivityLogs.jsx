import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  HiOutlineArrowLeft,
  HiOutlineFilter,
  HiOutlineRefresh,
  HiOutlineCalendar,
  HiOutlineUser,
} from "react-icons/hi";
import { getAllActivityLogs } from "../../api/admin.api";
import { getRelativeTime } from "../../utils/formatDate";

const ActivityLogs = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    entity_type: "",
    action: "",
    user_id: "",
    start_date: "",
    end_date: "",
  });
  const limit = 20;

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["activityLogs", page, filters],
    queryFn: () =>
      getAllActivityLogs({
        page,
        limit,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== ""),
        ),
      }),
    select: (res) => res.data.data,
    staleTime: 30000, // Cache for 30 seconds to prevent refetching
  });

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      entity_type: "",
      action: "",
      user_id: "",
      start_date: "",
      end_date: "",
    });
    setPage(1);
  };

  // Get action badge style
  const getActionBadgeStyle = (action) => {
    switch (action) {
      case "CREATE":
        return { bg: "#D1FAE5", color: "#065F46" };
      case "UPDATE":
        return { bg: "#FEF3C7", color: "#92400E" };
      case "DELETE":
        return { bg: "#FEE2E2", color: "#DC2626" };
      case "VIEW":
        return { bg: "#DBEAFE", color: "#1D4ED8" };
      case "LOGIN":
        return { bg: "#EDE9FE", color: "#5B21B6" };
      default:
        return { bg: "#F3F4F6", color: "#374151" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/dashboard"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            <HiOutlineArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1
              className="text-xl font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Activity Logs
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              View all system activity and user actions
            </p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-90"
          style={{
            backgroundColor: "var(--primary)",
            color: "white",
          }}
        >
          <HiOutlineRefresh
            className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
          />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div
        className="rounded-xl p-4 shadow-sm"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <HiOutlineFilter
            className="w-5 h-5"
            style={{ color: "var(--primary)" }}
          />
          <h2 className="font-medium" style={{ color: "var(--text-primary)" }}>
            Filters
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: "var(--text-muted)" }}
            >
              Entity Type
            </label>
            <select
              value={filters.entity_type}
              onChange={(e) =>
                handleFilterChange("entity_type", e.target.value)
              }
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--bg-main)",
                color: "var(--text-primary)",
              }}
            >
              <option value="">All Entities</option>
              <option value="User">User</option>
              <option value="Student">Student</option>
              <option value="Teacher">Teacher</option>
              <option value="Admin">Admin</option>
              <option value="Department">Department</option>
              <option value="Semester">Semester</option>
              <option value="Section">Section</option>
              <option value="Subject">Subject</option>
              <option value="Attendance">Attendance</option>
              <option value="TeachingAssignment">Teaching Assignment</option>
            </select>
          </div>
          <div>
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: "var(--text-muted)" }}
            >
              Action
            </label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange("action", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--bg-main)",
                color: "var(--text-primary)",
              }}
            >
              <option value="">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="VIEW">View</option>
              <option value="LOGIN">Login</option>
            </select>
          </div>
          <div>
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: "var(--text-muted)" }}
            >
              Start Date
            </label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange("start_date", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--bg-main)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <div>
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: "var(--text-muted)" }}
            >
              End Date
            </label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange("end_date", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--bg-main)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-90"
              style={{
                backgroundColor: "var(--bg-main)",
                color: "var(--primary)",
                border: "1px solid var(--border)",
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Activity Logs List */}
      <div
        className="rounded-xl shadow-sm overflow-hidden"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div
              className="animate-spin rounded-full h-8 w-8 border-b-2"
              style={{ borderColor: "var(--primary)" }}
            ></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p style={{ color: "var(--danger)" }}>
              Error loading activity logs
            </p>
            <button
              onClick={() => refetch()}
              className="mt-4 text-sm"
              style={{ color: "var(--primary)" }}
            >
              Try again
            </button>
          </div>
        ) : data?.activities?.length === 0 ? (
          <div className="text-center py-12">
            <p style={{ color: "var(--text-muted)" }}>No activity logs found</p>
          </div>
        ) : (
          <>
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {data?.activities?.map((activity) => {
                const badgeStyle = getActionBadgeStyle(activity.action);
                return (
                  <div
                    key={activity.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: badgeStyle.bg,
                              color: badgeStyle.color,
                            }}
                          >
                            {activity.action}
                          </span>
                          <span
                            className="text-xs"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {activity.entity_type}
                          </span>
                          {activity.user && (
                            <span
                              className="flex items-center gap-1 text-xs"
                              style={{ color: "var(--text-muted)" }}
                            >
                              <HiOutlineUser className="w-3 h-3" />
                              {activity.user.fullname}
                            </span>
                          )}
                          <span
                            className="text-xs"
                            style={{ color: "var(--text-muted)" }}
                          >
                            <HiOutlineCalendar className="w-3 h-3 inline mr-1" />
                            {getRelativeTime(activity.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {data?.pagination && data.pagination.pages > 1 && (
              <div
                className="p-4 border-t flex items-center justify-between"
                style={{ borderColor: "var(--border)" }}
              >
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Showing {(page - 1) * limit + 1} to{" "}
                  {Math.min(page * limit, data.pagination.total)} of{" "}
                  {data.pagination.total} logs
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || isFetching}
                    className="px-3 py-1 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    style={{
                      backgroundColor: "var(--bg-main)",
                      color: "var(--text-primary)",
                    }}
                  >
                    Previous
                  </button>
                  <span
                    className="text-sm px-2"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Page {page} of {data.pagination.pages}
                  </span>
                  <button
                    onClick={() =>
                      setPage((p) => Math.min(data.pagination.pages, p + 1))
                    }
                    disabled={page === data.pagination.pages || isFetching}
                    className="px-3 py-1 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    style={{
                      backgroundColor: "var(--bg-main)",
                      color: "var(--text-primary)",
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ActivityLogs;
