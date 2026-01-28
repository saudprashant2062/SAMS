import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  sessions: [],
  currentSession: null,
  records: [],
  summary: null,
  isLoading: false,
  error: null,
};

const attendanceSlice = createSlice({
  name: "attendance",
  initialState,
  reducers: {
    setSessions: (state, action) => {
      state.sessions = action.payload;
    },
    setCurrentSession: (state, action) => {
      state.currentSession = action.payload;
    },
    setRecords: (state, action) => {
      state.records = action.payload;
    },
    setSummary: (state, action) => {
      state.summary = action.payload;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearAttendance: (state) => {
      state.currentSession = null;
      state.records = [];
      state.error = null;
    },
  },
});

export const {
  setSessions,
  setCurrentSession,
  setRecords,
  setSummary,
  setLoading,
  setError,
  clearAttendance,
} = attendanceSlice.actions;

export default attendanceSlice.reducer;
