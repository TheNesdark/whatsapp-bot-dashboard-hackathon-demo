import { z } from 'zod';

export const createInstanceFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido'),
  phone: z.string().trim().optional().default(''),
  apiUrl: z.string().trim().optional(),
});
