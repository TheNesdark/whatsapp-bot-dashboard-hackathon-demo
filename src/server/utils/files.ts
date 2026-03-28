/**
 * files.ts - Utilidades para validacion de archivos de imagen.
 * Trabaja con buffers en memoria (multer memoryStorage).
 */
import { ALLOWED_IMAGE_MIME_TYPES } from '@server/constants/messages';

export { ALLOWED_IMAGE_MIME_TYPES };

const MAGIC: Array<{ check: (b: Buffer) => boolean }> = [
  { check: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { check: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { check: (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 },
  { check: (b) => b[0] === 0x52 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 },
];

export function validateImageBuffer(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  return MAGIC.some(({ check }) => check(buf));
}
