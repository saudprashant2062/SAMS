import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineCalendar,
  HiOutlineUserGroup,
  HiOutlineSave,
  HiOutlinePencil,
} from "react-icons/hi";
import {
  getTeacherAssignments,
  markAttendance,
  getAttendanceHistory,
  createAttendanceSession,
  updateAttendanceSession,
  getAttendanceRecords,
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [editForm, setEditForm] = useState({ session_date: "" });
  const [isRecordEditModalOpen, setIsRecordEditModalOpen] = useState(false);
  const [editingRecordSession, setEditingRecordSession] = useState(null);
  const [tempAttendance, setTempAttendance] = useState({});

  const { data: assignments } = useQuery({
    queryKey: ["teacherAssignments"],
    queryFn: () => getTeacherAssignments({ limit: 100 }),
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
    queryFn: () => getAttendanceHistory(selectedAssignment, { limit: 100 }),
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

  const updateSessionMutation = useMutation({
    mutationFn: ({ id, data }) => updateAttendanceSession(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["attendanceHistory"]);
      setIsEditModalOpen(false);
      setEditingSession(null);
      setAlertMessage({
        type: "success",
        message: "Session date updated successfully!",
      });
    },
    onError: (error) => {
      setAlertMessage({
        type: "error",
        message: error.response?.data?.message || "Failed to update session",
      });
    },
  });

  const recordMarkMutation = useMutation({
    mutationFn: markAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries(["attendanceHistory"]);
      setIsRecordEditModalOpen(false);
      setEditingRecordSession(null);
      setAlertMessage({
        type: "success",
        message: "Attendance records updated successfully!",
      });
    },
    onError: (error) => {
      setAlertMessage({
        type: "error",
        message: error.response?.data?.message || "Failed to update records",
      });
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

  const openEditModal = (session) => {
    setEditingSession(session);
    setEditForm({
      session_date: new Date(session.date).toISOString().split("T")[0],
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateSessionDate = (e) => {
    e.preventDefault();
    updateSessionMutation.mutate({
      id: editingSession.id,
      data: {
        session_date: new Date(editForm.session_date).toISOString(),
      },
    });
  };

  const openEditRecords = async (session) => {
    try {
      const res = await getAttendanceRecords(session.id);
      const records = res.data.data;
      const initialAttendance = {};
      records.forEach((r) => {
        initialAttendance[r.student_id] = r.status;
      });
      setTempAttendance(initialAttendance);
      setEditingRecordSession({ ...session, records });
      setIsRecordEditModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch records:", error);
      setAlertMessage({ type: "error", message: "Failed to load records" });
    }
  };

  const handleTempStatusChange = (studentId, status) => {
    setTempAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleUpdateRecords = () => {
    const records = Object.entries(tempAttendance).map(
      ([studentId, status]) => ({
        student_id: studentId,
        status,
      }),
    );
    recordMarkMutation.mutate({
      session_id: editingRecordSession.id,
      records,
    });
  };

  const getStatusButton = (
    studentId,
    status,
    icon,
    label,
    color,
    currentStatus,
  ) => {
    const isActive = (currentStatus || attendance[studentId]) === status;
    return (
      <button
        onClick={() => {
          if (currentStatus !== undefined) {
            handleTempStatusChange(studentId, status);
          } else {
            handleStatusChange(studentId, status);
          }
        }}
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
              className="w-full px-2 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm outline-none"
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
                  className="w-full pl-9 pr-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm outline-none"
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
          className={`flex-1 sm:flex-initial px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors`}
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
          className={`flex-1 sm:flex-initial px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors`}
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
                className="px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-[10px] md:text-xs font-medium text-white"
                style={{ backgroundColor: "var(--status-present)" }}
              >
                All Present
              </button>
              <button
                onClick={() => handleMarkAll("ABSENT")}
                className="px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-[10px] md:text-xs font-medium text-white"
                style={{ backgroundColor: "var(--status-absent)" }}
              >
                All Absent
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
              className="w-full flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-lg text-xs md:text-sm text-white font-medium transition-colors disabled:opacity-50"
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
                <th
                  className="px-4 py-3 text-right text-xs font-medium"
                  style={{ color: "var(--primary)" }}
                >
                  Actions
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
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(record)}
                          className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                          title="Edit Date"
                          style={{ color: "var(--primary)" }}
                        >
                          <HiOutlineCalendar className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditRecords(record)}
                          className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                          title="Edit Attendance"
                          style={{ color: "var(--status-present)" }}
                        >
                          <HiOutlinePencil className="w-4 h-4" />
                        </button>
                      </div>
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

      {/* Edit Session Modal */}
      {isEditModalOpen && editingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className="w-full max-w-md rounded-xl p-6 shadow-lg"
            style={{ backgroundColor: "var(--bg-card)" }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3
                className="text-lg font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Edit Session Date
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
                style={{ color: "var(--text-muted)" }}
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSessionDate} className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Session Date
                </label>
                <input
                  type="date"
                  required
                  value={editForm.session_date}
                  onChange={(e) =>
                    setEditForm({ ...editForm, session_date: e.target.value })
                  }
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-2 rounded-lg border outline-none focus:ring-2"
                  style={{
                    backgroundColor: "white",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              {alertMessage.type === "error" && alertMessage.message && (
                <div
                  className="p-3 rounded-lg text-sm"
                  style={{
                    backgroundColor: "var(--danger-subtle)",
                    color: "var(--danger)",
                  }}
                >
                  {alertMessage.message}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-4 py-2 rounded-lg font-medium border transition-colors"
                  style={{
                    backgroundColor: "white",
                    borderColor: "var(--border)",
                    color: "var(--text-secondary)",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateSessionMutation.isPending}
                  className="flex-1 px-4 py-2 rounded-lg font-medium text-white transition-colors disabled:opacity-50"
                  style={{ backgroundColor: "var(--primary)" }}
                >
                  {updateSessionMutation.isPending
                    ? "Updating..."
                    : "Update Date"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Records Modal */}
      {isRecordEditModalOpen && editingRecordSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-auto rounded-xl p-6 shadow-lg"
            style={{ backgroundColor: "var(--bg-card)" }}
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3
                  className="text-lg font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Edit Attendance Records
                </h3>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {formatDate(editingRecordSession.date)} •{" "}
                  {selectedAssignmentData?.subject?.name}
                </p>
              </div>
              <button
                onClick={() => setIsRecordEditModalOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
                style={{ color: "var(--text-muted)" }}
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div
                className="divide-y"
                style={{ borderColor: "var(--border)" }}
              >
                {editingRecordSession.records?.map((record) => (
                  <div
                    key={record.student_id}
                    className="py-3 flex items-center justify-between"
                  >
                    <div>
                      <p
                        className="font-medium text-sm"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {record.student?.user?.fullname}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Roll No: {record.student?.roll_no}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {getStatusButton(
                        record.student_id,
                        "PRESENT",
                        <HiOutlineCheck className="w-3.5 h-3.5" />,
                        "Present",
                        "var(--status-present)",
                        tempAttendance[record.student_id],
                      )}
                      {getStatusButton(
                        record.student_id,
                        "ABSENT",
                        <HiOutlineX className="w-3.5 h-3.5" />,
                        "Absent",
                        "var(--status-absent)",
                        tempAttendance[record.student_id],
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {alertMessage.type === "error" && alertMessage.message && (
                <div
                  className="p-3 rounded-lg text-sm"
                  style={{
                    backgroundColor: "var(--danger-subtle)",
                    color: "var(--danger)",
                  }}
                >
                  {alertMessage.message}
                </div>
              )}

              <div
                className="flex gap-3 pt-4 border-t"
                style={{ borderColor: "var(--border)" }}
              >
                <button
                  onClick={() => setIsRecordEditModalOpen(false)}
                  className="flex-1 px-4 py-2 rounded-lg font-medium border transition-colors"
                  style={{
                    backgroundColor: "white",
                    borderColor: "var(--border)",
                    color: "var(--text-secondary)",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateRecords}
                  disabled={recordMarkMutation.isPending}
                  className="flex-1 px-4 py-2 rounded-lg font-medium text-white transition-colors disabled:opacity-50"
                  style={{ backgroundColor: "var(--primary)" }}
                >
                  {recordMarkMutation.isPending
                    ? "Updating..."
                    : "Update Attendance"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAttendance;
