import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  HiOutlineCalendar,
  HiOutlineFilter,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
} from "react-icons/hi";
import { getStudentAttendance } from "../../api/student.api";

const StudentAttendance = () => {
  const [filters, setFilters] = useState({
    subjectId: "",
    month: "",
    status: "",
  });

  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ["studentAttendance", filters],
    queryFn: () => getStudentAttendance(filters),
    select: (res) => ({
      records: res.data.data,
      summary: res.data.summary,
      subjects: res.data.subjects,
      pagination: res.data.pagination,
    }),
  });

  const getStatusBadge = (status) => {
    const styles = {
      PRESENT: {
        bg: "#D1FAE5",
        color: "var(--status-present)",
        icon: HiOutlineCheckCircle,
      },
      ABSENT: {
        bg: "#FEE2E2",
        color: "var(--status-absent)",
        icon: HiOutlineXCircle,
      },
      LATE: {
        bg: "#FEF3C7",
        color: "var(--status-late)",
        icon: HiOutlineClock,
      },
      EXCUSED: {
        bg: "#DBEAFE",
        color: "var(--status-excused)",
        icon: HiOutlineCheckCircle,
      },
    };
    return styles[status] || styles.ABSENT;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1
          className="text-xl font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          My Attendance
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          View your attendance records
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div
          className="rounded-xl p-4 shadow-sm"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Total Classes
          </p>
          <p
            className="text-2xl font-semibold mt-1"
            style={{ color: "var(--text-primary)" }}
          >
            {attendanceData?.summary?.total || 0}
          </p>
        </div>
        <div
          className="rounded-xl p-4 shadow-sm"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Present
          </p>
          <p
            className="text-2xl font-semibold mt-1"
            style={{ color: "var(--status-present)" }}
          >
            {attendanceData?.summary?.present || 0}
          </p>
        </div>
        <div
          className="rounded-xl p-4 shadow-sm"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Absent
          </p>
          <p
            className="text-2xl font-semibold mt-1"
            style={{ color: "var(--status-absent)" }}
          >
            {attendanceData?.summary?.absent || 0}
          </p>
        </div>
        <div
          className="rounded-xl p-4 shadow-sm"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Attendance %
          </p>
          <p
            className="text-2xl font-semibold mt-1"
            style={{
              color:
                (attendanceData?.summary?.percentage || 0) >= 80
                  ? "var(--status-present)"
                  : (attendanceData?.summary?.percentage || 0) >= 60
                    ? "var(--status-warning)"
                    : "var(--status-absent)",
            }}
          >
            {attendanceData?.summary?.percentage?.toFixed(1) || 0}%
          </p>
        </div>
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
          <h3 className="font-medium" style={{ color: "var(--text-primary)" }}>
            Filters
          </h3>
        </div>
        <div className="flex flex-wrap gap-4">
          <select
            value={filters.subjectId}
            onChange={(e) =>
              setFilters({ ...filters, subjectId: e.target.value })
            }
            className="px-2 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm outline-none min-w-[150px] md:min-w-[180px]"
            style={{
              backgroundColor: "var(--bg-main)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          >
            <option value="">All Subjects</option>
            {attendanceData?.subjects?.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>

          <select
            value={filters.month}
            onChange={(e) => setFilters({ ...filters, month: e.target.value })}
            className="px-4 py-2 rounded-lg text-sm outline-none min-w-[150px]"
            style={{
              backgroundColor: "var(--bg-main)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          >
            <option value="">All Months</option>
            {months.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 rounded-lg text-sm outline-none min-w-[150px]"
            style={{
              backgroundColor: "var(--bg-main)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          >
            <option value="">All Status</option>
            <option value="PRESENT">Present</option>
            <option value="ABSENT">Absent</option>
          </select>
        </div>
      </div>

      {/* Attendance Records */}
      <div
        className="rounded-xl shadow-sm overflow-hidden"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        <table className="w-full">
          <thead style={{ backgroundColor: "var(--primary-subtle)" }}>
            <tr>
              <th
                className="px-4 py-3 text-left text-xs font-medium"
                style={{ color: "var(--primary)" }}
              >
                Date
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium"
                style={{ color: "var(--primary)" }}
              >
                Subject
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium"
                style={{ color: "var(--primary)" }}
              >
                Teacher
              </th>
              <th
                className="px-4 py-3 text-center text-xs font-medium"
                style={{ color: "var(--primary)" }}
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
            {isLoading ? (
              <tr>
                <td colSpan="4" className="px-4 py-8 text-center">
                  <div
                    className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto"
                    style={{ borderColor: "var(--primary)" }}
                  ></div>
                </td>
              </tr>
            ) : attendanceData?.records?.length === 0 ? (
              <tr>
                <td
                  colSpan="4"
                  className="px-4 py-8 text-center text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  No attendance records found
                </td>
              </tr>
            ) : (
              attendanceData?.records?.map((record) => {
                const badge = getStatusBadge(record.status);
                const StatusIcon = badge.icon;
                return (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <HiOutlineCalendar
                          className="w-4 h-4"
                          style={{ color: "var(--text-muted)" }}
                        />
                        <span
                          className="text-sm"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {formatDate(record.date)}
                        </span>
                      </div>
                    </td>
                    <td
                      className="px-4 py-3 text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {record.subject}
                    </td>
                    <td
                      className="px-4 py-3 text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {record.teacher}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: badge.bg,
                          color: badge.color,
                        }}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        {record.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Calendar View Hint */}
      <div
        className="rounded-xl p-4 text-center"
        style={{
          backgroundColor: "var(--primary-subtle)",
          border: "1px solid var(--primary-light)",
        }}
      >
        <p className="text-sm" style={{ color: "var(--primary)" }}>
          💡 Tip: Filter by subject or month to see specific attendance records
        </p>
      </div>
    </div>
  );
};

export default StudentAttendance;
