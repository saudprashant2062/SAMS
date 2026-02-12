import { BrowserRouter } from "react-router-dom";
import { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import AppRoutes from "./routes/AppRoutes";
import { selectAuthStatus } from "./features/auth/auth.selector";
import { setCredentials, logout } from "./features/auth/auth.slice";
import { refreshToken, getMe } from "./api/auth.api";

const App = () => {
  const dispatch = useDispatch();
  const authStatus = useSelector(selectAuthStatus);

  // Reusable function to verify auth with server
  const verifyAuth = useCallback(async () => {
    // Check if user data exists in localStorage (indicates a previous session)
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      // No stored user — definitely not authenticated
      dispatch(logout());
      return;
    }

    try {
      // Try to refresh access token (refresh token is in httpOnly cookie)
      const refreshResponse = await refreshToken();
      const newAccessToken = refreshResponse.data.data.accessToken;

      // Get fresh user data from server
      const userResponse = await getMe();
      const user = userResponse.data.data;

      dispatch(setCredentials({ user, accessToken: newAccessToken }));
    } catch {
      // Refresh failed — session is invalid, clean up
      dispatch(logout());
    }
  }, [dispatch]);

  // On app start: verify auth with server
  useEffect(() => {
    verifyAuth();
  }, [verifyAuth]);

  // Cross-tab sync: listen for localStorage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === "user") {
        if (!event.newValue) {
          // User was removed in another tab → logout here too
          dispatch(logout());
        } else {
          // User was updated in another tab → re-verify auth
          verifyAuth();
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [dispatch, verifyAuth]);

  // Show loading spinner while auth is being verified
  if (authStatus === "loading") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--bg-main)" }}
      >
        <div className="text-center">
          <div
            className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto"
            style={{
              borderColor: "var(--primary)",
              borderTopColor: "transparent",
            }}
          ></div>
          <p
            className="mt-4 text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;
