import {
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineInformationCircle,
  HiOutlineX,
} from "react-icons/hi";

const AlertMessage = ({
  type = "error", // 'error', 'success', 'warning', 'info'
  message,
  onClose,
  className = "",
}) => {
  if (!message) return null;

  const styles = {
    error: {
      bg: "#FEE2E2",
      border: "#FECACA",
      text: "#991B1B",
      icon: HiOutlineXCircle,
    },
    success: {
      bg: "#D1FAE5",
      border: "#A7F3D0",
      text: "#065F46",
      icon: HiOutlineCheckCircle,
    },
    warning: {
      bg: "#FEF3C7",
      border: "#FDE68A",
      text: "#92400E",
      icon: HiOutlineExclamationCircle,
    },
    info: {
      bg: "#DBEAFE",
      border: "#BFDBFE",
      text: "#1E40AF",
      icon: HiOutlineInformationCircle,
    },
  };

  const style = styles[type] || styles.error;
  const Icon = style.icon;

  return (
    <div
      className={`p-4 rounded-lg flex items-start gap-3 ${className}`}
      style={{
        backgroundColor: style.bg,
        border: `1px solid ${style.border}`,
      }}
    >
      <Icon
        className="w-5 h-5 flex-shrink-0 mt-0.5"
        style={{ color: style.text }}
      />
      <p className="text-sm flex-1" style={{ color: style.text }}>
        {message}
      </p>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-black/5 transition-colors"
          style={{ color: style.text }}
        >
          <HiOutlineX className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default AlertMessage;
