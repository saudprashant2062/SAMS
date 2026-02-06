import { z } from 'zod';

/* ============================================================
   SECTION VALIDATOR - Updated for Batch Context
   ============================================================
   
   Changes:
   - Added batch_id as required field
   - Enhanced unique constraint validation
============================================================ */

export const createSectionSchema = z.object({
    name: z
        .string()
        .min(1, 'Section name is required')
        .max(50, 'Section name must be less than 50 characters'),

    department_id: z.string().uuid('Please select a valid department'),

    semester_id: z.string().uuid('Please select a valid semester'),

    batch_id: z.string().uuid('Please select a valid batch'),
});

export const updateSectionSchema = z.object({
    name: z
        .string()
        .min(1, 'Section name is required')
        .max(50, 'Section name must be less than 50 characters')
        .optional(),

    department_id: z.string().uuid('Please select a valid department').optional(),

    semester_id: z.string().uuid('Please select a valid semester').optional(),

    batch_id: z.string().uuid('Please select a valid batch').optional(),
});

export const promoteSemesterSchema = z.object({
    department_id: z.string().uuid('Please select a valid department'),

    batch_id: z.string().uuid('Please select a valid batch'),

    from_semester_id: z.string().uuid('Please select a valid source semester'),

    to_semester_id: z.string().uuid('Please select a valid target semester'),

    options: z
        .object({
            copy_teaching_assignments: z.boolean().default(false),
        })
        .optional()
        .default({ copy_teaching_assignments: false }),
});

export const sectionFilterSchema = z.object({
    department_id: z.string().uuid().optional(),
    batch_id: z.string().uuid().optional(),
    semester_id: z.string().uuid().optional(),
    include_archived: z.boolean().optional(),
});
