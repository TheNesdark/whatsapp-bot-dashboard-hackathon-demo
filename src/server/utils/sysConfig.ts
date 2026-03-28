/**
 * sysConfig.ts — Configuración de sistema para la demo.
 * Las credenciales de WhatsApp se leen desde variables de entorno.
 * Los valores no sensibles siguen pudiendo usar la BD.
 */
import { stmts } from '@server/db/db';

function getSetting(key: string, fallback = ''): string {
  const row = stmts.selectSettingByKey.get(key) as { value: string } | undefined;
  return row?.value?.trim() || fallback;
}

/** Token para la verificación del webhook de Meta */
export function getWabaVerifyToken(): string {
  return (process.env.WABA_VERIFY_TOKEN ?? 'verify').trim();
}

/** URL pública de la aplicación */
export function getAppUrl(): string {
  const port = process.env.PORT ?? '3002';
  return (process.env.APP_URL ?? `http://localhost:${port}`).trim();
}

/** Zona horaria del servidor */
export function getTimezone(): string {
  return getSetting('timezone', process.env.TZ ?? 'America/Bogota');
}

/** Token de acceso global para WhatsApp Business API */
export function getWabaAccessToken(): string {
  return (process.env.WHATSAPP_ACCESS_TOKEN ?? process.env.WABA_ACCESS_TOKEN ?? '').trim();
}

/**
 * Phone Number ID global (legacy).
 * La app usa phoneNumberId por instancia; este valor se mantiene por compatibilidad.
 */
export function getWabaPhoneNumberId(): string {
  return (process.env.WABA_PHONE_NUMBER_ID ?? '').trim();
}
