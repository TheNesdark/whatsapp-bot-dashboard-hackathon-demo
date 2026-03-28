import { z } from 'zod';

export const createInstanceFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido'),
  phone: z.string().trim().min(1, 'ID de numero es requerido'),
  apiUrl: z.string().trim().optional(),
});
