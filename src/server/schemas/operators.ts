import { z } from 'zod';

export const createOperatorSchema = z.object({
  name: z.string().trim().min(1, 'El nombre del operador es obligatorio').max(80, 'El nombre del operador es demasiado largo'),
});

export const operatorIdParamsSchema = z.object({
  id: z.coerce.number().int().positive('ID invalido'),
});
