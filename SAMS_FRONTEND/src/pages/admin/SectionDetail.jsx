import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  HiOutlineArrowLeft,
  HiOutlineUserGroup,
  HiOutlineCalendar,
  HiOutlineAcademicCap,
  HiOutlineOfficeBuilding,
  HiOutlineDownload,
  HiOutlineUser,
} from "react-icons/hi";
import { getSectionById } from "../../api/admin.api";
import { safeFormatDate } from "../../utils/formatDate";
import { getFileUrl } from "../../utils/constants";

const SectionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    data: section,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["section", id],
    queryFn: () => getSectionById(id),
    select: (res) => res.data.data,
  });

  const exportToCSV = () => {
    if (!section) return;

    // Section info
    const headers = [
      "ID",
      "Name",
      "Semester",
      "Department",
      "Students Count",
      "Created At",
    ];
    const row = [
      section.id,
      section.name,
      section.semester?.number || "",
      section.semester?.department?.name || "",
      section.students?.length || 0,
      new Date(section.createdAt).toLocaleDateString(),
    ];

    let csvContent = [
      headers.join(","),
      row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","),
    ].join("\n");

    // Add students if present
    if (section.students && section.students.length > 0) {
      csvContent += "\n\nStudents:\n";
      const studentHeaders = ["Roll No", "Name", "Email", "Photo URL"];
      csvContent += studentHeaders.join(",") + "\n";

      section.students.forEach((student) => {
        const studentRow = [
          student.roll_no,
          student.user?.fullname || "",
          student.user?.email || "",
          student.user?.photo_url || "",
        ];
        csvContent +=
          studentRow
            .map((val) => `"${String(val).replace(/"/g, '""')}"`)
            .join(",") + "\n";
      });
    }

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `section-${section.id}-${section.name.replace(/\s+/g, "_")}.csv`;
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

  if (error || !section) {
    return (
      <div className="text-center py-12">
        <p style={{ color: "var(--danger)" }}>Section not found</p>
        <button
          onClick={() => navigate("/admin/sections")}
          className="mt-4 text-sm"
          style={{ color: "var(--primary)" }}
        >
          Back to Sections
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
            onClick={() => navigate("/admin/sections")}
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
              Section Details
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              View section information
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
            <HiOutlineUserGroup
              className="w-10 h-10"
              style={{ color: "var(--primary)" }}
            />
          </div>
          <div>
            <h2
              className="text-2xl font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {section.name}
            </h2>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Semester {section.semester?.number} •{" "}
              {section.semester?.department?.name}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
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
              {section.semester?.department?.name || "N/A"}
            </p>
          </div>
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
                Semester
              </span>
            </div>
            <p
              className="text-2xl font-semibold mt-2"
              style={{ color: "var(--text-primary)" }}
            >
              {section.semester?.number}
            </p>
          </div>
          <div
            className="p-4 rounded-lg"
            style={{ backgroundColor: "var(--bg-main)" }}
          >
            <div className="flex items-center gap-3">
              <HiOutlineUser
                className="w-5 h-5"
                style={{ color: "var(--primary)" }}
              />
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                Students
              </span>
            </div>
            <p
              className="text-2xl font-semibold mt-2"
              style={{ color: "var(--text-primary)" }}
            >
              {section.students?.length || section._count?.students || 0}
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
              {safeFormatDate(section)}
            </p>
          </div>
        </div>
      </div>

      {/* Students List */}
      {section.students && section.students.length > 0 && (
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
              Students ({section.students.length})
            </h3>
          </div>
          <div className="table-responsive">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "var(--bg-main)" }}>
                  <th
                    className="text-left px-4 py-3 text-xs font-medium"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Student
                  </th>
                  <th
                    className="text-left px-4 py-3 text-xs font-medium"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Roll No
                  </th>
                  <th
                    className="text-left px-4 py-3 text-xs font-medium"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Email
                  </th>
                  <th
                    className="text-left px-4 py-3 text-xs font-medium"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody
                className="divide-y"
                style={{ borderColor: "var(--border)" }}
              >
                {section.students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {student.user?.photo_url ? (
                          <img
                            src={getFileUrl(student.user.photo_url)}
                            alt={student.user.fullname}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
                            style={{
                              backgroundColor: "var(--primary-light)",
                              color: "var(--primary)",
                            }}
                          >
                            {student.user?.fullname?.charAt(0)?.toUpperCase()}
                          </div>
                        )}
                        <span
                          className="text-sm font-medium"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {student.user?.fullname}
                        </span>
                      </div>
                    </td>
                    <td
                      className="px-4 py-3 text-sm"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {student.roll_no}
                    </td>
                    <td
                      className="px-4 py-3 text-sm email-cell"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {student.user?.email}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          navigate(`/admin/users/${student.user?.id}`)
                        }
                        className="text-sm"
                        style={{ color: "var(--primary)" }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SectionDetail;
