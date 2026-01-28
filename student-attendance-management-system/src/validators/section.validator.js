import { z } from 'zod';

export const createSectionSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Section name is required'),
        department_id: z.string().uuid({ message: 'Please select a valid department' }),
        semester_id: z.string().uuid({ message: 'Please select a valid semester' }),
    }),
});
