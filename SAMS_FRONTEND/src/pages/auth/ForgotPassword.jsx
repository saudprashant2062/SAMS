import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import {
  HiOutlineMail,
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
} from "react-icons/hi";
import { forgotPassword } from "../../api/auth.api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const forgotPasswordMutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: () => {
      setIsSubmitted(true);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    forgotPasswordMutation.mutate(email);
  };

  if (isSubmitted) {
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
            style={{ backgroundColor: "var(--primary-light)" }}
          >
            <HiOutlineCheckCircle
              className="w-7 h-7 sm:w-8 sm:h-8"
              style={{ color: "var(--primary)" }}
            />
          </div>
          <h2
            className="text-lg sm:text-xl font-semibold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Check Your Email
          </h2>
          <p
            className="text-xs sm:text-sm mb-6"
            style={{ color: "var(--text-muted)" }}
          >
            We've sent password reset instructions to <strong>{email}</strong>
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium"
            style={{ color: "var(--primary)" }}
          >
            <HiOutlineArrowLeft className="w-4 h-4" />
            Back to Sign In
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
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-xs sm:text-sm mb-6"
          style={{ color: "var(--text-muted)" }}
        >
          <HiOutlineArrowLeft className="w-4 h-4" />
          Back to Sign In
        </Link>

        <div className="mb-6">
          <h2
            className="text-lg sm:text-xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Forgot Password?
          </h2>
          <p
            className="text-xs sm:text-sm mt-1"
            style={{ color: "var(--text-muted)" }}
          >
            Enter your email and we'll send you reset instructions
          </p>
        </div>

        {forgotPasswordMutation.isError && (
          <div
            className="mb-4 p-3 rounded-lg text-sm"
            style={{
              backgroundColor: "#FEF2F2",
              color: "var(--danger)",
              border: "1px solid #FECACA",
            }}
          >
            {(() => {
              const error = forgotPasswordMutation.error;
              const response = error?.response?.data;

              if (response?.message) {
                return response.message;
              } else if (
                error?.code === "ERR_NETWORK" ||
                error?.message === "Network Error"
              ) {
                return "Unable to connect to server. Please check your internet connection.";
              } else if (error?.response?.status === 404) {
                return "No account found with this email address.";
              } else if (error?.response?.status === 403) {
                return "This account has been deactivated. Please contact admin.";
              } else if (error?.response?.status >= 500) {
                return "Server error. Please try again later.";
              }
              return "Failed to send reset email. Please try again.";
            })()}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--text-primary)" }}
            >
              Email Address
            </label>
            <div className="relative">
              <HiOutlineMail
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{
                  backgroundColor: "var(--bg-main)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={forgotPasswordMutation.isPending}
            className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: "var(--primary)" }}
            onMouseEnter={(e) =>
              !forgotPasswordMutation.isPending &&
              (e.target.style.backgroundColor = "var(--primary-hover)")
            }
            onMouseLeave={(e) =>
              (e.target.style.backgroundColor = "var(--primary)")
            }
          >
            {forgotPasswordMutation.isPending
              ? "Sending..."
              : "Send Reset Link"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
