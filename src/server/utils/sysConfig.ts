/**
 * sysConfig.ts — Configuración de sistema desde la BD.
 * Usa los prepared statements globales para no crear nuevas queries por llamada.
 * Si la clave no existe en BD, hace fallback a variables de entorno.
 */
import { stmts } from '@server/db/db';

function getSetting(key: string, fallback = ''): string {
  const row = stmts.selectSettingByKey.get(key) as { value: string } | undefined;
  return row?.value?.trim() || fallback;
}

/** Token para la verificación del webhook de Meta */
export function getWabaVerifyToken(): string {
  return getSetting('waba_verify_token', process.env.WABA_VERIFY_TOKEN ?? 'verify');
}

/** URL pública de la aplicación */
export function getAppUrl(): string {
  const port = process.env.PORT ?? '3002';
  return getSetting('app_url', process.env.APP_URL ?? `http://localhost:${port}`);
}

/** Zona horaria del servidor */
export function getTimezone(): string {
  return getSetting('timezone', process.env.TZ ?? 'America/Bogota');
}

/** Token de acceso global para WhatsApp Business API */
export function getWabaAccessToken(): string {
  // Clave canónica en BD: whatsapp_access_token
  // Compatibilidad legacy: waba_access_token
  const value = getSetting('whatsapp_access_token');
  if (value) return value;
  const legacy = getSetting('waba_access_token');
  return legacy || process.env.WHATSAPP_ACCESS_TOKEN || process.env.WABA_ACCESS_TOKEN || '';
}

/**
 * Phone Number ID global (legacy).
 * La app usa phoneNumberId por instancia; este valor se mantiene por compatibilidad.
 */
export function getWabaPhoneNumberId(): string {
  return getSetting('waba_phone_number_id', process.env.WABA_PHONE_NUMBER_ID ?? '');
}
