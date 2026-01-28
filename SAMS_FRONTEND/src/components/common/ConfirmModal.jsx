import { HiOutlineExclamation, HiOutlineX } from "react-icons/hi";

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger", // 'danger', 'warning', 'info'
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      iconBg: "#FEE2E2",
      iconColor: "var(--status-absent)",
      buttonBg: "var(--status-absent)",
      buttonHover: "#DC2626",
    },
    warning: {
      iconBg: "#FEF3C7",
      iconColor: "var(--status-warning)",
      buttonBg: "var(--status-warning)",
      buttonHover: "#D97706",
    },
    info: {
      iconBg: "var(--primary-light)",
      iconColor: "var(--primary)",
      buttonBg: "var(--primary)",
      buttonHover: "var(--primary-hover)",
    },
  };

  const styles = typeStyles[type] || typeStyles.danger;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      <div
        className="rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg transition-colors hover:bg-gray-100"
          style={{ color: "var(--text-muted)" }}
        >
          <HiOutlineX className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div
            className="p-3 rounded-full"
            style={{ backgroundColor: styles.iconBg }}
          >
            <HiOutlineExclamation
              className="w-8 h-8"
              style={{ color: styles.iconColor }}
            />
          </div>
        </div>

        {/* Title */}
        <h3
          className="text-lg font-semibold text-center mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </h3>

        {/* Message */}
        <p
          className="text-sm text-center mb-6"
          style={{ color: "var(--text-muted)" }}
        >
          {message}
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100 disabled:opacity-50"
            style={{
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
            style={{
              backgroundColor: styles.buttonBg,
            }}
            onMouseEnter={(e) =>
              (e.target.style.backgroundColor = styles.buttonHover)
            }
            onMouseLeave={(e) =>
              (e.target.style.backgroundColor = styles.buttonBg)
            }
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Processing...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
