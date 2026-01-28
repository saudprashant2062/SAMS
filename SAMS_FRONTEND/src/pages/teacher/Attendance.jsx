import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineCalendar,
  HiOutlineUserGroup,
  HiOutlineSave,
} from "react-icons/hi";
import {
  getTeacherAssignments,
  markAttendance,
  getAttendanceHistory,
  createAttendanceSession,
} from "../../api/teacher.api";
import AlertMessage from "../../components/common/AlertMessage";

const TeacherAttendance = () => {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [selectedAssignment, setSelectedAssignment] = useState(
    searchParams.get("assignmentId") || "",
  );
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendance, setAttendance] = useState({});
  const [activeTab, setActiveTab] = useState("mark"); // mark | history
  const [alertMessage, setAlertMessage] = useState({ type: "", message: "" });

  const { data: assignments } = useQuery({
    queryKey: ["teacherAssignments"],
    queryFn: getTeacherAssignments,
    select: (res) => res.data.data,
  });

  // Get students from the selected assignment's section
  const selectedAssignmentData = assignments?.find(
    (a) => a.id === selectedAssignment,
  );
  const students = selectedAssignmentData?.section?.students || [];
  const studentsLoading = false;

  const { data: history } = useQuery({
    queryKey: ["attendanceHistory", selectedAssignment],
    queryFn: () => getAttendanceHistory(selectedAssignment),
    select: (res) => res.data.data,
    enabled: !!selectedAssignment && activeTab === "history",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const markMutation = useMutation({
    mutationFn: markAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries(["attendanceHistory"]);
      queryClient.invalidateQueries(["teacherAssignments"]);
      setAlertMessage({
        type: "success",
        message: "Attendance marked successfully!",
      });
      setIsSubmitting(false);
    },
    onError: (error) => {
      setAlertMessage({
        type: "error",
        message: error.response?.data?.message || "Failed to mark attendance",
      });
      setIsSubmitting(false);
    },
  });

  const createSessionMutation = useMutation({
    mutationFn: createAttendanceSession,
    onError: (error) => {
      setAlertMessage({
        type: "error",
        message: error.response?.data?.message || "Failed to create session",
      });
      setIsSubmitting(false);
    },
  });

  useEffect(() => {
    if (students && students.length > 0) {
      const initialAttendance = {};
      students.forEach((student) => {
        initialAttendance[student.id] = "PRESENT";
      });
      setAttendance(initialAttendance);
    }
  }, [students]);

  const handleStatusChange = (studentId, status) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleMarkAll = (status) => {
    const newAttendance = {};
    students?.forEach((student) => {
      newAttendance[student.id] = status;
    });
    setAttendance(newAttendance);
  };

  // Check if selected date is in the future
  const isFutureDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    return selectedDate > today;
  };

  const handleSubmit = async () => {
    if (!selectedAssignment || students.length === 0) return;

    // Validate date is not in the future
    if (isFutureDate()) {
      setAlertMessage({
        type: "warning",
        message: "Cannot mark attendance for a future date",
      });
      return;
    }

    setAlertMessage({ type: "", message: "" });
    setIsSubmitting(true);
    try {
      // First create the attendance session
      const sessionRes = await createSessionMutation.mutateAsync({
        teaching_assignment_id: selectedAssignment,
        session_date: new Date(date).toISOString(),
      });

      const sessionId = sessionRes.data.data.id;

      // Then mark attendance for each student
      const records = Object.entries(attendance).map(([studentId, status]) => ({
        student_id: studentId,
        status,
      }));

      markMutation.mutate({
        session_id: sessionId,
        records,
      });
    } catch (error) {
      console.error("Failed to mark attendance:", error);
      setIsSubmitting(false);
    }
  };

  const getStatusButton = (studentId, status, icon, label, color) => {
    const isActive = attendance[studentId] === status;
    return (
      <button
        onClick={() => handleStatusChange(studentId, status)}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
          isActive ? "ring-2 ring-offset-1" : "opacity-60 hover:opacity-100"
        }`}
        style={{
          backgroundColor: isActive ? color : "transparent",
          color: isActive ? "white" : color,
          border: `1px solid ${color}`,
          ringColor: color,
        }}
      >
        {icon}
        {label}
      </button>
    );
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1
          className="text-xl font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Attendance
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Mark and view attendance for your classes
        </p>
      </div>

      {/* Filters */}
      <div
        className="rounded-xl p-4 shadow-sm"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: "var(--text-muted)" }}
            >
              Select Assignment
            </label>
            <select
              value={selectedAssignment}
              onChange={(e) => setSelectedAssignment(e.target.value)}
              className="w-full px-4 py-2 rounded-lg text-sm outline-none"
              style={{
                backgroundColor: "var(--bg-main)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            >
              <option value="">Choose assignment...</option>
              {assignments?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.subject?.name} - {a.section?.name}
                </option>
              ))}
            </select>
          </div>

          {activeTab === "mark" && (
            <div className="min-w-[180px]">
              <label
                className="block text-xs font-medium mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                Date
              </label>
              <div className="relative">
                <HiOutlineCalendar
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: "var(--text-muted)" }}
                />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none"
                  style={{
                    backgroundColor: "var(--bg-main)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("mark")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors`}
          style={{
            backgroundColor:
              activeTab === "mark" ? "var(--primary)" : "transparent",
            color: activeTab === "mark" ? "white" : "var(--text-secondary)",
            border: activeTab === "mark" ? "none" : "1px solid var(--border)",
          }}
        >
          Mark Attendance
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors`}
          style={{
            backgroundColor:
              activeTab === "history" ? "var(--primary)" : "transparent",
            color: activeTab === "history" ? "white" : "var(--text-secondary)",
            border:
              activeTab === "history" ? "none" : "1px solid var(--border)",
          }}
        >
          View History
        </button>
      </div>

      {/* Mark Attendance Tab */}
      {activeTab === "mark" && selectedAssignment && (
        <div
          className="rounded-xl shadow-sm overflow-hidden"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          {/* Quick Actions */}
          <div
            className="p-4 border-b flex flex-wrap gap-3 items-center justify-between"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-2">
              <HiOutlineUserGroup
                className="w-5 h-5"
                style={{ color: "var(--primary)" }}
              />
              <span
                className="font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {students?.length || 0} Students
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleMarkAll("PRESENT")}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                style={{ backgroundColor: "var(--status-present)" }}
              >
                Mark All Present
              </button>
              <button
                onClick={() => handleMarkAll("ABSENT")}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                style={{ backgroundColor: "var(--status-absent)" }}
              >
                Mark All Absent
              </button>
            </div>
          </div>

          {/* Student List */}
          {studentsLoading ? (
            <div className="p-8 text-center">
              <div
                className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto"
                style={{ borderColor: "var(--primary)" }}
              ></div>
            </div>
          ) : students?.length === 0 ? (
            <div className="p-8 text-center">
              <HiOutlineUserGroup
                className="w-12 h-12 mx-auto mb-3"
                style={{ color: "var(--text-muted)" }}
              />
              <p
                className="text-sm font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                No Students Enrolled
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--text-muted)" }}
              >
                There are no students enrolled in this section yet
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {students?.map((student) => (
                <div
                  key={student.id}
                  className="p-4 flex flex-wrap gap-4 items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
                      style={{
                        backgroundColor: "var(--primary-light)",
                        color: "var(--primary)",
                      }}
                    >
                      {student.user?.fullname?.charAt(0) || "S"}
                    </div>
                    <div>
                      <p
                        className="font-medium text-sm"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {student.user?.fullname}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Roll No: {student.roll_no}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {getStatusButton(
                      student.id,
                      "PRESENT",
                      <HiOutlineCheck className="w-3.5 h-3.5" />,
                      "Present",
                      "var(--status-present)",
                    )}
                    {getStatusButton(
                      student.id,
                      "ABSENT",
                      <HiOutlineX className="w-3.5 h-3.5" />,
                      "Absent",
                      "var(--status-absent)",
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Submit Button */}
          <div
            className="p-4 border-t"
            style={{ borderColor: "var(--border)" }}
          >
            {isFutureDate() && (
              <div
                className="mb-3 p-3 rounded-lg text-sm"
                style={{
                  backgroundColor: "#FEF3C7",
                  color: "#92400E",
                  border: "1px solid #F59E0B",
                }}
              >
                ⚠️ Cannot mark attendance for a future date. Please select today
                or a past date.
              </div>
            )}
            {alertMessage.message && (
              <div className="mb-3">
                <AlertMessage
                  type={alertMessage.type}
                  message={alertMessage.message}
                  onClose={() => setAlertMessage({ type: "", message: "" })}
                />
              </div>
            )}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !students?.length || isFutureDate()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
              style={{ backgroundColor: "var(--primary)" }}
            >
              <HiOutlineSave className="w-5 h-5" />
              {isSubmitting ? "Saving..." : "Save Attendance"}
            </button>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && selectedAssignment && (
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
              </tr>
            </thead>
            <tbody
              className="divide-y"
              style={{ borderColor: "var(--border)" }}
            >
              {history?.length === 0 ? (
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
                history?.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td
                      className="px-4 py-3 text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {formatDate(record.date)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: "#D1FAE5",
                          color: "var(--status-present)",
                        }}
                      >
                        {record.presentCount || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: "#FEE2E2",
                          color: "var(--status-absent)",
                        }}
                      >
                        {record.absentCount || 0}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-center text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {record.totalCount || 0}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!selectedAssignment && (
        <div
          className="rounded-xl p-12 text-center shadow-sm"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <HiOutlineUserGroup
            className="w-16 h-16 mx-auto mb-4"
            style={{ color: "var(--text-muted)" }}
          />
          <h3
            className="text-lg font-medium mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Select an Assignment
          </h3>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Choose a teaching assignment to mark or view attendance
          </p>
        </div>
      )}
    </div>
  );
};

export default TeacherAttendance;
