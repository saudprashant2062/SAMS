import { z } from 'zod';

export const createBatchSchema = z.object({
    year: z
        .number({ required_error: 'Year is required', invalid_type_error: 'Year must be a number' })
        .int('Year must be a whole number')
        .min(2000, 'Year must be 2000 or later')
        .max(2100, 'Year must be 2100 or earlier'),
    name: z.string().max(50, 'Name must be 50 characters or less').optional().nullable(),
});

export const updateBatchSchema = z.object({
    year: z
        .number({ invalid_type_error: 'Year must be a number' })
        .int('Year must be a whole number')
        .min(2000, 'Year must be 2000 or later')
        .max(2100, 'Year must be 2100 or earlier')
        .optional(),
    name: z.string().max(50, 'Name must be 50 characters or less').optional().nullable(),
});
