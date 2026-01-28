import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineX,
  HiOutlineEye,
  HiOutlineArrowUp,
  HiOutlineSearch,
  HiOutlineFilter,
} from "react-icons/hi";
import ConfirmModal from "../../components/common/ConfirmModal";
import AlertMessage from "../../components/common/AlertMessage";
import {
  getAllSections,
  createSection,
  updateSection,
  deleteSection,
  getAllDepartments,
  getAllSemesters,
  promoteSemester,
} from "../../api/admin.api";

const Sections = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    department_id: "",
    semester_id: "",
  });
  const [promoteData, setPromoteData] = useState({
    department_id: "",
    from_semester_id: "",
    to_semester_id: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [promoteError, setPromoteError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    id: null,
    name: "",
  });

  // Filter & Search states
  const [search, setSearch] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterSemester, setFilterSemester] = useState("");

  const { data: sections, isLoading } = useQuery({
    queryKey: ["sections"],
    queryFn: getAllSections,
    select: (res) => res.data.data,
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: getAllDepartments,
    select: (res) => res.data.data,
  });

  const { data: semesters } = useQuery({
    queryKey: ["semesters"],
    queryFn: getAllSemesters,
    select: (res) => res.data.data,
  });

  const createMutation = useMutation({
    mutationFn: createSection,
    onSuccess: () => {
      queryClient.invalidateQueries(["sections"]);
      closeModal();
    },
    onError: (error) => {
      setErrorMessage(
        error.response?.data?.message || "Failed to create section",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateSection(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["sections"]);
      closeModal();
    },
    onError: (error) => {
      setErrorMessage(
        error.response?.data?.message || "Failed to update section",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSection,
    onSuccess: () => queryClient.invalidateQueries(["sections"]),
  });

  const promoteMutation = useMutation({
    mutationFn: promoteSemester,
    onSuccess: () => {
      queryClient.invalidateQueries(["sections"]);
      setIsPromoteModalOpen(false);
      setPromoteData({
        department_id: "",
        from_semester_id: "",
        to_semester_id: "",
      });
      setPromoteError("");
    },
    onError: (error) => {
      setPromoteError(
        error.response?.data?.message || "Failed to promote semester",
      );
    },
  });

  const openModal = (item = null) => {
    setErrorMessage("");
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        department_id: item.department_id,
        semester_id: item.semester_id,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: "",
        department_id: "",
        semester_id: "",
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
      semester_id: "",
    });
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

  const handleDelete = (item) => {
    setDeleteConfirm({ isOpen: true, id: item.id, name: item.name });
  };

  const confirmDelete = () => {
    if (deleteConfirm.id) {
      deleteMutation.mutate(deleteConfirm.id, {
        onSettled: () =>
          setDeleteConfirm({ isOpen: false, id: null, name: "" }),
      });
    }
  };

  const handlePromoteSubmit = (e) => {
    e.preventDefault();
    promoteMutation.mutate(promoteData);
  };

  const filteredSemesters = promoteData.department_id
    ? semesters?.filter(
        (sem) => sem.department_id === promoteData.department_id,
      )
    : [];

  // Filter semesters for filter dropdown
  const filterSemesterOptions = filterDepartment
    ? semesters?.filter((sem) => sem.department_id === filterDepartment)
    : semesters;

  // Filter sections for table
  const filteredSections = sections?.filter((sec) => {
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      if (!sec.name?.toLowerCase().includes(searchLower)) {
        return false;
      }
    }
    // Department filter
    if (filterDepartment && sec.department_id !== filterDepartment)
      return false;
    // Semester filter
    if (filterSemester && sec.semester_id !== filterSemester) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1
            className="text-xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Sections
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Manage class sections
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <button
            onClick={() => setIsPromoteModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 sm:flex-none justify-center"
            style={{
              backgroundColor: "var(--bg-main)",
              color: "var(--primary)",
              border: "1px solid var(--border)",
            }}
          >
            <HiOutlineArrowUp className="w-4 h-4" />
            <span className="whitespace-nowrap">Promote</span>
          </button>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors flex-1 sm:flex-none justify-center"
            style={{ backgroundColor: "var(--primary)" }}
          >
            <HiOutlinePlus className="w-4 h-4" />
            <span className="whitespace-nowrap">Add Section</span>
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div
        className="flex flex-col gap-4 p-4 rounded-xl"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Search */}
        <div className="relative">
          <HiOutlineSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            type="text"
            placeholder="Search by section name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg text-sm outline-none"
            style={{
              backgroundColor: "var(--bg-main)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          />
        </div>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <HiOutlineFilter
              className="w-5 h-5"
              style={{ color: "var(--text-muted)" }}
            />
            <span
              className="text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              Filter:
            </span>
          </div>
          <select
            value={filterDepartment}
            onChange={(e) => {
              setFilterDepartment(e.target.value);
              setFilterSemester("");
            }}
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
          <select
            value={filterSemester}
            onChange={(e) => setFilterSemester(e.target.value)}
            disabled={!filterDepartment}
            className="px-3 py-2 rounded-lg text-sm outline-none disabled:opacity-50"
            style={{
              backgroundColor: "var(--bg-main)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          >
            <option value="">
              {filterDepartment ? "All Semesters" : "Select Dept First"}
            </option>
            {filterSemesterOptions
              ?.sort((a, b) => a.number - b.number)
              .map((sem) => (
                <option key={sem.id} value={sem.id}>
                  Semester {sem.number}
                </option>
              ))}
          </select>
          {(search || filterDepartment || filterSemester) && (
            <button
              onClick={() => {
                setSearch("");
                setFilterDepartment("");
                setFilterSemester("");
              }}
              className="text-sm px-3 py-2 rounded-lg"
              style={{ color: "var(--primary)" }}
            >
              Clear All
            </button>
          )}
        </div>
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
                  Section Name
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
                  Semester
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
              ) : sections?.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-4 py-8 text-center text-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    No sections found
                  </td>
                </tr>
              ) : (
                sections?.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td
                      className="px-4 py-3 text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {item.name}
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
                      {item.semester ? `Semester ${item.semester.number}` : "—"}
                    </td>
                    <td
                      className="px-4 py-3 text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {item._count?.students || 0}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => navigate(`/admin/sections/${item.id}`)}
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
            className="w-full max-w-md rounded-xl p-6 shadow-lg max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: "var(--bg-card)" }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3
                className="text-lg font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {editingItem ? "Edit Section" : "Add Section"}
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
                  Section Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  placeholder="e.g., Section A"
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
                  Department
                </label>
                <select
                  value={formData.department_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      department_id: e.target.value,
                      semester_id: "",
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
                  Semester
                </label>
                <select
                  value={formData.semester_id}
                  onChange={(e) =>
                    setFormData({ ...formData, semester_id: e.target.value })
                  }
                  required
                  disabled={!formData.department_id}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--bg-main)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                >
                  <option value="">
                    {formData.department_id
                      ? "Select Semester"
                      : "Select Department First"}
                  </option>
                  {semesters
                    ?.filter(
                      (sem) => sem.department_id === formData.department_id,
                    )
                    .sort((a, b) => a.number - b.number)
                    .map((sem) => (
                      <option key={sem.id} value={sem.id}>
                        Semester {sem.number}
                      </option>
                    ))}
                </select>
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

      {/* Promote Modal */}
      {isPromoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className="w-full max-w-md rounded-xl p-6 shadow-lg max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: "var(--bg-card)" }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2
                className="text-lg font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Promote Semester
              </h2>
              <button
                onClick={() => setIsPromoteModalOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100"
              >
                <HiOutlineX
                  className="w-5 h-5"
                  style={{ color: "var(--text-muted)" }}
                />
              </button>
            </div>
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
              Move all students from one semester to another
            </p>
            <form onSubmit={handlePromoteSubmit} className="space-y-4">
              {/* Promote Error Message */}
              {promoteError && (
                <div
                  className="p-3 rounded-lg text-sm"
                  style={{
                    backgroundColor: "#FEE2E2",
                    color: "#991B1B",
                    border: "1px solid #FECACA",
                  }}
                >
                  {promoteError}
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
                  value={promoteData.department_id}
                  onChange={(e) =>
                    setPromoteData({
                      ...promoteData,
                      department_id: e.target.value,
                      from_semester_id: "",
                      to_semester_id: "",
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
                  From Semester
                </label>
                <select
                  value={promoteData.from_semester_id}
                  onChange={(e) =>
                    setPromoteData({
                      ...promoteData,
                      from_semester_id: e.target.value,
                    })
                  }
                  required
                  disabled={!promoteData.department_id}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--bg-main)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                >
                  <option value="">Select Source Semester</option>
                  {filteredSemesters.map((sem) => (
                    <option key={sem.id} value={sem.id}>
                      Semester {sem.number}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  To Semester
                </label>
                <select
                  value={promoteData.to_semester_id}
                  onChange={(e) =>
                    setPromoteData({
                      ...promoteData,
                      to_semester_id: e.target.value,
                    })
                  }
                  required
                  disabled={!promoteData.from_semester_id}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--bg-main)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                >
                  <option value="">Select Target Semester</option>
                  {filteredSemesters
                    .filter((sem) => {
                      // Must not be the same semester
                      if (sem.id === promoteData.from_semester_id) return false;
                      // Must be higher than source semester
                      const fromSem = filteredSemesters.find(
                        (s) => s.id === promoteData.from_semester_id,
                      );
                      if (fromSem && sem.number <= fromSem.number) return false;
                      return true;
                    })
                    .map((sem) => (
                      <option key={sem.id} value={sem.id}>
                        Semester {sem.number}
                      </option>
                    ))}
                </select>
              </div>
              {promoteMutation.isError && (
                <p className="text-sm" style={{ color: "var(--danger)" }}>
                  {promoteMutation.error?.response?.data?.message ||
                    "Error promoting students. Please try again."}
                </p>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPromoteModalOpen(false)}
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
                  disabled={promoteMutation.isPending}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
                  style={{ backgroundColor: "var(--primary)" }}
                >
                  {promoteMutation.isPending ? "Promoting..." : "Promote"}
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
        title="Delete Section"
        message="Are you sure you want to delete this section? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default Sections;
