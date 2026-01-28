import { z } from 'zod';

export const createSemesterSchema = z.object({
    number: z.coerce
        .number({ invalid_type_error: 'Semester number must be a valid number' })
        .min(1, 'Semester number must be at least 1'),
    department_id: z.string().uuid('Invalid department ID'),
});
