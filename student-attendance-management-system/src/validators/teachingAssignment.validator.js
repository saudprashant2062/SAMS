import { z } from 'zod';

export const createTeachingAssignmentSchema = z.object({
    teacher_id: z.string().uuid(),
    section_id: z.string().uuid(),
    subject_id: z.string().uuid(),
});
