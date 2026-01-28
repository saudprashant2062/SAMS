import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { HiOutlineEye, HiOutlineEyeOff } from "react-icons/hi";
import axiosInstance from "../../api/axiosInstance";

const changePassword = (data) => {
  return axiosInstance.patch("/auth/reset-password", data);
};

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [successMessage, setSuccessMessage] = useState("");

  const mutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setSuccessMessage("Password changed successfully!");
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setTimeout(() => setSuccessMessage(""), 3000);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      return;
    }
    mutation.mutate({
      oldPassword: formData.currentPassword,
      newPassword: formData.newPassword,
    });
  };

  const passwordsMatch =
    formData.newPassword === formData.confirmPassword ||
    formData.confirmPassword === "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1
          className="text-xl font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Change Password
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Update your account password
        </p>
      </div>

      {/* Form Card */}
      <div
        className="max-w-md rounded-xl p-6 shadow-sm"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div>
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              Current Password
            </label>
            <div className="relative">
              <input
                id="currentPassword"
                type={showPasswords.current ? "text" : "password"}
                value={formData.currentPassword}
                onChange={(e) =>
                  setFormData({ ...formData, currentPassword: e.target.value })
                }
                required
                className="w-full px-3 py-2 pr-10 rounded-lg text-sm"
                style={{
                  backgroundColor: "var(--bg-main)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords({
                    ...showPasswords,
                    current: !showPasswords.current,
                  })
                }
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-muted)" }}
              >
                {showPasswords.current ? (
                  <HiOutlineEyeOff className="w-4 h-4" />
                ) : (
                  <HiOutlineEye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              New Password
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showPasswords.new ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) =>
                  setFormData({ ...formData, newPassword: e.target.value })
                }
                required
                minLength={6}
                className="w-full px-3 py-2 pr-10 rounded-lg text-sm"
                style={{
                  backgroundColor: "var(--bg-main)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords({
                    ...showPasswords,
                    new: !showPasswords.new,
                  })
                }
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-muted)" }}
              >
                {showPasswords.new ? (
                  <HiOutlineEyeOff className="w-4 h-4" />
                ) : (
                  <HiOutlineEye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showPasswords.confirm ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                required
                className="w-full px-3 py-2 pr-10 rounded-lg text-sm"
                style={{
                  backgroundColor: "var(--bg-main)",
                  border: `1px solid ${passwordsMatch ? "var(--border)" : "var(--danger)"}`,
                  color: "var(--text-primary)",
                }}
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords({
                    ...showPasswords,
                    confirm: !showPasswords.confirm,
                  })
                }
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-muted)" }}
              >
                {showPasswords.confirm ? (
                  <HiOutlineEyeOff className="w-4 h-4" />
                ) : (
                  <HiOutlineEye className="w-4 h-4" />
                )}
              </button>
            </div>
            {!passwordsMatch && (
              <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>
                Passwords do not match
              </p>
            )}
          </div>

          {/* Error Message */}
          {mutation.isError && (
            <p className="text-sm" style={{ color: "var(--danger)" }}>
              {mutation.error?.response?.data?.message ||
                "Failed to change password. Please try again."}
            </p>
          )}

          {/* Success Message */}
          {successMessage && (
            <p className="text-sm" style={{ color: "var(--status-present)" }}>
              {successMessage}
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={mutation.isPending || !passwordsMatch}
            className="w-full px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: "var(--primary)" }}
          >
            {mutation.isPending ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
