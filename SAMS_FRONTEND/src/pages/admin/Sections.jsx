import { useState, useMemo } from "react";
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
  HiOutlineInbox,
  HiOutlineArchive,
  HiOutlineRefresh,
} from "react-icons/hi";
import ConfirmModal from "../../components/common/ConfirmModal";
import AlertMessage from "../../components/common/AlertMessage";
import CascadingFilters from "../../components/common/CascadingFilters";
import EmptyState, {
  EmptyStateCreate,
  EmptyStateFilter,
} from "../../components/common/EmptyState";
import {
  getAllSections,
  createSection,
  updateSection,
  deleteSection,
  getAllDepartments,
  getAllSemesters,
  promoteSemester,
  getAllBatches,
  archiveSection,
  restoreSection,
  getArchivedSections,
} from "../../api/admin.api";

const Sections = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [isArchivedModalOpen, setIsArchivedModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [promoteError, setPromoteError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    id: null,
    name: "",
  });
  const [archiveConfirm, setArchiveConfirm] = useState({
    isOpen: false,
    id: null,
    name: "",
  });

  // Cascading filter state
  const [filters, setFilters] = useState({
    department_id: "",
    batch_id: "",
    semester_id: "",
    section_id: "",
  });

  // Data queries
  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: () => getAllDepartments(),
    select: (res) => res.data.data,
  });

  const { data: semesters } = useQuery({
    queryKey: ["semesters"],
    queryFn: () => getAllSemesters(),
    select: (res) => res.data.data,
  });

  const { data: batches } = useQuery({
    queryKey: ["batches"],
    queryFn: () => getAllBatches(),
    select: (res) => res.data.data,
  });

  // Sections query with filters
  const { data: sections, isLoading } = useQuery({
    queryKey: ["sections", filters, showArchived],
    queryFn: () => {
      const params = { ...filters };
      if (showArchived) {
        return getArchivedSections(params);
      }
      return getAllSections(params);
    },
    select: (res) => res.data.data,
  });

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    department_id: "",
    semester_id: "",
    batch_id: "",
  });

  // Promote form state
  const [promoteData, setPromoteData] = useState({
    department_id: "",
    batch_id: "",
    from_semester_id: "",
    to_semester_id: "",
    options: {
      copy_teaching_assignments: false,
    },
  });

  // Filtered semesters for page filters (CascadingFilters)
  const filteredSemesters = useMemo(() => {
    if (!filters.department_id) return [];
    return (
      semesters?.filter((sem) => sem.department_id === filters.department_id) ||
      []
    );
  }, [semesters, filters.department_id]);

  // Filtered semesters for the Add/Edit form (based on formData.department_id)
  const filteredFormSemesters = useMemo(() => {
    if (!formData.department_id) return [];
    return (
      semesters?.filter(
        (sem) => sem.department_id === formData.department_id,
      ) || []
    );
  }, [semesters, formData.department_id]);

  const filteredPromoteSemesters = useMemo(() => {
    if (!promoteData.department_id) return [];
    return (
      semesters?.filter(
        (sem) => sem.department_id === promoteData.department_id,
      ) || []
    );
  }, [semesters, promoteData.department_id]);

  const filteredPromoteBatches = useMemo(() => {
    if (!promoteData.department_id) return [];
    return (
      batches?.filter(
        (batch) => batch.department_id === promoteData.department_id,
      ) || []
    );
  }, [batches, promoteData.department_id]);

  // Filter sections for table
  const filteredSections = useMemo(() => {
    if (!sections) return [];
    if (!search) return sections;
    const searchLower = search.toLowerCase();
    return sections.filter(
      (sec) =>
        sec.name?.toLowerCase().includes(searchLower) ||
        sec.batch?.name?.toLowerCase().includes(searchLower),
    );
  }, [sections, search]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: createSection,
    onSuccess: () => {
      queryClient.invalidateQueries(["sections"]);
      queryClient.invalidateQueries(["archivedSections"]);
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
    onSuccess: () => {
      queryClient.invalidateQueries(["sections"]);
      setDeleteConfirm({ isOpen: false, id: null, name: "" });
    },
  });

  const promoteMutation = useMutation({
    mutationFn: promoteSemester,
    onSuccess: () => {
      queryClient.invalidateQueries(["sections"]);
      queryClient.invalidateQueries(["archivedSections"]);
      setIsPromoteModalOpen(false);
      setPromoteData({
        department_id: "",
        batch_id: "",
        from_semester_id: "",
        to_semester_id: "",
        options: { copy_teaching_assignments: false },
      });
      setPromoteError("");
    },
    onError: (error) => {
      setPromoteError(
        error.response?.data?.message || "Failed to promote semester",
      );
    },
  });

  const archiveMutation = useMutation({
    mutationFn: archiveSection,
    onSuccess: () => {
      queryClient.invalidateQueries(["sections"]);
      queryClient.invalidateQueries(["archivedSections"]);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: restoreSection,
    onSuccess: () => {
      queryClient.invalidateQueries(["sections"]);
      queryClient.invalidateQueries(["archivedSections"]);
    },
  });

  // Modal handlers
  const openModal = (item = null) => {
    setErrorMessage("");
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        department_id: item.department_id,
        semester_id: item.semester_id,
        batch_id: item.batch_id,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: "",
        department_id: filters.department_id || "",
        semester_id: "",
        batch_id: filters.batch_id || "",
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
      batch_id: "",
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
      deleteMutation.mutate(deleteConfirm.id);
    }
  };

  const handlePromoteSubmit = (e) => {
    e.preventDefault();
    promoteMutation.mutate(promoteData);
  };

  const handleArchive = (item) => {
    setArchiveConfirm({ isOpen: true, id: item.id, name: item.name });
  };

  const confirmArchive = () => {
    if (archiveConfirm.id) {
      archiveMutation.mutate(archiveConfirm.id, {
        onSuccess: () => {
          setArchiveConfirm({ isOpen: false, id: null, name: "" });
        },
      });
    }
  };

  const handleRestore = (id) => {
    restoreMutation.mutate(id);
  };

  // Check if filters are complete for submission
  const canCreateSection =
    formData.department_id && formData.batch_id && formData.semester_id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1
            className="text-xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {showArchived ? "Archived Sections" : "Sections"}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {showArchived
              ? "Historical sections from past semesters"
              : "Manage class sections with batch context"}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          {/* Toggle Archived */}
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors flex-1 sm:flex-none justify-center border ${
              showArchived
                ? "bg-amber-50 border-amber-200 text-amber-700"
                : "bg-white border-gray-200 text-gray-700"
            }`}
          >
            <HiOutlineArchive className="w-4 h-4" />
            <span>{showArchived ? "Show Active" : "Archived"}</span>
          </button>

          {/* Promote Button */}
          {!showArchived && (
            <button
              onClick={() => setIsPromoteModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors flex-1 sm:flex-none justify-center"
              style={{
                backgroundColor: "var(--bg-main)",
                color: "var(--primary)",
                border: "1px solid var(--border)",
              }}
            >
              <HiOutlineArrowUp className="w-4 h-4" />
              <span>Promote</span>
            </button>
          )}

          {/* Add Section Button */}
          {!showArchived && (
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium text-white transition-colors w-full sm:w-auto justify-center"
              style={{ backgroundColor: "var(--primary)" }}
            >
              <HiOutlinePlus className="w-4 h-4" />
              <span>Add Section</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Cascading Filters */}
      <div
        className="rounded-xl p-4"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Search */}
        <div className="relative mb-4">
          <HiOutlineSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            type="text"
            placeholder="Search sections..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm outline-none"
            style={{
              backgroundColor: "var(--bg-main)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        {/* Cascading Filters */}
        <CascadingFilters
          value={filters}
          onChange={setFilters}
          departments={departments || []}
          batches={batches || []}
          semesters={semesters || []}
          sections={[]}
          showSection={false}
          showLabels={true}
        />
      </div>

      {/* Sections Table */}
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
                  Section
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium"
                  style={{ color: "var(--primary)" }}
                >
                  Batch
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
              ) : filteredSections?.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-0">
                    {showArchived ? (
                      <EmptyState
                        type="default"
                        title="No Archived Sections"
                        description="Archived sections from past promotions will appear here."
                        icon={<HiOutlineArchive className="w-16 h-16" />}
                      />
                    ) : filters.department_id ||
                      filters.batch_id ||
                      filters.semester_id ? (
                      <EmptyStateFilter
                        entity="sections"
                        onClearFilters={() =>
                          setFilters({
                            department_id: "",
                            batch_id: "",
                            semester_id: "",
                            section_id: "",
                          })
                        }
                      />
                    ) : (
                      <EmptyStateCreate
                        entity="Section"
                        onCreate={() => openModal()}
                      />
                    )}
                  </td>
                </tr>
              ) : (
                filteredSections?.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td
                      className="px-4 py-3 text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {item.name}
                      {item.is_archived && (
                        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700">
                          Archived
                        </span>
                      )}
                    </td>
                    <td
                      className="px-4 py-3 text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {item.batch?.name || "—"}
                      <span className="block text-xs text-muted">
                        {item.batch?.start_year}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Semester {item.semester?.number}
                    </td>
                    <td
                      className="px-4 py-3 text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {item._count?.students || 0}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!showArchived ? (
                        <>
                          <button
                            onClick={() =>
                              navigate(`/admin/sections/${item.id}`)
                            }
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
                            onClick={() => handleArchive(item)}
                            className="p-1.5 rounded hover:bg-amber-50 transition-colors ml-1"
                            title="Archive"
                            style={{ color: "var(--warning)" }}
                          >
                            <HiOutlineArchive className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1.5 rounded hover:bg-red-50 transition-colors ml-1"
                            style={{ color: "var(--danger)" }}
                          >
                            <HiOutlineTrash className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleRestore(item.id)}
                          className="p-1.5 rounded hover:bg-green-50 transition-colors"
                          title="Restore"
                          style={{ color: "var(--status-present)" }}
                        >
                          <HiOutlineRefresh className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
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
              {errorMessage && (
                <AlertMessage type="error" message={errorMessage} />
              )}

              <div>
                <label className="block text-sm font-medium mb-1">
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
                <label className="block text-sm font-medium mb-1">
                  Department
                </label>
                <select
                  value={formData.department_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      department_id: e.target.value,
                      batch_id: "",
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
                <label className="block text-sm font-medium mb-1">Batch</label>
                <select
                  value={formData.batch_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      batch_id: e.target.value,
                      semester_id: "",
                    })
                  }
                  required
                  disabled={!formData.department_id}
                  className="w-full px-2 py-1.5 md:px-3 md:py-2 rounded-lg text-xs md:text-sm outline-none disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--bg-main)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                >
                  <option value="">
                    {formData.department_id
                      ? "Select Batch"
                      : "Select Dept First"}
                  </option>
                  {batches
                    ?.filter((b) => b.department_id === formData.department_id)
                    .map((batch) => (
                      <option key={batch.id} value={batch.id}>
                        {batch.start_year} Batch{" "}
                        {batch.name ? `- ${batch.name}` : ""}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Semester
                </label>
                <select
                  value={formData.semester_id}
                  onChange={(e) =>
                    setFormData({ ...formData, semester_id: e.target.value })
                  }
                  required
                  disabled={!formData.batch_id}
                  className="w-full px-2 py-1.5 md:px-3 md:py-2 rounded-lg text-xs md:text-sm outline-none disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--bg-main)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                >
                  <option value="">
                    {formData.batch_id
                      ? "Select Semester"
                      : "Select Batch First"}
                  </option>
                  {filteredFormSemesters
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
                  className="flex-1 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium"
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
                  disabled={!canCreateSection || createMutation.isPending}
                  className="flex-1 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium text-white disabled:opacity-50"
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

      {/* Promote Modal */}
      {isPromoteModalOpen && (
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
                Promote Semester
              </h3>
              <button
                onClick={() => setIsPromoteModalOpen(false)}
                style={{ color: "var(--text-muted)" }}
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
              Move all students from one semester to the next. Old sections will
              be archived and new sections will be created.
            </p>
            <form onSubmit={handlePromoteSubmit} className="space-y-4">
              {promoteError && (
                <AlertMessage type="error" message={promoteError} />
              )}

              <div>
                <label className="block text-sm font-medium mb-1">
                  Department
                </label>
                <select
                  value={promoteData.department_id}
                  onChange={(e) =>
                    setPromoteData({
                      ...promoteData,
                      department_id: e.target.value,
                      batch_id: "",
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
                <label className="block text-sm font-medium mb-1">Batch</label>
                <select
                  value={promoteData.batch_id}
                  onChange={(e) =>
                    setPromoteData({
                      ...promoteData,
                      batch_id: e.target.value,
                      from_semester_id: "",
                      to_semester_id: "",
                    })
                  }
                  required
                  disabled={!promoteData.department_id}
                  className="w-full px-2 py-1.5 md:px-3 md:py-2 rounded-lg text-xs md:text-sm outline-none disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--bg-main)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                >
                  <option value="">
                    {promoteData.department_id
                      ? "Select Batch"
                      : "Select Dept First"}
                  </option>
                  {filteredPromoteBatches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.start_year} Batch
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  From Semester
                </label>
                <select
                  value={promoteData.from_semester_id}
                  onChange={(e) =>
                    setPromoteData({
                      ...promoteData,
                      from_semester_id: e.target.value,
                      to_semester_id: "",
                    })
                  }
                  required
                  disabled={!promoteData.batch_id}
                  className="w-full px-2 py-1.5 md:px-3 md:py-2 rounded-lg text-xs md:text-sm outline-none disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--bg-main)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                >
                  <option value="">
                    {promoteData.batch_id
                      ? "Select Source Semester"
                      : "Select Batch First"}
                  </option>
                  {filteredPromoteSemesters
                    .filter((s) => s.number < 8)
                    .sort((a, b) => a.number - b.number)
                    .map((sem) => (
                      <option key={sem.id} value={sem.id}>
                        Semester {sem.number}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
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
                  className="w-full px-2 py-1.5 md:px-3 md:py-2 rounded-lg text-xs md:text-sm outline-none disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--bg-main)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                >
                  <option value="">
                    {promoteData.from_semester_id
                      ? "Select Target Semester"
                      : "Select Source First"}
                  </option>
                  {filteredPromoteSemesters
                    .filter((s) => {
                      const fromSem = filteredPromoteSemesters.find(
                        (fs) => fs.id === promoteData.from_semester_id,
                      );
                      return fromSem && s.number > fromSem.number;
                    })
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
                  onClick={() => setIsPromoteModalOpen(false)}
                  className="flex-1 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium"
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
                  className="flex-1 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium text-white disabled:opacity-50"
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
        onClose={() => setDeleteConfirm({ isOpen: false, id: null, name: "" })}
        onConfirm={confirmDelete}
        title="Delete Section"
        message={`Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={deleteMutation.isPending}
      />

      {/* Archive Confirmation Modal */}
      <ConfirmModal
        isOpen={archiveConfirm.isOpen}
        onClose={() => setArchiveConfirm({ isOpen: false, id: null, name: "" })}
        onConfirm={confirmArchive}
        title="Archive Section"
        message={`Are you sure you want to archive "${archiveConfirm.name}"? Archived sections can be viewed in the Archived tab and restored later.`}
        confirmText="Archive"
        cancelText="Cancel"
        type="warning"
        isLoading={archiveMutation.isPending}
      />
    </div>
  );
};

export default Sections;
