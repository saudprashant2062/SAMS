import { createSlice } from "@reduxjs/toolkit";

// Get initial state from localStorage
// Note: Access token is now stored in httpOnly cookie on backend
// We only store user data in localStorage for UI purposes
const getInitialState = () => {
  try {
    const userString = localStorage.getItem("user");
    let user = null;

    if (userString) {
      try {
        user = JSON.parse(userString);
      } catch {
        // Invalid JSON in localStorage, clear it
        localStorage.removeItem("user");
      }
    }

    return {
      user,
      accessToken: null, // Access token will be managed via httpOnly cookies
      isAuthenticated: !!user,
    };
  } catch {
    // localStorage access failed (e.g., private browsing)
    return {
      user: null,
      accessToken: null,
      isAuthenticated: false,
    };
  }
};

const authSlice = createSlice({
  name: "auth",
  initialState: getInitialState(),
  reducers: {
    // Set credentials after successful login (called from TanStack Query onSuccess)
    setCredentials: (state, action) => {
      const { user, accessToken } = action.payload;

      state.user = user;
      state.accessToken = accessToken; // Keep in memory for backward compatibility
      state.isAuthenticated = true;

      // Only persist user data to localStorage (not the token)
      localStorage.setItem("user", JSON.stringify(user));
    },

    // Update access token (useful for token refresh)
    // Token is stored in memory only for this session
    updateAccessToken: (state, action) => {
      const { accessToken } = action.payload;
      state.accessToken = accessToken;
      // Do not persist token to localStorage
    },

    // Logout - clear all auth state
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;

      // Clear localStorage
      localStorage.removeItem("user");
    },
  },
});

export const { setCredentials, updateAccessToken, logout } = authSlice.actions;
export default authSlice.reducer;
