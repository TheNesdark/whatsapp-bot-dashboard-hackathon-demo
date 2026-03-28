import { z } from 'zod';

export const registrationActionSchema = z.object({
  id: z.coerce.number().int().positive('ID invalido'),
  phone: z.string().trim().min(1, 'El telefono es obligatorio'),
});

export const registrationDecisionSchema = z.object({
  id: z.coerce.number().int().positive('ID invalido'),
});

export const registrationOperatorDecisionSchema = z.object({
  id: z.coerce.number().int().positive('ID invalido'),
  attended_by: z.string().trim().max(80).optional().or(z.literal('')),
  event: z.enum(['approved', 'rejected', 'needs_info']).optional(),
  reason: z.string().trim().max(500).optional().or(z.literal('')),
});

export const claimRegistrationSchema = z.object({
  id: z.coerce.number().int().positive('ID invalido'),
  attended_by: z.string().trim().max(80).optional().or(z.literal('')),
});

export const rejectRegistrationSchema = z.object({
  id: z.coerce.number().int().positive('ID invalido'),
  phone: z.string().trim().min(1, 'El telefono es obligatorio'),
  reason: z.string().trim().max(500, 'El motivo es demasiado largo (max. 500)').optional().or(z.literal('')),
});
