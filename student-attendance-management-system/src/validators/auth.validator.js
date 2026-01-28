import { z } from 'zod';

/* ---------- LOGIN ---------- */
// For login, only validate that email and password are provided (don't enforce password format)
export const AuthLoginValidator = z.object({
    email: z
        .string()
        .min(1, { message: 'Email is required' })
        .email({ message: 'Please enter a valid email address' }),
    password: z.string().min(1, { message: 'Password is required' }),
});

/* ---------- RESET PASSWORD ---------- */
export const resetPasswordValidator = z.object({
    oldPassword: z.string().min(6, { message: 'Old password must be at least 6 characters' }),
    newPassword: z
        .string()
        .min(6, { message: 'New password must be at least 6 characters long' })
        .regex(/[A-Z]/, 'New password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'New password must contain at least one lowercase letter')
        .regex(/\d/, 'New password must contain at least one number')
        .regex(/[@#$!%*?&]/, 'New password must contain at least one special character'),
});

/* ---------- FORGOT PASSWORD ---------- */
export const forgotPasswordValidator = z.object({
    email: z.string().email({ message: 'Invalid email address' }),
});

/* ---------- RESET PASSWORD WITH TOKEN ---------- */
export const resetPasswordWithTokenValidator = z.object({
    token: z.string().min(1, { message: 'Reset token is required' }),
    newPassword: z
        .string()
        .min(6, { message: 'New password must be at least 6 characters long' })
        .regex(/[A-Z]/, 'New password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'New password must contain at least one lowercase letter')
        .regex(/\d/, 'New password must contain at least one number')
        .regex(/[@#$!%*?&]/, 'New password must contain at least one special character'),
});
