import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  HiOutlineArrowLeft,
  HiOutlineAcademicCap,
  HiOutlineCalendar,
  HiOutlineUserGroup,
  HiOutlineOfficeBuilding,
  HiOutlineDownload,
} from "react-icons/hi";
import { getSemesterById } from "../../api/admin.api";
import { safeFormatDate } from "../../utils/formatDate";

const SemesterDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    data: semester,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["semester", id],
    queryFn: () => getSemesterById(id),
    select: (res) => res.data.data,
  });

  const exportToCSV = () => {
    if (!semester) return;

    const headers = ["ID", "Number", "Department", "Sections", "Created At"];
    const row = [
      semester.id,
      semester.number,
      semester.department?.name || "",
      semester.sections?.length || 0,
      new Date(semester.createdAt).toLocaleDateString(),
    ];

    const csvContent = [
      headers.join(","),
      row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `semester-${semester.id}.csv`;
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

  if (error || !semester) {
    return (
      <div className="text-center py-12">
        <p style={{ color: "var(--danger)" }}>Semester not found</p>
        <button
          onClick={() => navigate("/admin/semesters")}
          className="mt-4 text-sm"
          style={{ color: "var(--primary)" }}
        >
          Back to Semesters
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
            onClick={() => navigate("/admin/semesters")}
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
              Semester Details
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              View semester information
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
            <HiOutlineAcademicCap
              className="w-10 h-10"
              style={{ color: "var(--primary)" }}
            />
          </div>
          <div>
            <h2
              className="text-2xl font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Semester {semester.number}
            </h2>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              {semester.department?.name}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div
            className="p-4 rounded-lg"
            style={{ backgroundColor: "var(--bg-main)" }}
          >
            <div className="flex items-center gap-3">
              <HiOutlineOfficeBuilding
                className="w-5 h-5"
                style={{ color: "var(--primary)" }}
              />
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                Department
              </span>
            </div>
            <p
              className="text-lg font-semibold mt-2"
              style={{ color: "var(--text-primary)" }}
            >
              {semester.department?.name || "N/A"}
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
                Sections
              </span>
            </div>
            <p
              className="text-2xl font-semibold mt-2"
              style={{ color: "var(--text-primary)" }}
            >
              {semester.sections?.length || 0}
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
              {safeFormatDate(semester)}
            </p>
          </div>
        </div>
      </div>

      {/* Sections List */}
      {semester.sections && semester.sections.length > 0 && (
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
              Sections
            </h3>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {semester.sections.map((section) => (
              <div
                key={section.id}
                className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/admin/sections/${section.id}`)}
              >
                <div>
                  <p
                    className="font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {section.name}
                  </p>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {section.students?.length || section._count?.students || 0}{" "}
                    students
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

export default SemesterDetail;
