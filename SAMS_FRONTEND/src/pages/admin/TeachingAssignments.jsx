import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineX,
  HiOutlineFilter,
  HiOutlineXCircle,
} from "react-icons/hi";
import ConfirmModal from "../../components/common/ConfirmModal";
import {
  getAllTeachingAssignments,
  createTeachingAssignment,
  updateTeachingAssignment,
  deleteTeachingAssignment,
  getAllTeachers,
  getAllSubjects,
  getAllSections,
  getAllDepartments,
} from "../../api/admin.api";

const TeachingAssignments = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    teacher_id: "",
    subject_id: "",
    section_id: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    id: null,
  });

  // Filter states
  const [filters, setFilters] = useState({
    department_id: "",
    subject_id: "",
    section_id: "",
    teacher_id: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Data queries
  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: getAllDepartments,
    select: (res) => res.data.data,
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: getAllSubjects,
    select: (res) => res.data.data,
  });

  const { data: sections } = useQuery({
    queryKey: ["sections"],
    queryFn: getAllSections,
    select: (res) => res.data.data,
  });

  const { data: teachers } = useQuery({
    queryKey: ["teachers"],
    queryFn: getAllTeachers,
    select: (res) => res.data.data?.teachers || res.data.data,
  });

  const { data: assignments, isLoading } = useQuery({
    queryKey: ["teachingAssignments", filters],
    queryFn: () => getAllTeachingAssignments(filters),
    select: (res) => res.data.data,
  });

  // Filter subjects and sections based on selected department
  const filteredSubjects = filters.department_id
    ? subjects?.filter((s) => s.department_id === filters.department_id)
    : subjects;

  const filteredSections = filters.department_id
    ? sections?.filter((s) => s.department_id === filters.department_id)
    : sections;

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      department_id: "",
      subject_id: "",
      section_id: "",
      teacher_id: "",
    });
  };

  // Check if any filter is active
  const hasActiveFilters = Object.values(filters).some((v) => v);

  // --- Filtering logic for modal section dropdown ---
  let selectedSubject = null;
  let modalFilteredSections = [];
  if (subjects && formData.subject_id) {
    selectedSubject = subjects.find((subj) => subj.id === formData.subject_id);
  }
  if (selectedSubject && sections) {
    modalFilteredSections = sections.filter(
      (section) =>
        section.department_id === selectedSubject.department_id &&
        section.semester_id === selectedSubject.semester_id,
    );
  }

  const createMutation = useMutation({
    mutationFn: createTeachingAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries(["teachingAssignments"]);
      closeModal();
    },
    onError: (error) => {
      setErrorMessage(
        error.response?.data?.message || "Failed to create teaching assignment",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateTeachingAssignment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["teachingAssignments"]);
      closeModal();
    },
    onError: (error) => {
      setErrorMessage(
        error.response?.data?.message || "Failed to update teaching assignment",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTeachingAssignment,
    onSuccess: () => queryClient.invalidateQueries(["teachingAssignments"]),
  });

  const openModal = (item = null) => {
    setErrorMessage("");
    if (item) {
      setEditingItem(item);
      setFormData({
        teacher_id: item.teacher_id,
        subject_id: item.subject_id,
        section_id: item.section_id,
      });
    } else {
      setEditingItem(null);
      setFormData({ teacher_id: "", subject_id: "", section_id: "" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({ teacher_id: "", subject_id: "", section_id: "" });
    setErrorMessage("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id) => {
    setDeleteConfirm({ isOpen: true, id });
  };

  const confirmDelete = () => {
    if (deleteConfirm.id) {
      deleteMutation.mutate(deleteConfirm.id, {
        onSettled: () => setDeleteConfirm({ isOpen: false, id: null }),
      });
    }
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
            Teaching Assignments
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Assign teachers to subjects and sections
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: showFilters
                ? "var(--primary)"
                : "var(--bg-main)",
              color: showFilters ? "white" : "var(--text-primary)",
              border: "1px solid var(--border)",
            }}
          >
            <HiOutlineFilter className="w-4 h-4" />
            <span>Filters</span>
          </button>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: "var(--primary)" }}
          >
            <HiOutlinePlus className="w-4 h-4" />
            <span>Add Assignment</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <HiOutlineFilter
                className="w-4 h-4"
                style={{ color: "var(--primary)" }}
              />
              <span
                className="text-sm font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                Filter Assignments
              </span>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs hover:opacity-80"
                style={{ color: "var(--danger)" }}
              >
                <HiOutlineXCircle className="w-3 h-3" />
                Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label
                className="block text-xs font-medium mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Department
              </label>
              <select
                value={filters.department_id}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    department_id: e.target.value,
                    subject_id: "",
                    section_id: "",
                  })
                }
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  backgroundColor: "var(--bg-main)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              >
                <option value="">All Departments</option>
                {departments?.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                className="block text-xs font-medium mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Subject
              </label>
              <select
                value={filters.subject_id}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    subject_id: e.target.value,
                    section_id: "",
                  })
                }
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  backgroundColor: "var(--bg-main)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
                disabled={!filters.department_id && !subjects?.length}
              >
                <option value="">All Subjects</option>
                {filteredSubjects?.map((subj) => (
                  <option key={subj.id} value={subj.id}>
                    {subj.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                className="block text-xs font-medium mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Section
              </label>
              <select
                value={filters.section_id}
                onChange={(e) =>
                  setFilters({ ...filters, section_id: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  backgroundColor: "var(--bg-main)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              >
                <option value="">All Sections</option>
                {filteredSections?.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                className="block text-xs font-medium mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Teacher
              </label>
              <select
                value={filters.teacher_id}
                onChange={(e) =>
                  setFilters({ ...filters, teacher_id: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  backgroundColor: "var(--bg-main)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              >
                <option value="">All Teachers</option>
                {teachers?.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.user?.fullname}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
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
                  Teacher
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
                  Department
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
                    colSpan="5"
                    className="px-4 py-8 text-center text-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Loading...
                  </td>
                </tr>
              ) : assignments?.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-4 py-8 text-center text-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {hasActiveFilters
                      ? "No assignments match the selected filters"
                      : "No assignments found"}
                  </td>
                </tr>
              ) : (
                assignments?.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td
                      className="px-4 py-3 text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {item.teacher?.user?.fullname || "—"}
                    </td>
                    <td
                      className="px-4 py-3 text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {item.subject?.name || "—"}
                    </td>
                    <td
                      className="px-4 py-3 text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {item.section?.name || "—"}
                    </td>
                    <td
                      className="px-4 py-3 text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {item.section?.department?.name || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openModal(item)}
                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <HiOutlinePencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded hover:bg-red-50 transition-colors ml-1"
                        style={{ color: "var(--danger)" }}
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
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
                {editingItem ? "Edit Assignment" : "Add Assignment"}
              </h3>
              <button
                onClick={closeModal}
                style={{ color: "var(--text-muted)" }}
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  Teacher
                </label>
                <select
                  value={formData.teacher_id}
                  onChange={(e) =>
                    setFormData({ ...formData, teacher_id: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{
                    backgroundColor: "var(--bg-main)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                >
                  <option value="">Select Teacher</option>
                  {teachers?.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.user?.fullname}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  Subject
                </label>
                <select
                  value={formData.subject_id}
                  onChange={(e) =>
                    setFormData({ ...formData, subject_id: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{
                    backgroundColor: "var(--bg-main)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                >
                  <option value="">Select Subject</option>
                  {subjects?.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  Section
                </label>
                <select
                  value={formData.section_id}
                  onChange={(e) =>
                    setFormData({ ...formData, section_id: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{
                    backgroundColor: "var(--bg-main)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                >
                  <option value="">Select Section</option>
                  {modalFilteredSections?.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name} - {section.department?.name}
                    </option>
                  ))}
                </select>
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
                  onClick={closeModal}
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
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
                  style={{ backgroundColor: "var(--primary)" }}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Delete Assignment"
        message="Are you sure you want to delete this teaching assignment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default TeachingAssignments;
