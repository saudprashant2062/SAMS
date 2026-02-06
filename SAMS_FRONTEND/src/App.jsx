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
          // Always try to refresh token first to ensure we have an accessToken in memory
          // (Since getMe only verifies the cookie but doesn't return the token)
          const refreshResponse = await refreshToken();
          const newAccessToken = refreshResponse.data.data.accessToken;
          
          const userResponse = await getMe();
          const user = userResponse.data.data;
          
          dispatch(setCredentials({ user, accessToken: newAccessToken }));
        } catch (error) {
          // If refresh fails, try getMe as fallback (maybe session is valid but no persistence?)
          // But usually if refresh fails, we should logout
          try {
             // Optional: Check if getMe works without token (just cookie)
             // If so, we might need to handle "cookie-only" mode, but better to logout if no token
             await getMe();
             // If getMe succeeds, we are technically logged in but have no token...
             // This causes the 401 loop. So assume failed refresh = logout.
             throw new Error("Token missing");
          } catch (e) {
             dispatch(logout());
          }
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [dispatch, isAuthenticated]);

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
