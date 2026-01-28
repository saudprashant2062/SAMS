import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import {
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineCheckCircle,
} from "react-icons/hi";
import { resetPasswordWithToken } from "../../api/auth.api";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const resetPasswordMutation = useMutation({
    mutationFn: (data) => resetPasswordWithToken(token, data),
    onSuccess: () => {
      setIsSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    },
    onError: (error) => {
      setError(
        error.response?.data?.message ||
          "Failed to reset password. Please try again.",
      );
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    resetPasswordMutation.mutate({ password: formData.password });
  };

  if (isSuccess) {
    return (
      <div className="w-full max-w-md px-4 sm:px-0">
        <div
          className="rounded-xl p-6 sm:p-8 shadow-sm text-center"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#D1FAE5" }}
          >
            <HiOutlineCheckCircle
              className="w-7 h-7 sm:w-8 sm:h-8"
              style={{ color: "var(--status-present)" }}
            />
          </div>
          <h2
            className="text-lg sm:text-xl font-semibold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Password Reset Successful
          </h2>
          <p
            className="text-xs sm:text-sm mb-4"
            style={{ color: "var(--text-muted)" }}
          >
            Your password has been reset. Redirecting to login...
          </p>
          <Link
            to="/login"
            className="text-xs sm:text-sm font-medium"
            style={{ color: "var(--primary)" }}
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md px-4 sm:px-0">
      {/* Mobile Logo */}
      <div className="lg:hidden text-center mb-6">
        <img
          src="/Academia.png"
          alt="Academia College"
          className="w-20 h-20 mx-auto object-contain mb-2"
        />
        <h1 className="text-xl font-bold" style={{ color: "var(--primary)" }}>
          Academia College
        </h1>
      </div>

      {/* Card */}
      <div
        className="rounded-xl p-6 sm:p-8 shadow-sm"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="mb-6">
          <h2
            className="text-lg sm:text-xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Reset Password
          </h2>
          <p
            className="text-xs sm:text-sm mt-1"
            style={{ color: "var(--text-muted)" }}
          >
            Enter your new password below
          </p>
        </div>

        {error && (
          <div
            className="mb-4 p-3 rounded-lg text-sm"
            style={{
              backgroundColor: "#FEF2F2",
              color: "var(--danger)",
              border: "1px solid #FECACA",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--text-primary)" }}
            >
              New Password
            </label>
            <div className="relative">
              <HiOutlineLockClosed
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter new password"
                required
                className="w-full pl-10 pr-10 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{
                  backgroundColor: "var(--bg-main)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-muted)" }}
              >
                {showPassword ? (
                  <HiOutlineEyeOff className="w-5 h-5" />
                ) : (
                  <HiOutlineEye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--text-primary)" }}
            >
              Confirm Password
            </label>
            <div className="relative">
              <HiOutlineLockClosed
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
                required
                className="w-full pl-10 pr-10 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{
                  backgroundColor: "var(--bg-main)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-muted)" }}
              >
                {showConfirmPassword ? (
                  <HiOutlineEyeOff className="w-5 h-5" />
                ) : (
                  <HiOutlineEye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={resetPasswordMutation.isPending}
            className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: "var(--primary)" }}
            onMouseEnter={(e) =>
              !resetPasswordMutation.isPending &&
              (e.target.style.backgroundColor = "var(--primary-hover)")
            }
            onMouseLeave={(e) =>
              (e.target.style.backgroundColor = "var(--primary)")
            }
          >
            {resetPasswordMutation.isPending
              ? "Resetting..."
              : "Reset Password"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            Remember your password?{" "}
            <span style={{ color: "var(--primary)" }} className="font-medium">
              Sign In
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
