import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  HiOutlineArrowLeft,
  HiOutlineOfficeBuilding,
  HiOutlineCalendar,
  HiOutlineUserGroup,
  HiOutlineAcademicCap,
  HiOutlineDownload,
} from "react-icons/hi";
import { getDepartmentById } from "../../api/admin.api";
import { safeFormatDate } from "../../utils/formatDate";

const DepartmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    data: department,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["department", id],
    queryFn: () => getDepartmentById(id),
    select: (res) => res.data.data,
  });

  const exportToCSV = () => {
    if (!department) return;

    const headers = [
      "ID",
      "Name",
      "Code",
      "Description",
      "Semesters",
      "Created At",
    ];
    const row = [
      department.id,
      department.name,
      department.code || "",
      department.description || "",
      department.semesters?.length || 0,
      new Date(department.createdAt).toLocaleDateString(),
    ];

    const csvContent = [
      headers.join(","),
      row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `department-${department.id}-${department.name.replace(/\s+/g, "_")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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

  if (error || !department) {
    return (
      <div className="text-center py-12">
        <p style={{ color: "var(--danger)" }}>Department not found</p>
        <button
          onClick={() => navigate("/admin/departments")}
          className="mt-4 text-sm"
          style={{ color: "var(--primary)" }}
        >
          Back to Departments
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/departments")}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            <HiOutlineArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1
              className="text-xl font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Department Details
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              View department information
            </p>
          </div>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto justify-center"
          style={{
            backgroundColor: "var(--primary)",
            color: "white",
          }}
        >
          <HiOutlineDownload className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Main Card */}
      <div
        className="rounded-xl p-6 shadow-sm"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: "var(--primary-light)" }}
          >
            <HiOutlineOfficeBuilding
              className="w-10 h-10"
              style={{ color: "var(--primary)" }}
            />
          </div>
          <div>
            <h2
              className="text-2xl font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {department.name}
            </h2>
            {department.code && (
              <p
                className="text-sm mt-1 font-mono"
                style={{ color: "var(--text-muted)" }}
              >
                Code: {department.code}
              </p>
            )}
          </div>
        </div>

        {department.description && (
          <div className="mt-6">
            <h3
              className="text-sm font-medium mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              Description
            </h3>
            <p style={{ color: "var(--text-primary)" }}>
              {department.description}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div
            className="p-4 rounded-lg"
            style={{ backgroundColor: "var(--bg-main)" }}
          >
            <div className="flex items-center gap-3">
              <HiOutlineAcademicCap
                className="w-5 h-5"
                style={{ color: "var(--primary)" }}
              />
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                Semesters
              </span>
            </div>
            <p
              className="text-2xl font-semibold mt-2"
              style={{ color: "var(--text-primary)" }}
            >
              {department.semesters?.length || 0}
            </p>
          </div>
          <div
            className="p-4 rounded-lg"
            style={{ backgroundColor: "var(--bg-main)" }}
          >
            <div className="flex items-center gap-3">
              <HiOutlineCalendar
                className="w-5 h-5"
                style={{ color: "var(--primary)" }}
              />
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                Created
              </span>
            </div>
            <p
              className="text-lg font-semibold mt-2"
              style={{ color: "var(--text-primary)" }}
            >
              {safeFormatDate(department)}
            </p>
          </div>
          <div
            className="p-4 rounded-lg"
            style={{ backgroundColor: "var(--bg-main)" }}
          >
            <div className="flex items-center gap-3">
              <HiOutlineUserGroup
                className="w-5 h-5"
                style={{ color: "var(--primary)" }}
              />
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                ID
              </span>
            </div>
            <p
              className="text-sm font-mono mt-2"
              style={{ color: "var(--text-primary)" }}
            >
              {department.id}
            </p>
          </div>
        </div>
      </div>

      {/* Semesters List */}
      {department.semesters && department.semesters.length > 0 && (
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
            <h3
              className="font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              Semesters
            </h3>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {department.semesters.map((semester) => (
              <div
                key={semester.id}
                className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/admin/semesters/${semester.id}`)}
              >
                <div>
                  <p
                    className="font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Semester {semester.number}
                  </p>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {semester._count?.sections || 0} sections
                  </p>
                </div>
                <span className="text-sm" style={{ color: "var(--primary)" }}>
                  View →
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentDetail;
