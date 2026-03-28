import { z } from 'zod';
import { MAX_IMAGE_SIZE, MAX_WHATSAPP_TEXT_LENGTH, ALLOWED_IMAGE_MIME_TYPES } from '@server/constants/messages';

export const replyMessageSchema = z.object({
  phone: z.string().trim().min(1),
  message: z.string().trim().min(1, 'Telefono y mensaje son obligatorios').max(MAX_WHATSAPP_TEXT_LENGTH, `El mensaje es demasiado largo (max. ${MAX_WHATSAPP_TEXT_LENGTH})`),
  instanceId: z.coerce.number().int().positive().nullable().optional(),
});

export const replyImageBodySchema = z.object({
  phone: z.string().trim().min(1, 'Se requiere telefono e imagen'),
  caption: z.string().trim().optional().or(z.literal('')),
  instanceId: z.coerce.number().int().positive().nullable().optional(),
});

export function validateImageFile(file?: { mimetype: string; size: number }) {
  if (!file) return 'Se requiere telefono e imagen';
  if (file.size > MAX_IMAGE_SIZE) return `La imagen es demasiado grande (max. ${MAX_IMAGE_SIZE / 1024 / 1024} MB)`;
  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
    return `Tipo de archivo no permitido. Tipos aceptados: ${Array.from(ALLOWED_IMAGE_MIME_TYPES).join(', ')}`;
  }
  return null;
}
