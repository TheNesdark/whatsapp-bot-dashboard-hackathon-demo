import { z } from 'zod';

export const reportsQuerySchema = z.object({
  eps: z.string().trim().optional().default(''),
  appt: z.string().trim().optional().default(''),
  days: z.enum(['7', '30', '90', 'all']).optional().default('30'),
});
