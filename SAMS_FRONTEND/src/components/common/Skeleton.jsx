

export const Skeleton = ({ className, height, width, variant = "rect" }) => {
  const baseClasses = "animate-pulse bg-gray-200";
  const radiusClass = variant === "circle" ? "rounded-full" : "rounded-md";
  
  return (
    <div
      className={`${baseClasses} ${radiusClass} ${className || ""}`}
      style={{
        height: height,
        width: width,
        backgroundColor: "var(--bg-main)", // Should be slightly darker than card, handled by css var usually or gray-200
        opacity: 0.1, // Subtle
        // We can use a linear gradient for shimmer if advanced, but simple pulse is fine for now
      }}
    >
        {/* Inner shimmer effect can be added here if needed */}
        <div className="w-full h-full bg-gray-300 opacity-50 rounded bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
    </div>
  );
};

// Simple implementations
export const SkeletonRect = ({ className, ...props }) => (
  <div
    className={`animate-pulse bg-gray-200 rounded-md ${className}`}
    style={{ backgroundColor: "rgba(0,0,0,0.05)" }}
    {...props}
  />
);

export const SkeletonCircle = ({ className, ...props }) => (
  <div
    className={`animate-pulse bg-gray-200 rounded-full ${className}`}
    style={{ backgroundColor: "rgba(0,0,0,0.05)" }}
    {...props}
  />
);

