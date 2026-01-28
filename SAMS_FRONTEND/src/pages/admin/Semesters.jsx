import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineX,
  HiOutlineEye,
  HiOutlineFilter,
} from "react-icons/hi";
import ConfirmModal from "../../components/common/ConfirmModal";
import {
  getAllSemesters,
  createSemester,
  updateSemester,
  deleteSemester,
  getAllDepartments,
} from "../../api/admin.api";

const Semesters = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    number: "",
    department_id: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    id: null,
  });

  // Filter states
  const [filterDepartment, setFilterDepartment] = useState("");

  const { data: semesters, isLoading } = useQuery({
    queryKey: ["semesters"],
    queryFn: getAllSemesters,
    select: (res) => res.data.data,
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: getAllDepartments,
    select: (res) => res.data.data,
  });

  // Filter semesters
  const filteredSemesters = semesters
    ?.filter((sem) => {
      if (filterDepartment && sem.department_id !== filterDepartment)
        return false;
      return true;
    })
    ?.sort((a, b) => a.number - b.number);

  const createMutation = useMutation({
    mutationFn: createSemester,
    onSuccess: () => {
      queryClient.invalidateQueries(["semesters"]);
      closeModal();
    },
    onError: (error) => {
      setErrorMessage(
        error.response?.data?.message || "Failed to create semester",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateSemester(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["semesters"]);
      closeModal();
    },
    onError: (error) => {
      setErrorMessage(
        error.response?.data?.message || "Failed to update semester",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSemester,
    onSuccess: () => queryClient.invalidateQueries(["semesters"]),
  });

  const openModal = (item = null) => {
    setErrorMessage("");
    if (item) {
      setEditingItem(item);
      setFormData({
        number: item.number?.toString() || "",
        department_id: item.department_id || "",
      });
    } else {
      setEditingItem(null);
      setFormData({ number: "", department_id: "" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({ number: "", department_id: "" });
    setErrorMessage("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      number: parseInt(formData.number),
      department_id: formData.department_id,
    };
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
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
            Semesters
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Manage academic semesters
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors w-full sm:w-auto justify-center"
          style={{ backgroundColor: "var(--primary)" }}
        >
          <HiOutlinePlus className="w-4 h-4" />
          <span>Add Semester</span>
        </button>
      </div>

      {/* Filter */}
      <div
        className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-2">
          <HiOutlineFilter
            className="w-5 h-5"
            style={{ color: "var(--text-muted)" }}
          />
          <span
            className="text-sm font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            Filter by:
          </span>
        </div>
        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm outline-none"
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
        {filterDepartment && (
          <button
            onClick={() => setFilterDepartment("")}
            className="text-sm px-3 py-2 rounded-lg"
            style={{ color: "var(--primary)" }}
          >
            Clear Filter
          </button>
        )}
      </div>

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
                  Semester Number
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
                  Sections
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
                    colSpan="4"
                    className="px-4 py-8 text-center text-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Loading...
                  </td>
                </tr>
              ) : filteredSemesters?.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-4 py-8 text-center text-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    No semesters found
                  </td>
                </tr>
              ) : (
                filteredSemesters?.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td
                      className="px-4 py-3 text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Semester {item.number}
                    </td>
                    <td
                      className="px-4 py-3 text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {item.department?.name || "—"}
                    </td>
                    <td
                      className="px-4 py-3 text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {item._count?.sections || item.sections?.length || 0}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => navigate(`/admin/semesters/${item.id}`)}
                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                        title="View Details"
                        style={{ color: "var(--primary)" }}
                      >
                        <HiOutlineEye className="w-4 h-4" />
                      </button>
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
                {editingItem ? "Edit Semester" : "Add Semester"}
              </h3>
              <button
                onClick={closeModal}
                style={{ color: "var(--text-muted)" }}
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Message */}
              {errorMessage && (
                <div
                  className="p-3 rounded-lg text-sm"
                  style={{
                    backgroundColor: "#FEE2E2",
                    color: "#991B1B",
                    border: "1px solid #FECACA",
                  }}
                >
                  {errorMessage}
                </div>
              )}
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  Department
                </label>
                <select
                  value={formData.department_id}
                  onChange={(e) =>
                    setFormData({ ...formData, department_id: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{
                    backgroundColor: "var(--bg-main)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                >
                  <option value="">Select Department</option>
                  {departments?.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  Semester Number
                </label>
                <input
                  type="number"
                  value={formData.number}
                  onChange={(e) =>
                    setFormData({ ...formData, number: e.target.value })
                  }
                  required
                  min="1"
                  max="10"
                  placeholder="e.g., 1"
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{
                    backgroundColor: "var(--bg-main)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
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
        title="Delete Semester"
        message="Are you sure you want to delete this semester? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default Semesters;
