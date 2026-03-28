import { z } from 'zod';

export const rejectRegistrationSchema = z.object({
  reason: z.string().trim().min(1, 'Debe ingresar un motivo de rechazo'),
});
