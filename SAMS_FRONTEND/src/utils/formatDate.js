/**
 * Format a date to a readable string
 * @param {Date|string} date - Date to format
 * @param {string} format - Format option: 'short', 'long', 'time', 'datetime'
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = "short") => {
  if (!date) return "";

  const d = new Date(date);

  if (isNaN(d.getTime())) return "";

  const options = {
    short: { year: "numeric", month: "short", day: "numeric" },
    long: { year: "numeric", month: "long", day: "numeric", weekday: "long" },
    time: { hour: "2-digit", minute: "2-digit" },
    datetime: {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  };

  return d.toLocaleDateString("en-US", options[format] || options.short);
};

/**
 * Format date to ISO string (YYYY-MM-DD)
 * @param {Date|string} date - Date to format
 * @returns {string} ISO date string
 */
export const toISODate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().split("T")[0];
};

/**
 * Get relative time string (e.g., "2 hours ago")
 * @param {Date|string} date - Date to compare
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
  if (!date) return "";

  const now = new Date();
  const d = new Date(date);
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

  return formatDate(d, "short");
};

/**
 * Convert AD year to BS (Bikram Sambat) year
 * Approximate conversion: BS = AD + 56.7 (varies by month)
 * @param {number} adYear - AD year
 * @returns {number} BS year
 */
export const adToBS = (adYear) => {
  // Simple approximation: BS is about 56-57 years ahead of AD
  // More accurate conversion would require month/day consideration
  return adYear + 57;
};

/**
 * Get current BS year
 * @returns {number} Current BS year
 */
export const getCurrentBSYear = () => {
  const now = new Date();
  const adYear = now.getFullYear();
  const month = now.getMonth(); // 0-11
  // Nepali new year is around mid-April, so before April use previous BS year
  return month < 3 ? adYear + 56 : adYear + 57;
};

/**
 * Safe date formatter that handles both created_at and createdAt
 * @param {object} item - Object with date field
 * @returns {string} Formatted date string
 */
export const safeFormatDate = (item) => {
  const dateValue = item?.created_at || item?.createdAt;
  if (!dateValue) return "N/A";

  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return "N/A";

  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default formatDate;
