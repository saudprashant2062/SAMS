import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  HiOutlineCalendar,
  HiOutlineEye,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineX,
  HiOutlineCheck,
} from "react-icons/hi";
import ConfirmModal from "../../components/common/ConfirmModal";
import {
  getAllAttendanceSessions,
  getAttendanceSessionById,
  createAttendanceSession,
  deleteAttendanceSession,
  markAttendance,
  updateAttendanceRecord,
  getAllSections,
  getAllSubjects,
  getAllTeachingAssignments,
} from "../../api/admin.api";

const AdminAttendance = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    section_id: "",
    subject_id: "",
    start_date: "",
    end_date: "",
  });
  const [selectedSession, setSelectedSession] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMarkModalOpen, setIsMarkModalOpen] = useState(false);
  const [markingSession, setMarkingSession] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [createForm, setCreateForm] = useState({
    teaching_assignment_id: "",
    session_date: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    sessionId: null,
  });

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["attendanceSessions", filters],
    queryFn: () => getAllAttendanceSessions(filters),
    select: (res) => res.data.data,
  });

  const { data: sections } = useQuery({
    queryKey: ["sections"],
    queryFn: getAllSections,
    select: (res) => res.data.data,
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: getAllSubjects,
    select: (res) => res.data.data,
  });

  const { data: teachingAssignments } = useQuery({
    queryKey: ["teachingAssignments"],
    queryFn: getAllTeachingAssignments,
    select: (res) => res.data.data,
  });

  // Create session mutation
  const createMutation = useMutation({
    mutationFn: createAttendanceSession,
    onSuccess: () => {
      queryClient.invalidateQueries(["attendanceSessions"]);
      setIsCreateModalOpen(false);
      setCreateForm({ teaching_assignment_id: "", session_date: "" });
      setErrorMessage("");
    },
    onError: (error) => {
      setErrorMessage(
        error.response?.data?.message || "Failed to create session",
      );
    },
  });

  // Delete session mutation
  const deleteMutation = useMutation({
    mutationFn: deleteAttendanceSession,
    onSuccess: () => {
      queryClient.invalidateQueries(["attendanceSessions"]);
    },
  });

  // Mark attendance mutation
  const markMutation = useMutation({
    mutationFn: markAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries(["attendanceSessions"]);
      setIsMarkModalOpen(false);
      setMarkingSession(null);
      setAttendanceRecords([]);
    },
    onError: (error) => {
      setErrorMessage(
        error.response?.data?.message || "Failed to mark attendance",
      );
    },
  });

  // Update single record mutation
  const updateRecordMutation = useMutation({
    mutationFn: ({ id, data }) => updateAttendanceRecord(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["attendanceSessions"]);
      // Refetch session details if viewing
      if (selectedSession) {
        refetchSessionDetails(selectedSession.id);
      }
    },
  });

  const refetchSessionDetails = async (sessionId) => {
    const res = await getAttendanceSessionById(sessionId);
    setSelectedSession(res.data.data);
  };

  const getStatusBadge = (status) => {
    const styles = {
      PRESENT: { bg: "#D1FAE5", color: "var(--status-present)" },
      ABSENT: { bg: "#FEE2E2", color: "var(--status-absent)" },
    };
    return styles[status] || styles.ABSENT;
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleCreateSession = (e) => {
    e.preventDefault();
    // Convert date to ISO format for backend validation
    const formData = {
      ...createForm,
      session_date: createForm.session_date
        ? new Date(createForm.session_date).toISOString()
        : undefined,
    };
    createMutation.mutate(formData);
  };

  const handleDeleteSession = (id) => {
    setDeleteConfirm({ isOpen: true, sessionId: id });
  };

  const confirmDelete = () => {
    if (deleteConfirm.sessionId) {
      deleteMutation.mutate(deleteConfirm.sessionId, {
        onSettled: () => {
          setDeleteConfirm({ isOpen: false, sessionId: null });
        },
      });
    }
  };

  const openMarkAttendance = async (session) => {
    try {
      const res = await getAttendanceSessionById(session.id);
      const sessionDetails = res.data.data;
      setMarkingSession(sessionDetails);

      // Initialize records with existing or default status
      const students =
        sessionDetails.teaching_assignment?.section?.students || [];
      const existingRecords = sessionDetails.records || [];

      const initialRecords = students.map((student) => {
        const existing = existingRecords.find(
          (r) => r.student_id === student.id,
        );
        return {
          student_id: student.id,
          student_name: student.user?.fullname,
          roll_no: student.roll_no,
          status: existing?.status || "PRESENT",
          record_id: existing?.id || null,
        };
      });

      setAttendanceRecords(initialRecords);
      setIsMarkModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch session details", error);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords((prev) =>
      prev.map((r) => (r.student_id === studentId ? { ...r, status } : r)),
    );
  };

  const handleMarkAttendance = () => {
    const records = attendanceRecords.map((r) => ({
      student_id: r.student_id,
      status: r.status,
    }));
    markMutation.mutate({
      session_id: markingSession.id,
      records,
    });
  };

  const handleUpdateRecordStatus = (recordId, newStatus) => {
    updateRecordMutation.mutate({ id: recordId, data: { status: newStatus } });
  };

  const viewSessionDetails = async (session) => {
    try {
      const res = await getAttendanceSessionById(session.id);
      setSelectedSession(res.data.data);
    } catch (error) {
      console.error("Failed to fetch session details", error);
    }
  };

  // Calculate counts from records
  const getSessionCounts = (session) => {
    const records = session.records || [];
    const presentCount = records.filter((r) => r.status === "PRESENT").length;
    const absentCount = records.filter((r) => r.status === "ABSENT").length;
    return { presentCount, absentCount };
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
            Attendance Management
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            View and manage attendance sessions
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors w-full sm:w-auto justify-center"
          style={{ backgroundColor: "var(--primary)" }}
        >
          <HiOutlinePlus className="w-4 h-4" />
          <span>Create Session</span>
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
        <div className="flex flex-wrap gap-4">
          <select
            value={filters.section_id}
            onChange={(e) =>
              setFilters({ ...filters, section_id: e.target.value })
            }
            className="px-4 py-2 rounded-lg text-sm outline-none min-w-[180px]"
            style={{
              backgroundColor: "var(--bg-main)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          >
            <option value="">All Sections</option>
            {sections?.map((section) => (
              <option key={section.id} value={section.id}>
                {section.name}
              </option>
            ))}
          </select>
          <select
            value={filters.subject_id}
            onChange={(e) =>
              setFilters({ ...filters, subject_id: e.target.value })
            }
            className="px-4 py-2 rounded-lg text-sm outline-none min-w-[180px]"
            style={{
              backgroundColor: "var(--bg-main)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          >
            <option value="">All Subjects</option>
            {subjects?.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          <div className="relative">
            <HiOutlineCalendar
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) =>
                setFilters({ ...filters, start_date: e.target.value })
              }
              placeholder="Start Date"
              className="pl-9 pr-4 py-2 rounded-lg text-sm outline-none"
              style={{
                backgroundColor: "var(--bg-main)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <div className="relative">
            <HiOutlineCalendar
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) =>
                setFilters({ ...filters, end_date: e.target.value })
              }
              placeholder="End Date"
              className="pl-9 pr-4 py-2 rounded-lg text-sm outline-none"
              style={{
                backgroundColor: "var(--bg-main)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Sessions Table */}
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
                  Section
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium"
                  style={{ color: "var(--primary)" }}
                >
                  Teacher
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium"
                  style={{ color: "var(--primary)" }}
                >
                  Present
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium"
                  style={{ color: "var(--primary)" }}
                >
                  Absent
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
              {isLoading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-4 py-8 text-center text-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Loading...
                  </td>
                </tr>
              ) : sessions?.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-4 py-8 text-center text-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    No attendance sessions found
                  </td>
                </tr>
              ) : (
                sessions?.map((session) => {
                  const { presentCount, absentCount } =
                    getSessionCounts(session);
                  return (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td
                        className="px-4 py-3 text-sm"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {formatDate(session.session_date)}
                      </td>
                      <td
                        className="px-4 py-3 text-sm"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {session.teaching_assignment?.subject?.name || "—"}
                      </td>
                      <td
                        className="px-4 py-3 text-sm"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {session.teaching_assignment?.section?.name || "—"}
                      </td>
                      <td
                        className="px-4 py-3 text-sm"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {session.teaching_assignment?.teacher?.user?.fullname ||
                          "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: "#D1FAE5",
                            color: "var(--status-present)",
                          }}
                        >
                          {presentCount}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: "#FEE2E2",
                            color: "var(--status-absent)",
                          }}
                        >
                          {absentCount}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => viewSessionDetails(session)}
                            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                            title="View Details"
                            style={{ color: "var(--primary)" }}
                          >
                            <HiOutlineEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openMarkAttendance(session)}
                            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                            title="Mark Attendance"
                            style={{ color: "var(--status-present)" }}
                          >
                            <HiOutlinePencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSession(session.id)}
                            className="p-1.5 rounded hover:bg-red-50 transition-colors"
                            title="Delete Session"
                            style={{ color: "var(--danger)" }}
                          >
                            <HiOutlineTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Session Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className="w-full max-w-md rounded-xl p-6 shadow-lg max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: "var(--bg-card)" }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3
                className="text-lg font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Create Attendance Session
              </h3>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setErrorMessage("");
                }}
                style={{ color: "var(--text-muted)" }}
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  Teaching Assignment
                </label>
                <select
                  value={createForm.teaching_assignment_id}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      teaching_assignment_id: e.target.value,
                    })
                  }
                  required
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{
                    backgroundColor: "var(--bg-main)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                >
                  <option value="">Select Assignment</option>
                  {teachingAssignments?.map((ta) => (
                    <option key={ta.id} value={ta.id}>
                      {ta.teacher?.user?.fullname} - {ta.subject?.name} (
                      {ta.section?.name})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  Session Date
                </label>
                <input
                  type="date"
                  value={createForm.session_date}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      session_date: e.target.value,
                    })
                  }
                  required
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{
                    backgroundColor: "var(--bg-main)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
              {errorMessage && (
                <div
                  className="p-3 rounded-lg text-sm"
                  style={{
                    backgroundColor: "var(--danger-subtle)",
                    color: "var(--danger)",
                  }}
                >
                  {errorMessage}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setErrorMessage("");
                  }}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: "var(--bg-main)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border)",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
                  style={{ backgroundColor: "var(--primary)" }}
                >
                  {createMutation.isPending ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark Attendance Modal */}
      {isMarkModalOpen && markingSession && (
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
                  Mark Attendance
                </h3>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {formatDate(markingSession.session_date)} •{" "}
                  {markingSession.teaching_assignment?.subject?.name}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsMarkModalOpen(false);
                  setMarkingSession(null);
                  setAttendanceRecords([]);
                }}
                style={{ color: "var(--text-muted)" }}
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4">
              <table className="w-full">
                <thead style={{ backgroundColor: "var(--primary-subtle)" }}>
                  <tr>
                    <th
                      className="px-4 py-2 text-left text-xs font-medium"
                      style={{ color: "var(--primary)" }}
                    >
                      Student
                    </th>
                    <th
                      className="px-4 py-2 text-left text-xs font-medium"
                      style={{ color: "var(--primary)" }}
                    >
                      Roll No
                    </th>
                    <th
                      className="px-4 py-2 text-left text-xs font-medium"
                      style={{ color: "var(--primary)" }}
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody
                  className="divide-y"
                  style={{ borderColor: "var(--border)" }}
                >
                  {attendanceRecords.map((record) => (
                    <tr key={record.student_id}>
                      <td
                        className="px-4 py-2 text-sm"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {record.student_name}
                      </td>
                      <td
                        className="px-4 py-2 text-sm"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {record.roll_no}
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={record.status}
                          onChange={(e) =>
                            handleStatusChange(
                              record.student_id,
                              e.target.value,
                            )
                          }
                          className="px-2 py-1 rounded text-sm outline-none"
                          style={{
                            backgroundColor: "var(--bg-main)",
                            border: "1px solid var(--border)",
                            color: "var(--text-primary)",
                          }}
                        >
                          <option value="PRESENT">Present</option>
                          <option value="ABSENT">Absent</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {errorMessage && (
              <div
                className="mt-4 p-3 rounded-lg text-sm"
                style={{
                  backgroundColor: "var(--danger-subtle)",
                  color: "var(--danger)",
                }}
              >
                {errorMessage}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setIsMarkModalOpen(false);
                  setMarkingSession(null);
                  setAttendanceRecords([]);
                }}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: "var(--bg-main)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAttendance}
                disabled={markMutation.isPending}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: "var(--primary)" }}
              >
                <HiOutlineCheck className="w-4 h-4" />
                {markMutation.isPending ? "Saving..." : "Save Attendance"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Detail Modal */}
      {selectedSession && (
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
                  Attendance Details
                </h3>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {formatDate(selectedSession.session_date)} •{" "}
                  {selectedSession.teaching_assignment?.subject?.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="p-2 rounded-lg hover:bg-gray-100"
                style={{ color: "var(--text-muted)" }}
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4">
              <table className="w-full">
                <thead style={{ backgroundColor: "var(--primary-subtle)" }}>
                  <tr>
                    <th
                      className="px-4 py-2 text-left text-xs font-medium"
                      style={{ color: "var(--primary)" }}
                    >
                      Student
                    </th>
                    <th
                      className="px-4 py-2 text-left text-xs font-medium"
                      style={{ color: "var(--primary)" }}
                    >
                      Roll No
                    </th>
                    <th
                      className="px-4 py-2 text-left text-xs font-medium"
                      style={{ color: "var(--primary)" }}
                    >
                      Status
                    </th>
                    <th
                      className="px-4 py-2 text-right text-xs font-medium"
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
                  {selectedSession.records?.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-4 py-4 text-center text-sm"
                        style={{ color: "var(--text-muted)" }}
                      >
                        No attendance records yet
                      </td>
                    </tr>
                  ) : (
                    selectedSession.records?.map((record) => {
                      const badge = getStatusBadge(record.status);
                      return (
                        <tr key={record.id}>
                          <td
                            className="px-4 py-2 text-sm"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {record.student?.user?.fullname}
                          </td>
                          <td
                            className="px-4 py-2 text-sm"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {record.student?.roll_no}
                          </td>
                          <td className="px-4 py-2">
                            <span
                              className="px-2 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: badge.bg,
                                color: badge.color,
                              }}
                            >
                              {record.status}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right">
                            <select
                              value={record.status}
                              onChange={(e) =>
                                handleUpdateRecordStatus(
                                  record.id,
                                  e.target.value,
                                )
                              }
                              className="px-2 py-1 rounded text-xs outline-none"
                              style={{
                                backgroundColor: "var(--bg-main)",
                                border: "1px solid var(--border)",
                                color: "var(--text-primary)",
                              }}
                            >
                              <option value="PRESENT">Present</option>
                              <option value="ABSENT">Absent</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, sessionId: null })}
        onConfirm={confirmDelete}
        title="Delete Session"
        message="Are you sure you want to delete this attendance session? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default AdminAttendance;
