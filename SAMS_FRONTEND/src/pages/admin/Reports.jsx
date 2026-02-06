import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  HiOutlineDocumentReport,
  HiOutlineDownload,
  HiOutlineCalendar,
  HiOutlineFilter,
  HiOutlineChartBar,
} from "react-icons/hi";
import CascadingFilters from "../../components/common/CascadingFilters";
import TableSkeleton from "../../components/common/TableSkeleton";
import {
  getAttendanceReport,
  exportAttendanceReport,
  exportDepartmentAttendanceReport,
  getAllSections,
  getAllSubjects,
  getAllSemesters,
  getAllDepartments,
  getAllBatches,
} from "../../api/admin.api";

const AdminReports = () => {
  const [filters, setFilters] = useState({
    department_id: "",
    batch_id: "",
    semester_id: "",
    section_id: "",
    subject_id: "",
    startDate: "",
    endDate: "",
  });

  // Transform camelCase filters to snake_case for API
  const transformFiltersForApi = (filters) => ({
    department_id: filters.department_id || undefined,
    batch_id: filters.batch_id || undefined,
    section_id: filters.section_id || undefined,
    subject_id: filters.subject_id || undefined,
    semester_id: filters.semester_id || undefined,
    start_date: filters.startDate || undefined,
    end_date: filters.endDate || undefined,
  });

  const {
    data: report,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["attendanceReport", filters],
    queryFn: () => getAttendanceReport(transformFiltersForApi(filters)),
    select: (res) => res.data.data,
    enabled: false,
  });

  const { data: sections } = useQuery({
    queryKey: ["sections"],
    queryFn: () => getAllSections({ limit: 1000 }), // Get all for dropdowns
    select: (res) => res.data?.data?.sections || res.data?.data || [],
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => getAllSubjects(),
    select: (res) => res.data.data,
  });

  const { data: semesters } = useQuery({
    queryKey: ["semesters"],
    queryFn: () => getAllSemesters(),
    select: (res) => res.data.data,
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: () => getAllDepartments(),
    select: (res) => res.data.data,
  });

  const { data: batches } = useQuery({
    queryKey: ["batches"],
    queryFn: () => getAllBatches(),
    select: (res) => res.data.data,
  });

  // Filter sections based on selected department and semester
  const filteredSections = useMemo(() => {
    if (!sections) return [];
    return sections.filter((section) => {
      if (
        filters.department_id &&
        section.department_id !== filters.department_id
      )
        return false;
      if (filters.batch_id && section.batch_id !== filters.batch_id)
        return false;
      if (filters.semester_id && section.semester_id !== filters.semester_id)
        return false;
      return true;
    });
  }, [sections, filters.department_id, filters.batch_id, filters.semester_id]);

  // Filter subjects based on selected filters
  const filteredSubjects = useMemo(() => {
    if (!subjects) return [];
    return subjects.filter((subject) => {
      if (
        filters.department_id &&
        subject.department_id !== filters.department_id
      )
        return false;
      if (filters.semester_id && subject.semester_id !== filters.semester_id)
        return false;
      return true;
    });
  }, [subjects, filters.department_id, filters.semester_id]);

  const exportMutation = useMutation({
    mutationFn: (type) =>
      type === "department"
        ? exportDepartmentAttendanceReport(transformFiltersForApi(filters))
        : exportAttendanceReport(transformFiltersForApi(filters)),
    onSuccess: (response, type) => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const filename =
        type === "department"
          ? `department_attendance_report_${Date.now()}.csv`
          : `attendance_report_${Date.now()}.csv`;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    },
    onError: (error) => {
      alert(error.response?.data?.message || "Failed to export report");
    },
  });

  const handleGenerateReport = () => {
    refetch();
  };

  const handleExport = (type) => {
    exportMutation.mutate(type);
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 80) return "var(--status-present)";
    if (percentage >= 60) return "var(--status-warning)";
    return "var(--status-absent)";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1
            className="text-xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Attendance Reports
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Generate and export attendance reports
          </p>
        </div>
        {report && (
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleExport("simple")}
              disabled={exportMutation.isPending}
              className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-white text-xs md:text-sm font-medium transition-colors flex-1 sm:flex-initial justify-center"
              style={{ backgroundColor: "var(--status-present)" }}
            >
              <HiOutlineDownload className="w-4 h-4" />
              <span>
                {exportMutation.isPending &&
                exportMutation.variables === "simple"
                  ? "Exporting..."
                  : "Export CSV"}
              </span>
            </button>
            <button
              onClick={() => handleExport("department")}
              disabled={exportMutation.isPending}
              className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-white text-xs md:text-sm font-medium transition-colors flex-1 sm:flex-initial justify-center"
              style={{ backgroundColor: "var(--primary)" }}
            >
              <HiOutlineDownload className="w-4 h-4" />
              <span>
                {exportMutation.isPending &&
                exportMutation.variables === "department"
                  ? "Exporting..."
                  : "Export Detailed CSV"}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div
        className="rounded-xl p-6 shadow-sm space-y-4"
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
            Report Filters
          </h3>
        </div>

        {/* Cascading Filters */}
        <CascadingFilters
          value={filters}
          onChange={(newFilters) =>
            setFilters({
              ...filters,
              ...newFilters,
              subject_id:
                newFilters.semester_id !== filters.semester_id
                  ? ""
                  : filters.subject_id,
            })
          }
          departments={departments || []}
          batches={batches || []}
          semesters={semesters || []}
          sections={sections || []}
          showSection={true}
          showLabels={true}
          required={{
            department: false,
            batch: false,
            semester: false,
            section: false,
          }}
          placeholders={{
            department: "All Departments",
            batch: "All Batches",
            semester: "All Semesters",
            section: "All Sections",
          }}
        />

        {/* Additional Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: "var(--text-muted)" }}
            >
              Subject
            </label>
            <select
              value={filters.subject_id}
              onChange={(e) =>
                setFilters({ ...filters, subject_id: e.target.value })
              }
              className="w-full px-2 py-1.5 md:px-3 md:py-2 rounded-lg text-xs md:text-sm outline-none"
              style={{
                backgroundColor: "var(--bg-main)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            >
              <option value="">All Subjects</option>
              {filteredSubjects?.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: "var(--text-muted)" }}
            >
              Start Date
            </label>
            <div className="relative">
              <HiOutlineCalendar
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
                className="w-full pl-9 pr-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm outline-none"
                style={{
                  backgroundColor: "var(--bg-main)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          </div>

          <div>
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: "var(--text-muted)" }}
            >
              End Date
            </label>
            <div className="relative">
              <HiOutlineCalendar
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
                className="w-full pl-9 pr-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm outline-none"
                style={{
                  backgroundColor: "var(--bg-main)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerateReport}
              disabled={isLoading}
              className="w-full px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-white text-xs md:text-sm font-medium transition-colors"
              style={{ backgroundColor: "var(--primary)" }}
            >
              {isLoading ? "Generating..." : "Generate Report"}
            </button>
          </div>
        </div>
      </div>

      {/* Report Results */}
      {isLoading ? (
        <TableSkeleton rows={10} columns={8} />
      ) : report ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    Total Students
                  </p>
                  <p
                    className="text-2xl font-semibold mt-1"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {report.summary?.totalStudents || 0}
                  </p>
                </div>
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: "var(--primary-light)" }}
                >
                  <HiOutlineChartBar
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
                    Total Classes
                  </p>
                  <p
                    className="text-2xl font-semibold mt-1"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {report.summary?.totalClasses || 0}
                  </p>
                </div>
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: "var(--primary-light)" }}
                >
                  <HiOutlineDocumentReport
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
                    Avg. Attendance
                  </p>
                  <p
                    className="text-2xl font-semibold mt-1"
                    style={{
                      color: getAttendanceColor(
                        report.summary?.avgAttendance || 0,
                      ),
                    }}
                  >
                    {report.summary?.avgAttendance?.toFixed(1) || 0}%
                  </p>
                </div>
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: "#D1FAE5" }}
                >
                  <HiOutlineChartBar
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
                    Low Attendance
                  </p>
                  <p
                    className="text-2xl font-semibold mt-1"
                    style={{ color: "var(--status-absent)" }}
                  >
                    {report.summary?.lowAttendanceCount || 0}
                  </p>
                </div>
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: "#FEE2E2" }}
                >
                  <HiOutlineChartBar
                    className="w-5 h-5"
                    style={{ color: "var(--status-absent)" }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Student Report Table */}
          <div
            className="rounded-xl shadow-sm overflow-hidden"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="table-responsive">
              <table className="w-full">
                <thead style={{ backgroundColor: "var(--primary-subtle)" }}>
                  <tr>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium"
                      style={{ color: "var(--primary)" }}
                    >
                      Student
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium"
                      style={{ color: "var(--primary)" }}
                    >
                      Roll No
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium"
                      style={{ color: "var(--primary)" }}
                    >
                      Department
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium"
                      style={{ color: "var(--primary)" }}
                    >
                      Section
                    </th>
                    <th
                      className="px-4 py-3 text-center text-xs font-medium"
                      style={{ color: "var(--primary)" }}
                    >
                      Present
                    </th>
                    <th
                      className="px-4 py-3 text-center text-xs font-medium"
                      style={{ color: "var(--primary)" }}
                    >
                      Absent
                    </th>
                    <th
                      className="px-4 py-3 text-center text-xs font-medium"
                      style={{ color: "var(--primary)" }}
                    >
                      Total
                    </th>
                    <th
                      className="px-4 py-3 text-center text-xs font-medium"
                      style={{ color: "var(--primary)" }}
                    >
                      Attendance %
                    </th>
                  </tr>
                </thead>
                <tbody
                  className="divide-y"
                  style={{ borderColor: "var(--border)" }}
                >
                  {report.students?.length === 0 ? (
                    <tr>
                      <td
                        colSpan="8"
                        className="px-4 py-8 text-center text-sm"
                        style={{ color: "var(--text-muted)" }}
                      >
                        No data available
                      </td>
                    </tr>
                  ) : (
                    report.students?.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td
                          className="px-4 py-3 text-sm font-medium"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {student.name}
                        </td>
                        <td
                          className="px-4 py-3 text-sm"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {student.roll_no}
                        </td>
                        <td
                          className="px-4 py-3 text-sm"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {student.department}
                        </td>
                        <td
                          className="px-4 py-3 text-sm"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {student.section}
                        </td>
                        <td
                          className="px-4 py-3 text-sm text-center"
                          style={{ color: "var(--status-present)" }}
                        >
                          {student.present}
                        </td>
                        <td
                          className="px-4 py-3 text-sm text-center"
                          style={{ color: "var(--status-absent)" }}
                        >
                          {student.absent}
                        </td>
                        <td
                          className="px-4 py-3 text-sm text-center"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {student.totalClasses}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-24 h-2 rounded-full bg-gray-200 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${student.attendancePercentage}%`,
                                  backgroundColor: getAttendanceColor(
                                    student.attendancePercentage,
                                  ),
                                }}
                              />
                            </div>
                            <span
                              className="text-sm font-medium"
                              style={{
                                color: getAttendanceColor(
                                  student.attendancePercentage,
                                ),
                              }}
                            >
                              {student.attendancePercentage?.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

      {/* Empty State */}
      {!report && !isLoading && (
        <div
          className="rounded-xl p-12 text-center shadow-sm"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <HiOutlineDocumentReport
            className="w-16 h-16 mx-auto mb-4"
            style={{ color: "var(--text-muted)" }}
          />
          <h3
            className="text-lg font-medium mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            No Report Generated
          </h3>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Use the filters above and click "Generate Report" to view attendance
            data
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
