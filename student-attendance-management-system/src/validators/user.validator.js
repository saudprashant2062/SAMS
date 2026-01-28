import { z } from 'zod';

/* -----------------------
   Base user fields
------------------------*/
const baseUserSchema = {
    fullname: z.string().min(3, 'Full name must be at least 3 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z
        .string()
        .min(6, 'Password must be at least 6 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/\d/, 'Password must contain at least one number')
        .regex(/[#@$!%*?&]/, 'Password must contain at least one special character (#@$!%*?&)'),
    phone_number: z
        .string()
        .regex(
            /^(?:98[0-9]|97[4-9]|96[0-9])\d{7}$/,
            'Please enter a valid Nepali phone number (e.g., 9812345678)',
        ),
    photo_url: z.string().url().optional().nullable(),
};

/* -----------------------
   Single student
------------------------*/
export const createStudentWithUserSchema = z.object({
    body: z.object({
        ...baseUserSchema,
        roll_no: z.string().min(1, 'Roll number is required'),
        registration_no: z.string().optional().nullable(),
        section_id: z.string().uuid('Please select a valid section'),
        batch_id: z.string().uuid('Please select a valid batch'),
    }),
});

/* -----------------------
   Single teacher
------------------------*/
export const createTeacherWithUserSchema = z.object({
    body: z.object({
        ...baseUserSchema,
        designation: z.string().min(2, 'Designation must be at least 2 characters'),
    }),
});

/* -----------------------
   Bulk CSV rows
------------------------*/
export const bulkStudentRowSchema = z.object({
    ...baseUserSchema,
    roll_no: z.string().min(1, 'Roll number is required'),
    registration_no: z.string().optional().nullable(),
    section_id: z.string().uuid('Please select a valid section'), // Can come from CSV or be injected from request body
    batch_id: z.string().uuid('Please select a valid batch'), // Can come from CSV or be injected from request body
});

export const bulkTeacherRowSchema = z.object({
    ...baseUserSchema,
    designation: z.string().min(2, 'Designation must be at least 2 characters'),
});
