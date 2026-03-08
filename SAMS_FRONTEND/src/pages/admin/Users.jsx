import { useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineX,
  HiOutlineUpload,
  HiOutlineCheckCircle,
  HiOutlineBan,
  HiOutlinePhotograph,
  HiOutlineUser,
  HiOutlineEye,
} from "react-icons/hi";
import PasswordField from "../../components/common/PasswordField";
import { isPasswordValid, validatePassword } from "../../utils/validation";
import {
  getAllUsers,
  createStudent,
  createTeacher,
  createAdmin,
  activateUser,
  deactivateUser,
  bulkCreateStudents,
  bulkCreateTeachers,
  getAllSections,
  getAllBatches,
  getAllDepartments,
  getAllSemesters,
} from "../../api/admin.api";
import AlertMessage from "../../components/common/AlertMessage";
import ConfirmModal from "../../components/common/ConfirmModal";
import Pagination from "../../components/common/Pagination";
import CascadingFilters from "../../components/common/CascadingFilters";

const Users = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [academicFilters, setAcademicFilters] = useState({
    department_id: "",
    batch_id: "",
    semester_id: "",
    section_id: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("student"); // student, teacher, admin, bulk-student, bulk-teacher
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkDepartmentId, setBulkDepartmentId] = useState(""); // For bulk student upload
  const [bulkSectionId, setBulkSectionId] = useState(""); // For bulk student upload
  const [bulkBatchId, setBulkBatchId] = useState(""); // For bulk student upload
  const [studentPhoto, setStudentPhoto] = useState(null);
  const [teacherPhoto, setTeacherPhoto] = useState(null);
  const [adminPhoto, setAdminPhoto] = useState(null);
  const [studentPhotoPreview, setStudentPhotoPreview] = useState(null);
  const [teacherPhotoPreview, setTeacherPhotoPreview] = useState(null);
  const [adminPhotoPreview, setAdminPhotoPreview] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [bulkResult, setBulkResult] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    user: null,
  });
  const studentPhotoRef = useRef(null);
  const teacherPhotoRef = useRef(null);
  const adminPhotoRef = useRef(null);

  // Student form
  const [studentForm, setStudentForm] = useState({
    fullname: "",
    email: "",
    password: "",
    phone_number: "",
    roll_no: "",
    registration_no: "",
    section_id: "",
    batch_id: "",
  });

  // Teacher form
  const [teacherForm, setTeacherForm] = useState({
    fullname: "",
    email: "",
    password: "",
    phone_number: "",
    designation: "",
  });

  // Admin form
  const [adminForm, setAdminForm] = useState({
    fullname: "",
    email: "",
    password: "",
    phone_number: "",
  });

  const [page, setPage] = useState(1);

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(1);
  };

  const handleRoleFilterChange = (value) => {
    setRoleFilter(value);
    setPage(1);
  };

  const handleAcademicFilterChange = (newFilters) => {
    setAcademicFilters(newFilters);
    // When academic filters are applied, force role to STUDENT
    if (
      newFilters.department_id ||
      newFilters.batch_id ||
      newFilters.semester_id ||
      newFilters.section_id
    ) {
      setRoleFilter("STUDENT");
    }
    setPage(1);
  };

  // Build query params with academic filters
  const queryParams = {
    search,
    role: roleFilter,
    page,
    limit: 20,
    ...(academicFilters.department_id && {
      department_id: academicFilters.department_id,
    }),
    ...(academicFilters.batch_id && { batch_id: academicFilters.batch_id }),
    ...(academicFilters.semester_id && {
      semester_id: academicFilters.semester_id,
    }),
    ...(academicFilters.section_id && {
      section_id: academicFilters.section_id,
    }),
  };

  // Fetch data
  const { data: usersData, isLoading } = useQuery({
    queryKey: ["users", queryParams],
    queryFn: () => getAllUsers(queryParams),
    select: (res) => ({ data: res.data.data, pagination: res.data.pagination }),
  });
  const users = usersData?.data;
  const usersPagination = usersData?.pagination;

  const { data: sections } = useQuery({
    queryKey: ["sections"],
    queryFn: () => getAllSections({ limit: 100 }),
    select: (res) => res.data.data,
  });

  const { data: batches } = useQuery({
    queryKey: ["batches"],
    queryFn: () => getAllBatches({ limit: 100 }),
    select: (res) => res.data.data,
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: () => getAllDepartments({ limit: 100 }),
    select: (res) => res.data.data,
  });

  const { data: semesters } = useQuery({
    queryKey: ["semesters"],
    queryFn: () => getAllSemesters({ limit: 100 }),
    select: (res) => res.data.data,
  });

  // Filter sections based on selected department
  const filteredSections = useMemo(() => {
    if (!sections) return [];
    let filtered = sections;
    if (bulkDepartmentId) {
      filtered = filtered.filter(
        (section) => section.department_id === bulkDepartmentId,
      );
    }
    if (bulkBatchId) {
      filtered = filtered.filter((section) => section.batch_id === bulkBatchId);
    }
    return filtered;
  }, [bulkDepartmentId, bulkBatchId, sections]);

  // Filter batches based on selected department
  const filteredBatches = useMemo(() => {
    if (!bulkDepartmentId || !batches) return batches || [];
    return batches.filter((batch) => batch.department_id === bulkDepartmentId);
  }, [bulkDepartmentId, batches]);

  // Mutations
  const createStudentMutation = useMutation({
    mutationFn: createStudent,
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      setSuccessMessage("Student created successfully!");
      setTimeout(() => {
        closeModal();
        setSuccessMessage("");
      }, 1500);
    },
    onError: (error) => {
      setErrorMessage(
        error.response?.data?.message || "Failed to create student",
      );
    },
  });

  const createTeacherMutation = useMutation({
    mutationFn: createTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      setSuccessMessage("Teacher created successfully!");
      setTimeout(() => {
        closeModal();
        setSuccessMessage("");
      }, 1500);
    },
    onError: (error) => {
      setErrorMessage(
        error.response?.data?.message || "Failed to create teacher",
      );
    },
  });

  const createAdminMutation = useMutation({
    mutationFn: createAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      setSuccessMessage("Admin created successfully!");
      setTimeout(() => {
        closeModal();
        setSuccessMessage("");
      }, 1500);
    },
    onError: (error) => {
      setErrorMessage(
        error.response?.data?.message || "Failed to create admin",
      );
    },
  });

  const bulkStudentMutation = useMutation({
    mutationFn: bulkCreateStudents,
    onSuccess: (res) => {
      queryClient.invalidateQueries(["users"]);
      const result = res.data?.data;
      const createdCount = result?.created?.length || 0;
      const errorsCount = result?.errors?.length || 0;

      if (createdCount > 0) {
        setSuccessMessage(
          `${createdCount} student(s) created successfully!${errorsCount > 0 ? ` ${errorsCount} failed.` : ""}`,
        );
      } else if (errorsCount > 0) {
        setErrorMessage(
          `${errorsCount} students failed to create. Download error CSV for details.`,
        );
      } else {
        setErrorMessage(
          "No students were created. Please check the file format.",
        );
      }

      // Store result for download
      if (result?.errors?.length > 0) {
        setBulkResult(result);
      }

      setTimeout(() => {
        if (createdCount > 0 && errorsCount === 0) {
          closeModal();
          setSuccessMessage("");
          setErrorMessage("");
          setBulkResult(null);
        }
      }, 5000);
    },
    onError: (error) => {
      setErrorMessage(
        error.response?.data?.message || "Failed to bulk create students",
      );
    },
  });

  const bulkTeacherMutation = useMutation({
    mutationFn: bulkCreateTeachers,
    onSuccess: (res) => {
      queryClient.invalidateQueries(["users"]);
      const result = res.data?.data;
      const createdCount = result?.created?.length || 0;
      const errorsCount = result?.errors?.length || 0;

      if (createdCount > 0) {
        setSuccessMessage(
          `${createdCount} teacher(s) created successfully!${errorsCount > 0 ? ` ${errorsCount} failed.` : ""}`,
        );
      } else if (errorsCount > 0) {
        setErrorMessage(
          `${errorsCount} teachers failed to create. Download error CSV for details.`,
        );
      } else {
        setErrorMessage(
          "No teachers were created. Please check the file format.",
        );
      }

      // Store result for download
      if (result?.errors?.length > 0) {
        setBulkResult(result);
      }

      setTimeout(() => {
        if (createdCount > 0 && errorsCount === 0) {
          closeModal();
          setSuccessMessage("");
          setErrorMessage("");
          setBulkResult(null);
        }
      }, 5000);
    },
    onError: (error) => {
      setErrorMessage(
        error.response?.data?.message || "Failed to bulk create teachers",
      );
    },
  });

  const activateMutation = useMutation({
    mutationFn: activateUser,
    onSuccess: () => queryClient.invalidateQueries(["users"]),
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateUser,
    onSuccess: () => queryClient.invalidateQueries(["users"]),
  });

  const handlePhotoChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === "student") {
          setStudentPhoto(file);
          setStudentPhotoPreview(reader.result);
        } else if (type === "teacher") {
          setTeacherPhoto(file);
          setTeacherPhotoPreview(reader.result);
        } else {
          setAdminPhoto(file);
          setAdminPhotoPreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const openModal = (type) => {
    setModalType(type);
    setErrorMessage("");
    setSuccessMessage("");
    setStudentForm({
      fullname: "",
      email: "",
      password: "",
      phone_number: "",
      roll_no: "",
      registration_no: "",
      section_id: "",
      batch_id: "",
    });
    setTeacherForm({
      fullname: "",
      email: "",
      password: "",
      phone_number: "",
      designation: "",
    });
    setAdminForm({
      fullname: "",
      email: "",
      password: "",
      phone_number: "",
    });
    setBulkFile(null);
    setBulkSectionId("");
    setBulkBatchId("");
    setStudentPhoto(null);
    setTeacherPhoto(null);
    setAdminPhoto(null);
    setStudentPhotoPreview(null);
    setTeacherPhotoPreview(null);
    setAdminPhotoPreview(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setBulkFile(null);
    setBulkSectionId("");
    setBulkBatchId("");
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleStudentSubmit = (e) => {
    e.preventDefault();
    if (!isPasswordValid(validatePassword(studentForm.password))) {
      setErrorMessage("Please fulfill all password requirements");
      return;
    }
    const formData = new FormData();
    Object.keys(studentForm).forEach((key) => {
      if (studentForm[key]) formData.append(key, studentForm[key]);
    });
    if (studentPhoto) formData.append("photo", studentPhoto);
    createStudentMutation.mutate(formData);
  };

  const handleTeacherSubmit = (e) => {
    e.preventDefault();
    if (!isPasswordValid(validatePassword(teacherForm.password))) {
      setErrorMessage("Please fulfill all password requirements");
      return;
    }
    const formData = new FormData();
    Object.keys(teacherForm).forEach((key) => {
      if (teacherForm[key]) formData.append(key, teacherForm[key]);
    });
    if (teacherPhoto) formData.append("photo", teacherPhoto);
    createTeacherMutation.mutate(formData);
  };

  const handleAdminSubmit = (e) => {
    e.preventDefault();
    if (!isPasswordValid(validatePassword(adminForm.password))) {
      setErrorMessage("Please fulfill all password requirements");
      return;
    }
    const formData = new FormData();
    Object.keys(adminForm).forEach((key) => {
      if (adminForm[key]) formData.append(key, adminForm[key]);
    });
    if (adminPhoto) formData.append("photo", adminPhoto);
    createAdminMutation.mutate(formData);
  };

  const handleBulkSubmit = (e) => {
    e.preventDefault();
    if (!bulkFile) {
      setErrorMessage("Please select a CSV file to upload");
      return;
    }
    const formData = new FormData();
    formData.append("file", bulkFile);
    if (modalType === "bulk-student") {
      if (!bulkSectionId) {
        setErrorMessage("Please select a section for the students");
        return;
      }
      if (!bulkBatchId) {
        setErrorMessage("Please select a batch for the students");
        return;
      }
      formData.append("section_id", bulkSectionId);
      formData.append("batch_id", bulkBatchId);
      bulkStudentMutation.mutate(formData);
    } else {
      bulkTeacherMutation.mutate(formData);
    }
  };

  const handleToggleStatus = (user) => {
    setConfirmModal({
      isOpen: true,
      user,
      action: user.is_active ? "deactivate" : "activate",
    });
  };

  const confirmToggleStatus = () => {
    if (confirmModal.user) {
      if (confirmModal.action === "deactivate") {
        deactivateMutation.mutate(confirmModal.user.id);
      } else {
        activateMutation.mutate(confirmModal.user.id);
      }
    }
    setConfirmModal({ isOpen: false, user: null });
  };

  const downloadErrorCSV = () => {
    if (!bulkResult?.errors) return;

    const csvContent = [
      ["Row", "Error"],
      ...bulkResult.errors.map((error) => [error.row, error.error]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "bulk_upload_errors.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRoleBadge = (role) => {
    const styles = {
      ADMIN: { bg: "#DBEAFE", color: "#1E3A8A" },
      TEACHER: { bg: "#D1FAE5", color: "#065F46" },
      STUDENT: { bg: "#FEF3C7", color: "#92400E" },
    };
    return styles[role] || styles.STUDENT;
  };

  const isPending =
    createStudentMutation.isPending ||
    createTeacherMutation.isPending ||
    createAdminMutation.isPending ||
    bulkStudentMutation.isPending ||
    bulkTeacherMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1
            className="text-xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Users
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Manage system users
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => openModal("student")}
            className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: "var(--primary)" }}
          >
            <HiOutlinePlus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Student</span>
            <span className="sm:hidden">Student</span>
          </button>
          <button
            onClick={() => openModal("teacher")}
            className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: "#065F46" }}
          >
            <HiOutlinePlus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Teacher</span>
            <span className="sm:hidden">Teacher</span>
          </button>
          <button
            onClick={() => openModal("admin")}
            className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: "#7C3AED" }}
          >
            <HiOutlinePlus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Admin</span>
            <span className="sm:hidden">Admin</span>
          </button>
          <button
            onClick={() => openModal("bulk-student")}
            className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors"
            style={{
              backgroundColor: "var(--bg-main)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
            }}
          >
            <HiOutlineUpload className="w-4 h-4" />
            <span className="hidden sm:inline">Bulk Students</span>
            <span className="sm:hidden">Bulk S</span>
          </button>
          <button
            onClick={() => openModal("bulk-teacher")}
            className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors"
            style={{
              backgroundColor: "var(--bg-main)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
            }}
          >
            <HiOutlineUpload className="w-4 h-4" />
            <span className="hidden sm:inline">Bulk Teachers</span>
            <span className="sm:hidden">Bulk T</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div
        className="rounded-xl p-4 shadow-sm space-y-4"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="flex flex-wrap gap-4 items-end">
          <div className="relative flex-1 min-w-50">
            <HiOutlineSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm outline-none"
              style={{
                backgroundColor: "var(--bg-main)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => handleRoleFilterChange(e.target.value)}
            disabled={
              academicFilters.department_id ||
              academicFilters.batch_id ||
              academicFilters.semester_id ||
              academicFilters.section_id
            }
            className="px-2 py-1.5 md:px-3 md:py-2 rounded-lg text-xs md:text-sm outline-none min-w-35 disabled:opacity-50"
            style={{
              backgroundColor: "var(--bg-main)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          >
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="TEACHER">Teacher</option>
            <option value="STUDENT">Student</option>
          </select>
        </div>

        {/* Academic Cascading Filters */}
        <CascadingFilters
          value={academicFilters}
          onChange={handleAcademicFilterChange}
          departments={departments || []}
          batches={batches || []}
          semesters={semesters || []}
          sections={sections || []}
          showSection={true}
          showLabels={true}
          required={{
            department: false,
            batch: false,
            semester: false,
            section: false,
          }}
          placeholders={{
            department: "All Departments",
            batch: "All Batches",
            semester: "All Semesters",
            section: "All Sections",
          }}
        />
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
                  Name
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium"
                  style={{ color: "var(--primary)" }}
                >
                  Email
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium"
                  style={{ color: "var(--primary)" }}
                >
                  Role
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium"
                  style={{ color: "var(--primary)" }}
                >
                  Status
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
              ) : users?.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-4 py-8 text-center text-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    No users found
                  </td>
                </tr>
              ) : (
                users?.map((user) => {
                  const badge = getRoleBadge(user.role);
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td
                        className="px-4 py-3 text-sm font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {user.fullname}
                      </td>
                      <td
                        className="px-4 py-3 text-sm email-cell"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {user.email}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: badge.bg,
                            color: badge.color,
                          }}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: user.is_active
                              ? "#D1FAE5"
                              : "#FEE2E2",
                            color: user.is_active ? "#065F46" : "#991B1B",
                          }}
                        >
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/admin/users/${user.id}`)}
                            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                            title="View Details"
                            style={{ color: "var(--primary)" }}
                          >
                            <HiOutlineEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user)}
                            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                            title={user.is_active ? "Deactivate" : "Activate"}
                            style={{
                              color: user.is_active
                                ? "var(--danger)"
                                : "var(--status-present)",
                            }}
                          >
                            {user.is_active ? (
                              <HiOutlineBan className="w-4 h-4" />
                            ) : (
                              <HiOutlineCheckCircle className="w-4 h-4" />
                            )}
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
        <Pagination pagination={usersPagination} onPageChange={setPage} />
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
                {modalType === "student" && "Add Student"}
                {modalType === "teacher" && "Add Teacher"}
                {modalType === "admin" && "Add Admin"}
                {modalType === "bulk-student" && "Bulk Upload Students"}
                {modalType === "bulk-teacher" && "Bulk Upload Teachers"}
              </h3>
              <button
                onClick={closeModal}
                style={{ color: "var(--text-muted)" }}
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            {/* Student Form */}
            {modalType === "student" && (
              <form onSubmit={handleStudentSubmit} className="space-y-4">
                {/* Photo Upload */}
                <div className="flex justify-center">
                  <div className="relative">
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden cursor-pointer"
                      style={{
                        backgroundColor: "var(--bg-main)",
                        border: "2px dashed var(--border)",
                      }}
                      onClick={() => studentPhotoRef.current?.click()}
                    >
                      {studentPhotoPreview ? (
                        <img
                          src={studentPhotoPreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <HiOutlineUser
                          className="w-10 h-10"
                          style={{ color: "var(--text-muted)" }}
                        />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => studentPhotoRef.current?.click()}
                      className="absolute -bottom-1 -right-1 p-1.5 rounded-full"
                      style={{
                        backgroundColor: "var(--primary)",
                        color: "white",
                      }}
                    >
                      <HiOutlinePhotograph className="w-4 h-4" />
                    </button>
                    <input
                      ref={studentPhotoRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoChange(e, "student")}
                      className="hidden"
                    />
                  </div>
                </div>
                <p
                  className="text-center text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  Click to upload photo
                </p>

                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={studentForm.fullname}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        fullname: e.target.value,
                      })
                    }
                    required
                    minLength={3}
                    className="w-full px-2 py-1.5 md:px-3 md:py-2 rounded-lg text-xs md:text-sm outline-none disabled:opacity-50"
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
                    Email *
                  </label>
                  <input
                    type="email"
                    value={studentForm.email}
                    onChange={(e) =>
                      setStudentForm({ ...studentForm, email: e.target.value })
                    }
                    required
                    className="w-full px-2 py-1.5 md:px-3 md:py-2 rounded-lg text-xs md:text-sm outline-none disabled:opacity-50"
                    style={{
                      backgroundColor: "var(--bg-main)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
                <PasswordField
                  label="Password"
                  name="password"
                  value={studentForm.password}
                  onChange={(e) =>
                    setStudentForm({ ...studentForm, password: e.target.value })
                  }
                  placeholder="Create a password"
                  required
                  showRequirements
                />
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    value={studentForm.phone_number}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        phone_number: e.target.value,
                      })
                    }
                    required
                    placeholder="98XXXXXXXX"
                    className="w-full px-2 py-1.5 md:px-3 md:py-2 rounded-lg text-xs md:text-sm outline-none disabled:opacity-50"
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
                    Roll Number *
                  </label>
                  <input
                    type="text"
                    value={studentForm.roll_no}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        roll_no: e.target.value,
                      })
                    }
                    required
                    className="w-full px-2 py-1.5 md:px-3 md:py-2 rounded-lg text-xs md:text-sm outline-none disabled:opacity-50"
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
                    Registration Number
                  </label>
                  <input
                    type="text"
                    value={studentForm.registration_no}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        registration_no: e.target.value,
                      })
                    }
                    className="w-full px-2 py-1.5 md:px-3 md:py-2 rounded-lg text-xs md:text-sm outline-none disabled:opacity-50"
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
                    Batch *
                  </label>
                  <select
                    value={studentForm.batch_id}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        batch_id: e.target.value,
                        section_id: "", // Reset section when batch changes
                      })
                    }
                    required
                    className="w-full px-2 py-1.5 md:px-3 md:py-2 rounded-lg text-xs md:text-sm outline-none disabled:opacity-50"
                    style={{
                      backgroundColor: "var(--bg-main)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <option value="">Select Batch</option>
                    {batches?.map((batch) => (
                      <option key={batch.id} value={batch.id}>
                        {batch.department?.name} - {batch.start_year} Batch
                        {batch.name ? ` (${batch.name})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Section *
                  </label>
                  <select
                    value={studentForm.section_id}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        section_id: e.target.value,
                      })
                    }
                    required
                    disabled={!studentForm.batch_id}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none disabled:opacity-50"
                    style={{
                      backgroundColor: "var(--bg-main)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <option value="">
                      {studentForm.batch_id
                        ? "Select Section"
                        : "Select Batch First"}
                    </option>
                    {sections
                      ?.filter((section) => {
                        const selectedBatch = batches?.find(
                          (b) => b.id === studentForm.batch_id,
                        );
                        return (
                          selectedBatch &&
                          section.department_id ===
                            selectedBatch.department_id &&
                          section.batch_id === studentForm.batch_id
                        );
                      })
                      .map((section) => (
                        <option key={section.id} value={section.id}>
                          {section.name} (Sem {section.semester?.number})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Error near submit button */}
                {errorMessage && (
                  <AlertMessage
                    type="error"
                    message={errorMessage}
                    onClose={() => setErrorMessage("")}
                  />
                )}

                {/* Success near submit button */}
                {successMessage && (
                  <AlertMessage type="success" message={successMessage} />
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
                    disabled={isPending}
                    className="flex-1 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium text-white transition-colors disabled:opacity-50"
                    style={{ backgroundColor: "var(--primary)" }}
                  >
                    {isPending ? "Creating..." : "Create Student"}
                  </button>
                </div>
              </form>
            )}

            {/* Teacher Form */}
            {modalType === "teacher" && (
              <form onSubmit={handleTeacherSubmit} className="space-y-4">
                {/* Photo Upload */}
                <div className="flex justify-center">
                  <div className="relative">
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden cursor-pointer"
                      style={{
                        backgroundColor: "var(--bg-main)",
                        border: "2px dashed var(--border)",
                      }}
                      onClick={() => teacherPhotoRef.current?.click()}
                    >
                      {teacherPhotoPreview ? (
                        <img
                          src={teacherPhotoPreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <HiOutlineUser
                          className="w-10 h-10"
                          style={{ color: "var(--text-muted)" }}
                        />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => teacherPhotoRef.current?.click()}
                      className="absolute -bottom-1 -right-1 p-1.5 rounded-full"
                      style={{
                        backgroundColor: "#065F46",
                        color: "white",
                      }}
                    >
                      <HiOutlinePhotograph className="w-4 h-4" />
                    </button>
                    <input
                      ref={teacherPhotoRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoChange(e, "teacher")}
                      className="hidden"
                    />
                  </div>
                </div>
                <p
                  className="text-center text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  Click to upload photo
                </p>

                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={teacherForm.fullname}
                    onChange={(e) =>
                      setTeacherForm({
                        ...teacherForm,
                        fullname: e.target.value,
                      })
                    }
                    required
                    minLength={3}
                    className="w-full px-2 py-1.5 md:px-3 md:py-2 rounded-lg text-xs md:text-sm outline-none disabled:opacity-50"
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
                    Email *
                  </label>
                  <input
                    type="email"
                    value={teacherForm.email}
                    onChange={(e) =>
                      setTeacherForm({ ...teacherForm, email: e.target.value })
                    }
                    required
                    className="w-full px-2 py-1.5 md:px-3 md:py-2 rounded-lg text-xs md:text-sm outline-none disabled:opacity-50"
                    style={{
                      backgroundColor: "var(--bg-main)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
                <PasswordField
                  label="Password"
                  name="password"
                  value={teacherForm.password}
                  onChange={(e) =>
                    setTeacherForm({ ...teacherForm, password: e.target.value })
                  }
                  placeholder="Create a password"
                  required
                  showRequirements
                />
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    value={teacherForm.phone_number}
                    onChange={(e) =>
                      setTeacherForm({
                        ...teacherForm,
                        phone_number: e.target.value,
                      })
                    }
                    required
                    placeholder="98XXXXXXXX"
                    className="w-full px-2 py-1.5 md:px-3 md:py-2 rounded-lg text-xs md:text-sm outline-none disabled:opacity-50"
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
                    Designation *
                  </label>
                  <input
                    type="text"
                    value={teacherForm.designation}
                    onChange={(e) =>
                      setTeacherForm({
                        ...teacherForm,
                        designation: e.target.value,
                      })
                    }
                    required
                    minLength={2}
                    placeholder="e.g., Professor, Lecturer"
                    className="w-full px-2 py-1.5 md:px-3 md:py-2 rounded-lg text-xs md:text-sm outline-none disabled:opacity-50"
                    style={{
                      backgroundColor: "var(--bg-main)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>

                {/* Error near submit button */}
                {errorMessage && (
                  <AlertMessage
                    type="error"
                    message={errorMessage}
                    onClose={() => setErrorMessage("")}
                  />
                )}

                {/* Success near submit button */}
                {successMessage && (
                  <AlertMessage type="success" message={successMessage} />
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
                    disabled={isPending}
                    className="flex-1 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium text-white transition-colors disabled:opacity-50"
                    style={{ backgroundColor: "#065F46" }}
                  >
                    {isPending ? "Creating..." : "Create Teacher"}
                  </button>
                </div>
              </form>
            )}

            {/* Admin Form */}
            {modalType === "admin" && (
              <form onSubmit={handleAdminSubmit} className="space-y-4">
                {/* Photo Upload */}
                <div className="flex justify-center">
                  <div className="relative">
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden cursor-pointer"
                      style={{
                        backgroundColor: "var(--bg-main)",
                        border: "2px dashed var(--border)",
                      }}
                      onClick={() => adminPhotoRef.current?.click()}
                    >
                      {adminPhotoPreview ? (
                        <img
                          src={adminPhotoPreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <HiOutlineUser
                          className="w-10 h-10"
                          style={{ color: "var(--text-muted)" }}
                        />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => adminPhotoRef.current?.click()}
                      className="absolute -bottom-1 -right-1 p-1.5 rounded-full"
                      style={{
                        backgroundColor: "#7C3AED",
                        color: "white",
                      }}
                    >
                      <HiOutlinePhotograph className="w-4 h-4" />
                    </button>
                    <input
                      ref={adminPhotoRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoChange(e, "admin")}
                      className="hidden"
                    />
                  </div>
                </div>
                <p
                  className="text-center text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  Click to upload photo
                </p>

                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={adminForm.fullname}
                    onChange={(e) =>
                      setAdminForm({ ...adminForm, fullname: e.target.value })
                    }
                    required
                    minLength={3}
                    className="w-full px-2 py-1.5 md:px-3 md:py-2 rounded-lg text-xs md:text-sm outline-none disabled:opacity-50"
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
                    Email *
                  </label>
                  <input
                    type="email"
                    value={adminForm.email}
                    onChange={(e) =>
                      setAdminForm({ ...adminForm, email: e.target.value })
                    }
                    required
                    className="w-full px-2 py-1.5 md:px-3 md:py-2 rounded-lg text-xs md:text-sm outline-none disabled:opacity-50"
                    style={{
                      backgroundColor: "var(--bg-main)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
                <PasswordField
                  label="Password"
                  name="password"
                  value={adminForm.password}
                  onChange={(e) =>
                    setAdminForm({ ...adminForm, password: e.target.value })
                  }
                  placeholder="Create a password"
                  required
                  showRequirements
                />
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    value={adminForm.phone_number}
                    onChange={(e) =>
                      setAdminForm({
                        ...adminForm,
                        phone_number: e.target.value,
                      })
                    }
                    placeholder="98XXXXXXXX"
                    className="w-full px-2 py-1.5 md:px-3 md:py-2 rounded-lg text-xs md:text-sm outline-none disabled:opacity-50"
                    style={{
                      backgroundColor: "var(--bg-main)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>

                {/* Error near submit button */}
                {errorMessage && (
                  <AlertMessage
                    type="error"
                    message={errorMessage}
                    onClose={() => setErrorMessage("")}
                  />
                )}

                {/* Success near submit button */}
                {successMessage && (
                  <AlertMessage type="success" message={successMessage} />
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
                    disabled={isPending}
                    className="flex-1 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium text-white transition-colors disabled:opacity-50"
                    style={{ backgroundColor: "#7C3AED" }}
                  >
                    {isPending ? "Creating..." : "Create Admin"}
                  </button>
                </div>
              </form>
            )}

            {/* Bulk Upload Form */}
            {(modalType === "bulk-student" || modalType === "bulk-teacher") && (
              <form onSubmit={handleBulkSubmit} className="space-y-4">
                {modalType === "bulk-student" && (
                  <>
                    <div>
                      <label
                        className="block text-sm font-medium mb-1"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Select Department *
                      </label>
                      <select
                        value={bulkDepartmentId}
                        onChange={(e) => {
                          setBulkDepartmentId(e.target.value);
                          // Reset batch and section when department changes
                          setBulkBatchId("");
                          setBulkSectionId("");
                        }}
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
                      <p
                        className="text-xs mt-1"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Select the department first to filter batches and
                        sections
                      </p>
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium mb-1"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Select Batch *
                      </label>
                      <select
                        value={bulkBatchId}
                        onChange={(e) => {
                          setBulkBatchId(e.target.value);
                          // Reset section when batch changes
                          setBulkSectionId("");
                        }}
                        required
                        disabled={!bulkDepartmentId}
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor: "var(--bg-main)",
                          border: "1px solid var(--border)",
                          color: "var(--text-primary)",
                        }}
                      >
                        <option value="">
                          {!bulkDepartmentId
                            ? "Select department first"
                            : filteredBatches?.length === 0
                              ? "No batches available"
                              : "Select Batch"}
                        </option>
                        {filteredBatches?.map((batch) => (
                          <option key={batch.id} value={batch.id}>
                            {batch.name} ({batch.start_year}-{batch.end_year})
                          </option>
                        ))}
                      </select>
                      <p
                        className="text-xs mt-1"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {bulkDepartmentId
                          ? `Showing batches from ${departments?.find((d) => d.id === bulkDepartmentId)?.name || "selected department"} only`
                          : "All students in the CSV will be assigned to this batch"}
                      </p>
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium mb-1"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Select Section *
                      </label>
                      <select
                        value={bulkSectionId}
                        onChange={(e) => setBulkSectionId(e.target.value)}
                        required
                        disabled={!bulkBatchId}
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor: "var(--bg-main)",
                          border: "1px solid var(--border)",
                          color: "var(--text-primary)",
                        }}
                      >
                        <option value="">
                          {!bulkBatchId
                            ? "Select batch first"
                            : filteredSections?.length === 0
                              ? "No sections available"
                              : "Select Section"}
                        </option>
                        {filteredSections?.map((section) => (
                          <option key={section.id} value={section.id}>
                            {section.name} - Sem {section.semester?.number}
                          </option>
                        ))}
                      </select>
                      <p
                        className="text-xs mt-1"
                        style={{ color: "var(--text-muted)" }}
                      >
                        All students in the CSV will be assigned to this section
                      </p>
                    </div>
                  </>
                )}
                <div
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: "var(--primary-subtle)",
                    border: "1px solid var(--primary)",
                  }}
                >
                  <p className="text-sm" style={{ color: "var(--primary)" }}>
                    <strong>CSV Format Required:</strong>
                  </p>
                  <p
                    className="text-xs mt-1 font-mono"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {modalType === "bulk-student"
                      ? "fullname, email, password, phone_number, roll_no, registration_no, photo_url"
                      : "fullname, email, password, phone_number, designation, photo_url"}
                  </p>
                  <p
                    className="text-xs mt-2"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <strong>Note:</strong> photo_url is optional. You can
                    provide a URL to an image or leave it empty.
                  </p>
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Upload CSV File *
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setBulkFile(e.target.files[0])}
                    required
                    className="w-full px-2 py-1.5 md:px-3 md:py-2 rounded-lg text-xs md:text-sm outline-none disabled:opacity-50"
                    style={{
                      backgroundColor: "var(--bg-main)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>

                {/* Error near submit button */}
                {errorMessage && (
                  <AlertMessage
                    type="error"
                    message={errorMessage}
                    onClose={() => setErrorMessage("")}
                  />
                )}

                {/* Success near submit button */}
                {successMessage && (
                  <AlertMessage type="success" message={successMessage} />
                )}

                {/* Result Summary */}
                {bulkResult && (
                  <div
                    className="flex items-center justify-between p-3 rounded-lg text-sm"
                    style={{ backgroundColor: "var(--primary-subtle)" }}
                  >
                    <div className="flex items-center gap-4">
                      <span style={{ color: "var(--status-present)" }}>
                        ✓ {bulkResult.created?.length || 0} created
                      </span>
                      {bulkResult.errors?.length > 0 && (
                        <span style={{ color: "var(--danger)" }}>
                          ✗ {bulkResult.errors.length} failed
                        </span>
                      )}
                    </div>
                    {bulkResult.errors?.length > 0 && (
                      <button
                        onClick={downloadErrorCSV}
                        className="text-xs px-2 py-1 rounded transition-colors"
                        style={{
                          backgroundColor: "var(--danger)",
                          color: "white",
                        }}
                      >
                        Download Errors
                      </button>
                    )}
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
                    disabled={isPending || !bulkFile}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: isPending
                        ? "var(--status-present)"
                        : "var(--primary)",
                    }}
                  >
                    {isPending && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {isPending ? "Uploading..." : "Upload"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Confirm Modal for Activate/Deactivate */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, user: null })}
        onConfirm={confirmToggleStatus}
        title={
          confirmModal.action === "deactivate"
            ? "Deactivate User"
            : "Activate User"
        }
        message={
          confirmModal.action === "deactivate"
            ? `Are you sure you want to deactivate ${confirmModal.user?.fullname}? They will no longer be able to log in.`
            : `Are you sure you want to activate ${confirmModal.user?.fullname}? They will be able to log in again.`
        }
        confirmText={
          confirmModal.action === "deactivate" ? "Deactivate" : "Activate"
        }
        type={confirmModal.action === "deactivate" ? "danger" : "info"}
        isLoading={activateMutation.isPending || deactivateMutation.isPending}
      />
    </div>
  );
};

export default Users;
