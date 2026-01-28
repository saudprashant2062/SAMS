import { z } from 'zod';

export const createSubjectSchema = z.object({
    name: z.string().min(2),
    code: z.string().min(2),
    department_id: z.string().uuid(),
    semester_id: z.string().uuid(),
});
