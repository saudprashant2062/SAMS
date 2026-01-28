import { createSlice } from "@reduxjs/toolkit";

// Get initial state from localStorage
const getInitialState = () => {
  try {
    const accessToken = localStorage.getItem("accessToken");
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
      accessToken: accessToken || null,
      isAuthenticated: !!accessToken && !!user,
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
      state.accessToken = accessToken;
      state.isAuthenticated = true;

      // Persist to localStorage
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("accessToken", accessToken);
    },

    // Update access token (useful for token refresh)
    updateAccessToken: (state, action) => {
      const { accessToken } = action.payload;

      state.accessToken = accessToken;
      localStorage.setItem("accessToken", accessToken);
    },

    // Logout - clear all auth state
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;

      // Clear localStorage
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
    },
  },
});

export const { setCredentials, updateAccessToken, logout } = authSlice.actions;
export default authSlice.reducer;
