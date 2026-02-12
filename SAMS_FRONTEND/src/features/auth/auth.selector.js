// Select the entire auth state
export const selectAuth = (state) => state.auth;

// Select the current user
export const selectUser = (state) => state.auth.user;

// Select authentication status
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;

// Select access token
export const selectAccessToken = (state) => state.auth.accessToken;

// Select user role
export const selectUserRole = (state) => state.auth.user?.role || null;

// Select auth status ('loading' | 'authenticated' | 'unauthenticated')
export const selectAuthStatus = (state) => state.auth.authStatus;
