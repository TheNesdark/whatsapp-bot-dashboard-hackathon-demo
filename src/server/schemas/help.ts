import { z } from 'zod';

export const helpRequestIdParamsSchema = z.object({
  id: z.coerce.number().int().positive('ID invalido'),
});

export const helpRequestsQuerySchema = z.object({
  includeMuted: z.enum(['0', '1', 'true', 'false']).optional(),
});

export const createHelpRequestSchema = z.object({
  phone_number: z.string().trim().min(1, 'phone_number requerido'),
  full_name: z.string().trim().optional().nullable(),
  cedula: z.string().trim().optional().nullable(),
  instance_id: z.coerce.number().int().positive().optional(),
  silent: z.boolean().optional(),
});

export const resolveHelpRequestSchema = z.object({
  message: z.string().trim().optional(),
});
