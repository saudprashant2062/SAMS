import { z } from 'zod';

/* =====================================================
   CREATE ATTENDANCE SESSION
===================================================== */
export const createAttendanceSessionSchema = z.object({
    teaching_assignment_id: z.string().uuid('Invalid teaching assignment ID'),
    session_date: z.string().datetime().optional(),
});

/* =====================================================
   MARK ATTENDANCE (BULK)
===================================================== */
export const markAttendanceSchema = z.object({
    session_id: z.string().uuid('Invalid session ID'),
    records: z
        .array(
            z.object({
                student_id: z.string().uuid('Invalid student ID'),
                status: z.enum(['PRESENT', 'ABSENT']),
            }),
        )
        .min(1, 'At least one record is required'),
});

/* =====================================================
   UPDATE SINGLE ATTENDANCE RECORD
===================================================== */
export const updateAttendanceRecordSchema = z.object({
    status: z.enum(['PRESENT', 'ABSENT']),
});

/* =====================================================
   PROMOTE SEMESTER
===================================================== */
export const promoteSemesterSchema = z.object({
    department_id: z.string().uuid('Invalid department ID'),
    from_semester_id: z.string().uuid('Invalid semester ID'),
    to_semester_id: z.string().uuid('Invalid target semester ID'),
});
