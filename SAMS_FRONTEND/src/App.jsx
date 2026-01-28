import { BrowserRouter } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AppRoutes from "./routes/AppRoutes";
import { selectIsAuthenticated } from "./features/auth/auth.selector";
import { logout, setCredentials } from "./features/auth/auth.slice";
import { refreshToken, getMe } from "./api/auth.api";

const App = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // If we have stored auth, verify it's still valid
      if (isAuthenticated) {
        try {
          // Try to get current user to verify token
          const response = await getMe();
          const user = response.data.data;
          const storedToken = localStorage.getItem("accessToken");
          dispatch(setCredentials({ user, accessToken: storedToken }));
        } catch (error) {
          // Token might be expired, try refresh
          try {
            const refreshResponse = await refreshToken();
            const newAccessToken = refreshResponse.data.data.accessToken;
            const userResponse = await getMe();
            const user = userResponse.data.data;
            dispatch(setCredentials({ user, accessToken: newAccessToken }));
          } catch (refreshError) {
            // Refresh token also expired, logout
            dispatch(logout());
          }
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  if (isLoading) {
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
