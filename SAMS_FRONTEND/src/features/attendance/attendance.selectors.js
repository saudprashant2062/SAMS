export const selectSessions = (state) => state.attendance.sessions;
export const selectCurrentSession = (state) => state.attendance.currentSession;
export const selectRecords = (state) => state.attendance.records;
export const selectSummary = (state) => state.attendance.summary;
export const selectAttendanceLoading = (state) => state.attendance.isLoading;
export const selectAttendanceError = (state) => state.attendance.error;
