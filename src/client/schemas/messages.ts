import { z } from 'zod';

export const replyMessageSchema = z.object({
  message: z.string().trim().min(1, 'El mensaje no puede estar vacio').max(4096, 'El mensaje es demasiado largo (max. 4096 caracteres)'),
});

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

export const imageUploadSchema = z.instanceof(File)
  .refine((file) => file.size <= MAX_IMAGE_SIZE, 'La imagen es demasiado grande (max. 5 MB)')
  .refine((file) => ALLOWED_IMAGE_TYPES.has(file.type), 'Tipo de imagen no permitido');
