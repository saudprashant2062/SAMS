import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  assignments: [],
  currentAssignment: null,
  isLoading: false,
  error: null,
};

const assignmentSlice = createSlice({
  name: "assignment",
  initialState,
  reducers: {
    setAssignments: (state, action) => {
      state.assignments = action.payload;
    },
    setCurrentAssignment: (state, action) => {
      state.currentAssignment = action.payload;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearAssignment: (state) => {
      state.currentAssignment = null;
      state.error = null;
    },
  },
});

export const {
  setAssignments,
  setCurrentAssignment,
  setLoading,
  setError,
  clearAssignment,
} = assignmentSlice.actions;

export default assignmentSlice.reducer;
