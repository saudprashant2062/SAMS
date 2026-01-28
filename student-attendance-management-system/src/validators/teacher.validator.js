import { z } from 'zod';

export const createAttendanceSessionSchema = z.object({
    body: z.object({
        teaching_assignment_id: z.string().uuid('Invalid teaching assignment ID'),
        session_date: z.string().optional(), // default to today
    }),
});

export const markAttendanceSchema = z.object({
    body: z.object({
        session_id: z.string().uuid('Invalid session ID'),
        records: z.array(
            z.object({
                student_id: z.string().uuid('Invalid student ID'),
                status: z.enum(['PRESENT', 'ABSENT']),
            }),
        ),
    }),
});
