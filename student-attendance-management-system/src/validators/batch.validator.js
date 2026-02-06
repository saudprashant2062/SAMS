import { z } from 'zod';

// BS year validation (Nepali calendar - typically 2070-2100 range)
export const createBatchSchema = z
    .object({
        name: z.string().max(50, 'Name must be 50 characters or less').optional().nullable(),
        department_id: z
            .string({ required_error: 'Department is required' })
            .uuid('Invalid department ID'),
        start_year: z
            .number({
                required_error: 'Start year (BS) is required',
                invalid_type_error: 'Start year must be a number',
            })
            .int('Start year must be a whole number')
            .min(2070, 'Start year must be 2070 BS or later')
            .max(2150, 'Start year must be 2150 BS or earlier'),
        end_year: z
            .number({
                required_error: 'End year (BS) is required',
                invalid_type_error: 'End year must be a number',
            })
            .int('End year must be a whole number')
            .min(2070, 'End year must be 2070 BS or later')
            .max(2150, 'End year must be 2150 BS or earlier'),
    })
    .refine(data => data.end_year > data.start_year, {
        message: 'End year must be greater than start year',
        path: ['end_year'],
    });

export const updateBatchSchema = z
    .object({
        name: z.string().max(50, 'Name must be 50 characters or less').optional().nullable(),
        department_id: z.string().uuid('Invalid department ID').optional(),
        start_year: z
            .number({ invalid_type_error: 'Start year must be a number' })
            .int('Start year must be a whole number')
            .min(2070, 'Start year must be 2070 BS or later')
            .max(2150, 'Start year must be 2150 BS or earlier')
            .optional(),
        end_year: z
            .number({ invalid_type_error: 'End year must be a number' })
            .int('End year must be a whole number')
            .min(2070, 'End year must be 2070 BS or later')
            .max(2150, 'End year must be 2150 BS or earlier')
            .optional(),
    })
    .refine(
        data => {
            if (data.start_year && data.end_year) {
                return data.end_year > data.start_year;
            }
            return true;
        },
        {
            message: 'End year must be greater than start year',
            path: ['end_year'],
        },
    );
