import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  HiOutlineArrowLeft,
  HiOutlineBookOpen,
  HiOutlineOfficeBuilding,
  HiOutlineAcademicCap,
  HiOutlineDownload,
  HiOutlineUser,
  HiOutlineCalendar,
  HiOutlineHashtag,
} from "react-icons/hi";
import { getSubjectById } from "../../api/admin.api";
import { safeFormatDate } from "../../utils/formatDate";

const SubjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    data: subject,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["subject", id],
    queryFn: () => getSubjectById(id),
    select: (res) => res.data.data,
  });

  const exportToCSV = () => {
    if (!subject) return;

    // Subject info
    const headers = [
      "ID",
      "Name",
      "Code",
      "Department",
      "Semester",
      "Teaching Assignments",
      "Created At",
    ];
    const row = [
      subject.id,
      subject.name,
      subject.code || "",
      subject.department?.name || "",
      subject.semester?.number || "",
      subject.teachingAssignments?.length || 0,
      new Date(subject.createdAt).toLocaleDateString(),
    ];

    let csvContent = [
      headers.join(","),
      row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","),
    ].join("\n");

    // Add teaching assignments if present
    if (subject.teachingAssignments && subject.teachingAssignments.length > 0) {
      csvContent += "\n\nTeaching Assignments:\n";
      const assignmentHeaders = [
        "Teacher Name",
        "Teacher Email",
        "Photo URL",
        "Section",
      ];
      csvContent += assignmentHeaders.join(",") + "\n";

      subject.teachingAssignments.forEach((assignment) => {
        const assignmentRow = [
          assignment.teacher?.user?.fullname || "",
          assignment.teacher?.user?.email || "",
          assignment.teacher?.user?.photo_url || "",
          assignment.section?.name || "",
        ];
        csvContent +=
          assignmentRow
            .map((val) => `"${String(val).replace(/"/g, '""')}"`)
            .join(",") + "\n";
      });
    }

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subject-${subject.id}-${subject.name.replace(/\s+/g, "_")}.csv`;
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

  if (error || !subject) {
    return (
      <div className="text-center py-12">
        <p style={{ color: "var(--danger)" }}>Subject not found</p>
        <button
          onClick={() => navigate("/admin/subjects")}
          className="mt-4 text-sm"
          style={{ color: "var(--primary)" }}
        >
          Back to Subjects
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
            onClick={() => navigate("/admin/subjects")}
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
              Subject Details
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              View subject information
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
            <HiOutlineBookOpen
              className="w-10 h-10"
              style={{ color: "var(--primary)" }}
            />
          </div>
          <div>
            <h2
              className="text-2xl font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {subject.name}
            </h2>
            {subject.code && (
              <span
                className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: "var(--bg-main)",
                  color: "var(--text-muted)",
                }}
              >
                {subject.code}
              </span>
            )}
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
              {subject.department?.name || "N/A"}
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
              {subject.semester?.number || "N/A"}
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
                Assignments
              </span>
            </div>
            <p
              className="text-2xl font-semibold mt-2"
              style={{ color: "var(--text-primary)" }}
            >
              {subject.teachingAssignments?.length ||
                subject._count?.teachingAssignments ||
                0}
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
              {safeFormatDate(subject)}
            </p>
          </div>
        </div>
      </div>

      {/* Teaching Assignments */}
      {subject.teachingAssignments &&
        subject.teachingAssignments.length > 0 && (
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
                Teaching Assignments ({subject.teachingAssignments.length})
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
                      Teacher
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
                      Section
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
                  {subject.teachingAssignments.map((assignment) => (
                    <tr key={assignment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {assignment.teacher?.user?.photo_url ? (
                            <img
                              src={assignment.teacher.user.photo_url}
                              alt={assignment.teacher.user.fullname}
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
                              {assignment.teacher?.user?.fullname
                                ?.charAt(0)
                                ?.toUpperCase()}
                            </div>
                          )}
                          <span
                            className="text-sm font-medium"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {assignment.teacher?.user?.fullname}
                          </span>
                        </div>
                      </td>
                      <td
                        className="px-4 py-3 text-sm email-cell"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {assignment.teacher?.user?.email}
                      </td>
                      <td
                        className="px-4 py-3 text-sm"
                        style={{ color: "var(--text-primary)" }}
                      >
                        <button
                          onClick={() =>
                            navigate(
                              `/admin/sections/${assignment.section?.id}`,
                            )
                          }
                          className="hover:underline"
                          style={{ color: "var(--primary)" }}
                        >
                          {assignment.section?.name}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() =>
                            navigate(
                              `/admin/users/${assignment.teacher?.user?.id}`,
                            )
                          }
                          className="text-sm"
                          style={{ color: "var(--primary)" }}
                        >
                          View Teacher
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

export default SubjectDetail;
