export const selectAssignments = (state) => state.assignment.assignments;
export const selectCurrentAssignment = (state) =>
  state.assignment.currentAssignment;
export const selectAssignmentLoading = (state) => state.assignment.isLoading;
export const selectAssignmentError = (state) => state.assignment.error;
