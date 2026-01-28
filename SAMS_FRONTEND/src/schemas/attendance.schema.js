import * as yup from "yup";

export const attendanceSchema = yup.object().shape({
  teachingAssignmentId: yup
    .string()
    .required("Teaching assignment is required"),
  date: yup
    .date()
    .required("Date is required")
    .max(new Date(), "Date cannot be in the future"),
  records: yup
    .array()
    .of(
      yup.object().shape({
        studentId: yup.string().required("Student ID is required"),
        status: yup
          .string()
          .oneOf(["PRESENT", "ABSENT", "LATE", "EXCUSED"], "Invalid status")
          .required("Status is required"),
        remark: yup
          .string()
          .max(255, "Remark must be less than 255 characters"),
      }),
    )
    .min(1, "At least one attendance record is required"),
});

export const attendanceFilterSchema = yup.object().shape({
  subjectId: yup.string(),
  sectionId: yup.string(),
  fromDate: yup.date(),
  toDate: yup.date().when("fromDate", {
    is: (fromDate) => fromDate != null,
    then: (schema) =>
      schema.min(yup.ref("fromDate"), "End date must be after start date"),
  }),
});
