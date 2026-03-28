import { timingSafeEqual } from 'crypto';

/**
 * Compara secretos en tiempo constante para reducir riesgos de timing attacks.
 */
export function safeCompareSecret(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, 'utf8');
  const bBuf = Buffer.from(b, 'utf8');

  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}
