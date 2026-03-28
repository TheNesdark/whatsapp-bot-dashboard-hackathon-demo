import { z } from 'zod';
import { INSTANCE_NAME_MAX_LENGTH } from '@server/constants/instances';

export const createInstanceSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido').max(INSTANCE_NAME_MAX_LENGTH, `El nombre es requerido (1-${INSTANCE_NAME_MAX_LENGTH} caracteres)`),
  phoneNumberId: z.string().trim().optional().or(z.literal('')),
  apiUrl: z.string().trim().optional().or(z.literal('')),
});

export const instanceIdParamsSchema = z.object({
  id: z.coerce.number().int().positive('ID invalido'),
});
