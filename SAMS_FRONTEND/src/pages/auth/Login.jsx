import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import {
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
} from "react-icons/hi";
import { login } from "../../api/auth.api";
import { setCredentials } from "../../features/auth/auth.slice";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError("");
  };

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (response) => {
      const { user, tokens } = response.data.data;
      const accessToken = tokens.accessToken;

      dispatch(setCredentials({ user, accessToken }));

      const role = user.role;
      if (role === "ADMIN") {
        navigate("/admin/dashboard");
      } else if (role === "TEACHER") {
        navigate("/teacher/dashboard");
      } else if (role === "STUDENT") {
        navigate("/student/dashboard");
      } else {
        navigate("/");
      }
    },
    onError: (error) => {
      // Extract the most relevant error message
      const response = error.response?.data;
      let errorMessage = "Something went wrong. Please try again later.";

      if (response?.message) {
        // Use the backend's error message directly
        errorMessage = response.message;
      } else if (response?.errors) {
        // Handle Zod validation errors
        const errors = response.errors;
        if (errors._errors?.[0]) {
          errorMessage = errors._errors[0];
        } else if (errors.email?._errors?.[0]) {
          errorMessage = errors.email._errors[0];
        } else if (errors.password?._errors?.[0]) {
          errorMessage = errors.password._errors[0];
        }
      } else if (
        error.code === "ERR_NETWORK" ||
        error.message === "Network Error"
      ) {
        errorMessage =
          "Unable to connect to server. Please check your internet connection.";
      } else if (error.response?.status === 401) {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (error.response?.status === 403) {
        errorMessage =
          "Your account has been deactivated. Please contact admin.";
      } else if (error.response?.status === 404) {
        errorMessage = "No account found with this email address.";
      } else if (error.response?.status >= 500) {
        errorMessage = "Server error. Please try again later.";
      }

      setError(errorMessage);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate(formData);
  };

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

      {/* Login Card */}
      <div
        className="rounded-xl p-6 sm:p-8 shadow-sm"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="text-center mb-6">
          <h2
            className="text-lg sm:text-xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Welcome Back
          </h2>
          <p
            className="text-xs sm:text-sm mt-1"
            style={{ color: "var(--text-muted)" }}
          >
            Sign in to continue to your dashboard
          </p>
        </div>

        {error && (
          <div
            className="mb-4 p-3 rounded-lg text-xs sm:text-sm"
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
          {/* Email */}
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
                name="email"
                value={formData.email}
                onChange={handleChange}
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

          {/* Password */}
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--text-primary)" }}
            >
              Password
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
                placeholder="Enter your password"
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

          {/* Forgot Password */}
          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-sm font-medium hover:underline"
              style={{ color: "var(--primary)" }}
            >
              Forgot Password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: "var(--primary)" }}
            onMouseEnter={(e) =>
              !loginMutation.isPending &&
              (e.target.style.backgroundColor = "var(--primary-hover)")
            }
            onMouseLeave={(e) =>
              (e.target.style.backgroundColor = "var(--primary)")
            }
          >
            {loginMutation.isPending ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
