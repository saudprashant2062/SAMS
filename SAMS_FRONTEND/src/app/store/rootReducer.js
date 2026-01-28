import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "../../features/auth/auth.slice";
import assignmentReducer from "../../features/assignment/assignment.slice";
import attendanceReducer from "../../features/attendance/attendance.slice";
import uiReducer from "../../features/ui/ui.slice";

const rootReducer = combineReducers({
  auth: authReducer,
  assignment: assignmentReducer,
  attendance: attendanceReducer,
  ui: uiReducer,
});

export default rootReducer;
