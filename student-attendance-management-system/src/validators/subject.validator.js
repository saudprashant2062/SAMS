import { z } from 'zod';

export const createSubjectSchema = z.object({
    name: z.string().min(2),
    code: z.string().min(2),
    department_id: z.string().uuid(),
    semester_id: z.string().uuid(),
});

export const bulkSubjectRowSchema = z.object({
    name: z.string().min(2, 'Subject name must be at least 2 characters'),
    code: z.string().min(2, 'Subject code must be at least 2 characters'),
    credit_hours: z
        .union([z.string(), z.number()])
        .transform(val => (typeof val === 'string' ? parseInt(val, 10) : val))
        .pipe(z.number().int().min(1).max(10))
        .optional()
        .default(3),
});
