import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.enum(['CSIT', 'BCA', 'BBA', 'BBM', 'MBS'], { required_error: 'Department is required' })
});
