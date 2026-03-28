import { instanceManager } from './instanceManager';
import type { WabaConfig } from './businessApi';
import { sendTextMessage, sendImageMessage, sendButtonMessage, sendListMessage } from './businessApi';
import { stmts } from '@server/db/db';
import { broadcast } from '@server/services/wsServer';
import { getWabaAccessToken } from '@server/utils/sysConfig';
import { getStoredContactId, resolveDeliveryTarget } from '@server/utils/demoPrivacy';
import type { ButtonOption, ListOption, ReplyMessage } from '@server/types';

/** Obtiene la configuración WABA de una instancia (token global + número por instancia) */
function getConfigForInstance(instanceId: number): WabaConfig | null {
  const inst = instanceManager.get(instanceId);
  if (!inst) {
    console.warn(`[WA] Instancia ${instanceId} no encontrada`);
    return null;
  }

  const accessToken = getWabaAccessToken();
  if (!accessToken) {
    console.warn(`[WA] Token de WhatsApp no configurado`);
    return null;
  }
  if (!inst.phoneNumberId) {
    console.warn(`[WA] Instancia ${instanceId}: falta phoneNumberId`);
    return null;
  }
  return { accessToken, phoneNumberId: inst.phoneNumberId };
}

/** Envía un mensaje de texto via WhatsApp Business API */
export async function sendWhatsAppMessage(to: string, text: string, instanceId = 1): Promise<void> {
  const config = getConfigForInstance(instanceId);
  if (!config) return;
  await sendTextMessage(config, resolveDeliveryTarget(to), text);
}

/** Envía una imagen via WhatsApp Business API */
export async function sendWhatsAppImage(
  to: string,
  image: { url: string } | { id: string } | { buffer: Buffer; mimeType?: string; filename?: string },
  instanceId = 1,
  caption?: string,
): Promise<void> {
  const config = getConfigForInstance(instanceId);
  if (!config) return;
  await sendImageMessage(config, resolveDeliveryTarget(to), image, caption);
}

/** Envía un mensaje de botones (interactive) vía WhatsApp Business API */
export async function sendWhatsAppButtons(
  to: string,
  text: string,
  buttons: Array<{ id: string; title: string }>,
  instanceId = 1,
): Promise<void> {
  const config = getConfigForInstance(instanceId);
  if (!config) return;
  await sendButtonMessage(config, resolveDeliveryTarget(to), text, buttons);
}

/** Envía un mensaje de lista (interactive list) vía WhatsApp Business API */
export async function sendWhatsAppList(
  to: string,
  text: string,
  buttonText: string,
  sections: Array<{ title: string; rows: ListOption[] }>,
  instanceId = 1,
): Promise<void> {
  const config = getConfigForInstance(instanceId);
  if (!config) return;
  await sendListMessage(config, resolveDeliveryTarget(to), text, buttonText, sections);
}

/**
 * Responde a un usuario y guarda el mensaje saliente en la BD.
 * @param typingMs Espera N ms antes de enviar (simula "escribiendo…")
 */
export async function reply(
  phone: string,
  instanceId: number,
  message: ReplyMessage,
  typingMs?: number,
): Promise<void> {
  if (typingMs && typingMs > 0) await new Promise(r => setTimeout(r, typingMs));

  const config = getConfigForInstance(instanceId);
  if (!config) return;

  const to = resolveDeliveryTarget(phone);
  const contactId = getStoredContactId(phone);

  try {
    if (typeof message === 'string') {
      await sendTextMessage(config, to, message);
    } else if ('buttons' in message) {
      await sendButtonMessage(config, to, message.text, message.buttons);
    } else {
      await sendListMessage(config, to, message.text, message.buttonText, message.sections);
    }

    // Solo guardar en BD si el envío fue exitoso
    try {
      let logText = '';
      if (typeof message === 'string') {
        logText = message;
      } else if ('buttons' in message) {
        logText = `${message.text} [buttons:${Array.isArray((message as any).buttons) ? (message as any).buttons.length : 0}]`;
      } else {
        logText = `${message.text} [list:${message.sections.length} sections]`;
      }
      const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
      stmts.insertMessage.run(`Bot -> ${contactId}`, logText, null, instanceId, now);
      broadcast('messages:new', { instanceId });
    } catch (e: unknown) {
      console.error(`[WA#${instanceId}] Error guardando mensaje del bot en BD:`, e);
      // No lanzar error - el mensaje ya se envió, solo falló el registro
    }
  } catch (err) {
    console.error(`[WA#${instanceId}] Error enviando mensaje a ${to}:`, err);
    throw err; // Re-lanzar para que el handler pueda manejarlo
  }
}
