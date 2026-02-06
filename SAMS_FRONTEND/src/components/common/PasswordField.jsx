import { useState } from "react";
import {
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineCheck,
  HiOutlineX,
} from "react-icons/hi";
import { validatePassword } from "../../utils/validation";

const PasswordField = ({
  label,
  name,
  value,
  onChange,
  placeholder = "Enter password",
  required = false,
  showRequirements = false,
  error = "",
  className = "",
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const requirements = validatePassword(value || "");

  const requirementList = [
    { label: "At least 8 characters", met: requirements.length },
    { label: "Uppercase & Lowercase letters", met: requirements.uppercase && requirements.lowercase },
    { label: "At least one number", met: requirements.number },
    { label: "At least one special character (#@$!%*?&)", met: requirements.special },
  ];

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          className="block text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <HiOutlineLockClosed
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
          style={{ color: "var(--text-muted)" }}
        />
        <input
          type={showPassword ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="w-full pl-10 pr-10 py-2.5 rounded-lg text-sm outline-none transition-all"
          style={{
            backgroundColor: "var(--bg-main)",
            border: `1px solid ${error ? "var(--danger)" : "var(--border)"}`,
            color: "var(--text-primary)",
          }}
          onFocus={(e) => !error && (e.target.style.borderColor = "var(--primary)")}
          onBlur={(e) => !error && (e.target.style.borderColor = "var(--border)")}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-gray-100 transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          {showPassword ? (
            <HiOutlineEyeOff className="w-5 h-5" />
          ) : (
            <HiOutlineEye className="w-5 h-5" />
          )}
        </button>
      </div>

      {error && (
        <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}

      {showRequirements && value && (
        <div 
          className="mt-2 p-2 rounded-lg text-[11px] sm:text-xs space-y-1"
          style={{ backgroundColor: "var(--bg-main)", border: "1px solid var(--border)" }}
        >
          <p className="font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
            Password must contain:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
            {requirementList.map((req, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                {req.met ? (
                  <HiOutlineCheck className="w-3 h-3 text-green-500 shrink-0" />
                ) : (
                  <HiOutlineX className="w-3 h-3 text-gray-300 shrink-0" />
                )}
                <span style={{ color: req.met ? "var(--text-primary)" : "var(--text-muted)" }}>
                  {req.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordField;
