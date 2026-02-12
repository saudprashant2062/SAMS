import { useState, useRef, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  HiOutlineArrowLeft,
  HiOutlinePhotograph,
  HiOutlineX,
} from "react-icons/hi";
import {
  getUserById,
  updateUser,
  getAllSections,
  getAllDepartments,
} from "../../api/admin.api";

const UserEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const photoInputRef = useRef(null);

  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    phone_number: "",
    roll_no: "",
    registration_no: "",
    section_id: "",
    designation: "",
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [filterDepartment, setFilterDepartment] = useState("");

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["user", id],
    queryFn: () => getUserById(id),
    select: (res) => res.data.data,
  });

  const { data: sections } = useQuery({
    queryKey: ["sections"],
    queryFn: () => getAllSections({ limit: 100 }),
    select: (res) => res.data.data,
    enabled: user?.role === "STUDENT",
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: () => getAllDepartments({ limit: 100 }),
    select: (res) => res.data.data,
    enabled: user?.role === "STUDENT",
  });

  // Filter sections by selected department
  const filteredSections = useMemo(() => {
    if (!sections) return [];
    if (!filterDepartment) return sections;
    return sections.filter(
      (section) => section.department_id === filterDepartment,
    );
  }, [sections, filterDepartment]);

  useEffect(() => {
    if (user) {
      setFormData({
        fullname: user.fullname || "",
        email: user.email || "",
        phone_number: user.phone_number || "",
        roll_no: user.student?.roll_no || "",
        registration_no: user.student?.registration_no || "",
        section_id: user.student?.section_id || "",
        designation: user.teacher?.designation || "",
      });
      // Set initial department filter from current section
      if (user.student?.section?.department_id) {
        setFilterDepartment(user.student.section.department_id);
      } else if (user.student?.section?.department?.id) {
        setFilterDepartment(user.student.section.department.id);
      }
      if (user.photo_url) {
        setPhotoPreview(user.photo_url);
      }
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: (data) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["user", id]);
      queryClient.invalidateQueries(["users"]);
      navigate(`/admin/users/${id}`);
    },
  });

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(user?.photo_url || null);
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    formDataToSend.append("fullname", formData.fullname);
    formDataToSend.append("email", formData.email);
    formDataToSend.append("phone_number", formData.phone_number);

    if (user.role === "STUDENT") {
      formDataToSend.append("roll_no", formData.roll_no);
      formDataToSend.append("registration_no", formData.registration_no);
      formDataToSend.append("section_id", formData.section_id);
    } else if (user.role === "TEACHER") {
      formDataToSend.append("designation", formData.designation);
    }

    if (photoFile) {
      formDataToSend.append("photo", photoFile);
    }

    updateMutation.mutate(formDataToSend);
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2"
          style={{ borderColor: "var(--primary)" }}
        ></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p style={{ color: "var(--danger)" }}>User not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/admin/users/${id}`)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            <HiOutlineArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1
              className="text-xl font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Edit User
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Update user information
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div
          className="rounded-xl p-6 shadow-sm space-y-6"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          {/* Photo Upload */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              Photo
            </label>
            <div className="flex items-center gap-4">
              {photoPreview ? (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white hover:bg-red-600"
                  >
                    <HiOutlineX className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "var(--primary-light)" }}
                >
                  <HiOutlinePhotograph
                    className="w-8 h-8"
                    style={{ color: "var(--primary)" }}
                  />
                </div>
              )}
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: "var(--bg-main)",
                  color: "var(--primary)",
                  border: "1px solid var(--border)",
                }}
              >
                Choose Photo
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="fullname"
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                Full Name *
              </label>
              <input
                id="fullname"
                type="text"
                value={formData.fullname}
                onChange={(e) =>
                  setFormData({ ...formData, fullname: e.target.value })
                }
                required
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: "var(--bg-main)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                Email *
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: "var(--bg-main)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                Phone Number *
              </label>
              <input
                id="phone"
                type="tel"
                value={formData.phone_number}
                onChange={(e) =>
                  setFormData({ ...formData, phone_number: e.target.value })
                }
                required
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: "var(--bg-main)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          </div>

          {/* Student Fields */}
          {user.role === "STUDENT" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="roll_no"
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Roll Number *
                </label>
                <input
                  id="roll_no"
                  type="text"
                  value={formData.roll_no}
                  onChange={(e) =>
                    setFormData({ ...formData, roll_no: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{
                    backgroundColor: "var(--bg-main)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
              <div>
                <label
                  htmlFor="registration_no"
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Registration Number
                </label>
                <input
                  id="registration_no"
                  type="text"
                  value={formData.registration_no}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      registration_no: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{
                    backgroundColor: "var(--bg-main)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
              <div>
                <label
                  htmlFor="filterDepartment"
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Filter by Department
                </label>
                <select
                  id="filterDepartment"
                  value={filterDepartment}
                  onChange={(e) => {
                    setFilterDepartment(e.target.value);
                    setFormData({ ...formData, section_id: "" });
                  }}
                  className="w-full px-3 py-2 rounded-lg text-sm"
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
                  htmlFor="section"
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Section *
                </label>
                <select
                  id="section"
                  value={formData.section_id}
                  onChange={(e) =>
                    setFormData({ ...formData, section_id: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{
                    backgroundColor: "var(--bg-main)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                >
                  <option value="">Select Section</option>
                  {filteredSections?.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name} - Semester {section.semester?.number} (
                      {section.department?.name})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Teacher Fields */}
          {user.role === "TEACHER" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="designation"
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Designation *
                </label>
                <input
                  id="designation"
                  type="text"
                  value={formData.designation}
                  onChange={(e) =>
                    setFormData({ ...formData, designation: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{
                    backgroundColor: "var(--bg-main)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-6 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: "var(--primary)" }}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/admin/users/${id}`)}
              className="px-6 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: "var(--bg-main)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
              }}
            >
              Cancel
            </button>
          </div>

          {updateMutation.isError && (
            <p className="text-sm" style={{ color: "var(--danger)" }}>
              Error updating user. Please try again.
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default UserEdit;
