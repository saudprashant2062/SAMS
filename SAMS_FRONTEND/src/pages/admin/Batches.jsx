import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineX,
  HiOutlineCalendar,
} from "react-icons/hi";
import {
  getAllBatches,
  getAllDepartments,
  createBatch,
  updateBatch,
  deleteBatch,
} from "../../api/admin.api";
import AlertMessage from "../../components/common/AlertMessage";
import ConfirmModal from "../../components/common/ConfirmModal";
import Pagination from "../../components/common/Pagination";

const getCurrentBSYear = () => {
  const today = new Date();
  const bsOffset = 56;
  let bsYear = today.getFullYear() + bsOffset;
  if (today.getMonth() < 3) {
    bsYear -= 1;
  }
  return bsYear;
};

const Batches = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    department_id: "",
    start_year: getCurrentBSYear(),
    end_year: getCurrentBSYear() + 4,
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    id: null,
    name: "",
  });
  const [page, setPage] = useState(1);

  const { data: batchesData, isLoading } = useQuery({
    queryKey: ["batches", page],
    queryFn: () => getAllBatches({ page, limit: 20 }),
    select: (res) => ({ data: res.data.data, pagination: res.data.pagination }),
  });
  const batches = batchesData?.data;
  const batchesPagination = batchesData?.pagination;

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: () => getAllDepartments({ limit: 100 }),
    select: (res) => res.data.data,
  });

  const createMutation = useMutation({
    mutationFn: createBatch,
    onSuccess: () => {
      queryClient.invalidateQueries(["batches"]);
      closeModal();
    },
    onError: (error) => {
      setErrorMessage(
        error.response?.data?.message || "Failed to create batch",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateBatch(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["batches"]);
      closeModal();
    },
    onError: (error) => {
      setErrorMessage(
        error.response?.data?.message || "Failed to update batch",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBatch,
    onSuccess: () => queryClient.invalidateQueries(["batches"]),
  });

  const openModal = (item = null) => {
    setErrorMessage("");
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name || "",
        department_id: item.department_id || "",
        start_year: item.start_year || getCurrentBSYear(),
        end_year: item.end_year || getCurrentBSYear() + 4,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: "",
        department_id: "",
        start_year: getCurrentBSYear(),
        end_year: getCurrentBSYear() + 4,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({
      name: "",
      department_id: "",
      start_year: getCurrentBSYear(),
      end_year: getCurrentBSYear() + 4,
    });
    setErrorMessage("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.department_id) {
      setErrorMessage("Please select a department");
      return;
    }

    const startYear =
      typeof formData.start_year === "string"
        ? parseInt(formData.start_year, 10)
        : formData.start_year;
    const endYear =
      typeof formData.end_year === "string"
        ? parseInt(formData.end_year, 10)
        : formData.end_year;

    if (!startYear || isNaN(startYear)) {
      setErrorMessage("Please enter a valid start year");
      return;
    }

    if (!endYear || isNaN(endYear)) {
      setErrorMessage("Please enter a valid end year");
      return;
    }

    if (endYear <= startYear) {
      setErrorMessage("End year must be greater than start year");
      return;
    }

    const data = {
      name: formData.name || `${startYear} Batch`,
      department_id: formData.department_id,
      start_year: startYear,
      end_year: endYear,
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (item) => {
    setDeleteConfirm({
      isOpen: true,
      id: item.id,
      name: item.name || `Batch ${item.year}`,
    });
  };

  const confirmDelete = () => {
    if (deleteConfirm.id) {
      deleteMutation.mutate(deleteConfirm.id);
    }
    setDeleteConfirm({ isOpen: false, id: null, name: "" });
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
            Batches
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Manage student batches (academic year groups)
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-white text-xs md:text-sm font-medium transition-colors w-full sm:w-auto justify-center"
          style={{ backgroundColor: "var(--primary)" }}
        >
          <HiOutlinePlus className="w-4 h-4" />
          Add Batch
        </button>
      </div>

      {/* Batches Table */}
      <div
        className="rounded-xl shadow-sm overflow-hidden"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: "var(--primary-subtle)" }}>
              <tr>
                <th
                  className="px-4 py-3 text-left text-xs font-medium"
                  style={{ color: "var(--primary)" }}
                >
                  Duration (BS)
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium"
                  style={{ color: "var(--primary)" }}
                >
                  Name
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
                  Students
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
              ) : batches?.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-4 py-8 text-center text-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    No batches found
                  </td>
                </tr>
              ) : (
                batches?.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td
                      className="px-4 py-3 text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      <div className="flex items-center gap-2">
                        <HiOutlineCalendar
                          className="w-4 h-4"
                          style={{ color: "var(--primary)" }}
                        />
                        {item.start_year} - {item.end_year}
                      </div>
                    </td>
                    <td
                      className="px-4 py-3 text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {item.name || "—"}
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
                      {item._count?.students || 0}
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
                        onClick={() => handleDelete(item)}
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
        <Pagination pagination={batchesPagination} onPageChange={setPage} />
      </div>

      {/* Modal */}
      {isModalOpen && (
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
                {editingItem ? "Edit Batch" : "Add Batch"}
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
                  Department *
                </label>
                <select
                  value={formData.department_id}
                  onChange={(e) =>
                    setFormData({ ...formData, department_id: e.target.value })
                  }
                  required
                  className="w-full px-2 py-1.5 md:px-3 md:py-2 rounded-lg text-xs md:text-sm outline-none"
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Start Year (BS) *
                  </label>
                  <input
                    type="number"
                    value={formData.start_year}
                    onChange={(e) =>
                      setFormData({ ...formData, start_year: e.target.value })
                    }
                    required
                    min="2070"
                    max="2150"
                    placeholder="e.g., 2082"
                    className="w-full px-2 py-1.5 md:px-3 md:py-2 rounded-lg text-xs md:text-sm outline-none"
                    style={{
                      backgroundColor: "var(--bg-main)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "var(--text-primary)" }}
                  >
                    End Year (BS) *
                  </label>
                  <input
                    type="number"
                    value={formData.end_year}
                    onChange={(e) =>
                      setFormData({ ...formData, end_year: e.target.value })
                    }
                    required
                    min="2070"
                    max="2150"
                    placeholder="e.g., 2086"
                    className="w-full px-2 py-1.5 md:px-3 md:py-2 rounded-lg text-xs md:text-sm outline-none"
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
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., 2082 Batch"
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{
                    backgroundColor: "var(--bg-main)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              {/* Error Message */}
              {errorMessage && (
                <AlertMessage
                  type="error"
                  message={errorMessage}
                  onClose={() => setErrorMessage("")}
                />
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors"
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
                  className="flex-1 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium text-white transition-colors disabled:opacity-50"
                  style={{ backgroundColor: "var(--primary)" }}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editingItem
                      ? "Update"
                      : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Batch"
        message={`Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null, name: "" })}
        type="danger"
      />
    </div>
  );
};

export default Batches;
