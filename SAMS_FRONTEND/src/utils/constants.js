// Base URL for the backend server (without /api suffix)
// Used for constructing URLs to static files like uploaded photos
const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
export const SERVER_BASE_URL = apiBaseUrl.replace(/\/api\/?$/, "");

/**
 * Get the full URL for an uploaded file (e.g., profile photo).
 * If the URL is already absolute, return as-is.
 * If it's a relative path (e.g., /uploads/...), prepend the server base URL.
 */
export const getFileUrl = (relativePath) => {
  if (!relativePath) return null;
  if (relativePath.startsWith("http")) return relativePath;
  return `${SERVER_BASE_URL}${relativePath}`;
};
