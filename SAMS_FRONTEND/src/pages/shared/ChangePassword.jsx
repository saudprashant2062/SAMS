import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axiosInstance from "../../api/axiosInstance";
import PasswordField from "../../components/common/PasswordField";
import { isPasswordValid, validatePassword } from "../../utils/validation";

const changePassword = (data) => {
  return axiosInstance.patch("/auth/reset-password", data);
};

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
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

    if (!isPasswordValid(validatePassword(formData.newPassword))) {
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
          <PasswordField
            label="Current Password"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
            placeholder="Enter current password"
            required
          />

          {/* New Password */}
          <PasswordField
            label="New Password"
            name="newPassword"
            value={formData.newPassword}
            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
            placeholder="Enter new password"
            required
            showRequirements
          />

          {/* Confirm Password */}
          <PasswordField
            label="Confirm New Password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            placeholder="Confirm new password"
            required
            error={!passwordsMatch ? "Passwords do not match" : ""}
          />

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
