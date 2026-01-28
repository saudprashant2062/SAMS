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
  createBatch,
  updateBatch,
  deleteBatch,
} from "../../api/admin.api";
import AlertMessage from "../../components/common/AlertMessage";
import ConfirmModal from "../../components/common/ConfirmModal";
import { batchSchema } from "../../schemas/admin.schema";
import useFormValidation from "../../hooks/useFormValidation";

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
    year: getCurrentBSYear(),
    name: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    id: null,
    name: "",
  });

  const { data: batches, isLoading } = useQuery({
    queryKey: ["batches"],
    queryFn: getAllBatches,
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
        year: item.year,
        name: item.name || "",
      });
    } else {
      setEditingItem(null);
      setFormData({
        year: getCurrentBSYear(),
        name: "",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({
      year: getCurrentBSYear(),
      name: "",
    });
    setErrorMessage("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Convert year to number and validate
    const yearValue = formData.year;
    const yearNum =
      typeof yearValue === "string" ? parseInt(yearValue, 10) : yearValue;

    if (
      yearValue === "" ||
      yearValue === null ||
      yearValue === undefined ||
      isNaN(yearNum)
    ) {
      setErrorMessage("Please enter a valid year");
      return;
    }

    const data = {
      year: yearNum,
      name: formData.name || null,
    };

    console.log("Submitting data:", data); // Debug log

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
      <div className="flex justify-between items-center">
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
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
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
                  Year (BS)
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
                    colSpan="4"
                    className="px-4 py-8 text-center text-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Loading...
                  </td>
                </tr>
              ) : batches?.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
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
                        {item.year}
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
                  Year (BS) *
                </label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: e.target.value })
                  }
                  required
                  min="2070"
                  max="2100"
                  placeholder="e.g., 2082"
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
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
                  Name (Optional)
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
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  Optional display name for the batch
                </p>
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
