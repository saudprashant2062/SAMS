import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  selectIsAuthenticated,
  selectUser,
  selectUserRole,
  selectAccessToken,
} from "../features/auth/auth.selector";
import {
  setCredentials,
  logout as logoutAction,
} from "../features/auth/auth.slice";
import { logout as logoutApi, getMe, refreshToken } from "../api/auth.api";

/**
 * Custom hook for authentication operations
 * Combines Redux state with API calls
 */
const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Selectors
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const role = useSelector(selectUserRole);
  const accessToken = useSelector(selectAccessToken);

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      // Clear React Query cache to prevent stale user data
      queryClient.clear();
      dispatch(logoutAction());
      navigate("/login");
    },
    onError: () => {
      // Even if API fails, clear local state
      queryClient.clear();
      dispatch(logoutAction());
      navigate("/login");
    },
  });

  // Get current user query (useful for refreshing user data)
  // Include user.id in queryKey to prevent stale cache across different users
  const {
    data: currentUser,
    refetch: refetchUser,
    isLoading: isLoadingUser,
  } = useQuery({
    queryKey: ["currentUser", user?.id],
    queryFn: getMe,
    enabled: isAuthenticated && !!user?.id,
    select: (response) => response.data.data,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Logout handler
  const logout = () => {
    logoutMutation.mutate();
  };

  // Check if user has a specific role
  const hasRole = (requiredRole) => {
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(role);
    }
    return role === requiredRole;
  };

  // Check if user is admin
  const isAdmin = () => role === "ADMIN";

  // Check if user is teacher
  const isTeacher = () => role === "TEACHER";

  // Check if user is student
  const isStudent = () => role === "STUDENT";

  return {
    // State
    isAuthenticated,
    user: currentUser || user,
    role,
    accessToken,

    // Loading states
    isLoggingOut: logoutMutation.isPending,
    isLoadingUser,

    // Actions
    logout,
    refetchUser,

    // Role helpers
    hasRole,
    isAdmin,
    isTeacher,
    isStudent,
  };
};

export default useAuth;
