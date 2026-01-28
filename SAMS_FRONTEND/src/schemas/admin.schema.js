import { z } from "zod";

/* =====================================================
   BATCH VALIDATION
===================================================== */
export const batchSchema = z.object({
  year: z
    .union([z.string(), z.number()])
    .refine(
      (val) => val !== "" && val !== null && val !== undefined,
      "Year is required",
    )
    .refine((val) => !isNaN(Number(val)), "Year must be a valid number")
    .refine((val) => Number(val) >= 2000, "Year must be 2000 or later")
    .refine((val) => Number(val) <= 2100, "Year must be 2100 or earlier"),
  name: z
    .string()
    .max(50, "Name must be 50 characters or less")
    .optional()
    .or(z.literal("")),
});

/* =====================================================
   DEPARTMENT VALIDATION
===================================================== */
export const departmentSchema = z.object({
  name: z
    .string()
    .min(1, "Department name is required")
    .max(100, "Name must be 100 characters or less"),
});

/* =====================================================
   SEMESTER VALIDATION
===================================================== */
export const semesterSchema = z.object({
  number: z
    .string()
    .min(1, "Semester number is required")
    .refine((val) => !isNaN(parseInt(val, 10)), "Must be a valid number")
    .refine((val) => parseInt(val, 10) >= 1, "Must be at least 1")
    .refine((val) => parseInt(val, 10) <= 10, "Must be 10 or less"),
  department_id: z.string().min(1, "Please select a department"),
});

/* =====================================================
   SECTION VALIDATION
===================================================== */
export const sectionSchema = z.object({
  name: z
    .string()
    .min(1, "Section name is required")
    .max(10, "Name must be 10 characters or less"),
  department_id: z.string().min(1, "Please select a department"),
  semester_id: z.string().min(1, "Please select a semester"),
});

/* =====================================================
   SUBJECT VALIDATION
===================================================== */
export const subjectSchema = z.object({
  name: z
    .string()
    .min(1, "Subject name is required")
    .max(100, "Name must be 100 characters or less"),
  code: z
    .string()
    .min(1, "Subject code is required")
    .max(20, "Code must be 20 characters or less"),
  department_id: z.string().min(1, "Please select a department"),
  semester_id: z.string().min(1, "Please select a semester"),
});

/* =====================================================
   STUDENT VALIDATION
===================================================== */
export const studentSchema = z.object({
  fullname: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be 100 characters or less"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/\d/, "Password must contain at least one number")
    .regex(
      /[@#$!%*?&]/,
      "Password must contain at least one special character (@#$!%*?&)",
    ),
  phone_number: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be 15 digits or less")
    .regex(/^[0-9+\-\s]+$/, "Please enter a valid phone number"),
  roll_no: z.string().min(1, "Roll number is required"),
  registration_no: z.string().optional().or(z.literal("")),
  section_id: z.string().min(1, "Please select a section"),
  batch_id: z.string().min(1, "Please select a batch"),
});

/* =====================================================
   TEACHER VALIDATION
===================================================== */
export const teacherSchema = z.object({
  fullname: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be 100 characters or less"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/\d/, "Password must contain at least one number")
    .regex(
      /[@#$!%*?&]/,
      "Password must contain at least one special character (@#$!%*?&)",
    ),
  phone_number: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be 15 digits or less")
    .regex(/^[0-9+\-\s]+$/, "Please enter a valid phone number"),
  designation: z
    .string()
    .min(1, "Designation is required")
    .max(50, "Designation must be 50 characters or less"),
});

/* =====================================================
   ADMIN VALIDATION
===================================================== */
export const adminSchema = z.object({
  fullname: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be 100 characters or less"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/\d/, "Password must contain at least one number")
    .regex(
      /[@#$!%*?&]/,
      "Password must contain at least one special character (@#$!%*?&)",
    ),
  phone_number: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be 15 digits or less")
    .regex(/^[0-9+\-\s]+$/, "Please enter a valid phone number"),
});

/* =====================================================
   TEACHING ASSIGNMENT VALIDATION
===================================================== */
export const teachingAssignmentSchema = z.object({
  teacher_id: z.string().min(1, "Please select a teacher"),
  subject_id: z.string().min(1, "Please select a subject"),
  section_id: z.string().min(1, "Please select a section"),
});
