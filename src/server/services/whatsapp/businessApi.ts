/**
 * businessApi.ts — Comunicación con la WhatsApp Business Cloud API de Meta.
 */
import type { ParsedWebhookMessage, WabaConfig } from '@server/types';

export type { ParsedWebhookMessage, WabaConfig };

/**
 * Envía un mensaje de texto via WhatsApp Business API.
 * Usa fetch nativo (disponible en Node 18+ y Bun) en lugar de axios.
 */
export async function sendTextMessage(config: WabaConfig, to: string, text: string): Promise<void> {
  const version = config.apiVersion ?? 'v22.0';
  const url = `https://graph.facebook.com/${version}/${config.phoneNumberId}/messages`;

  // Truncado de seguridad para evitar errores 400 de WhatsApp (límite ~4096)
  const safeText = text.length > 4000 ? text.substring(0, 3997) + '...' : text;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: safeText },
      }),
    });

    if (!res.ok) {
      const detail = await res.json().catch(() => res.statusText);
      console.warn(`[WhatsApp API] Error enviando a ${to}: ${JSON.stringify(detail)}`);
      return;
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('[WhatsApp API]')) {
      console.warn(err.message);
      return;
    }
    console.warn(`[WhatsApp API] Error de red enviando a ${to}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Sube un archivo de medios a la WhatsApp Business API y devuelve el media ID.
 */
export async function uploadMedia(
  config: WabaConfig,
  buffer: Buffer,
  mimeType: string,
  filename: string,
): Promise<string> {
  const version = config.apiVersion ?? 'v22.0';
  const url = `https://graph.facebook.com/${version}/${config.phoneNumberId}/media`;

  try {
    const form = new FormData();
    form.append('messaging_product', 'whatsapp');
    form.append('type', mimeType);
    // Convert Node Buffer into a Uint8Array (backed by an ArrayBuffer) so Blob typing is satisfied
    const uint8 = Uint8Array.from(buffer);
    form.append('file', new Blob([uint8], { type: mimeType }), filename);

    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.accessToken}` },
      body: form,
    });

    if (!res.ok) {
      const detail = await res.json().catch(() => res.statusText);
      console.warn(`[WhatsApp API] Error subiendo media: ${JSON.stringify(detail)}`);
      return null;
    }

    const data = (await res.json()) as { id: string };
    return data.id;
  } catch (err) {
    console.warn(`[WhatsApp API] Error subiendo media: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

/**
 * Envía una imagen via WhatsApp Business API.
 * Soporta envío por URL (link), media ID o buffer (se sube automáticamente).
 */
export async function sendImageMessage(
  config: WabaConfig,
  to: string,
  image: { url: string } | { id: string } | { buffer: Buffer; mimeType?: string; filename?: string },
  caption?: string,
): Promise<void> {
  const version = config.apiVersion ?? 'v22.0';
  const url = `https://graph.facebook.com/${version}/${config.phoneNumberId}/messages`;

  try {
    const imagePayload: Record<string, string> = {};
    if ('buffer' in image) {
      const mediaId = await uploadMedia(
        config,
        image.buffer,
        image.mimeType ?? 'image/jpeg',
        image.filename ?? 'image.jpg',
      );
      if (!mediaId) return;
      imagePayload.id = mediaId;
    } else if ('url' in image) {
      imagePayload.link = image.url;
    } else {
      imagePayload.id = image.id;
    }
    if (caption) {
      imagePayload.caption = caption;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'image',
        image: imagePayload,
      }),
    });

    if (!res.ok) {
      const detail = await res.json().catch(() => res.statusText);
      console.warn(`[WhatsApp API] Error enviando imagen a ${to}: ${JSON.stringify(detail)}`);
      return;
    }
  } catch (err) {
    console.warn(`[WhatsApp API] Error de red enviando imagen a ${to}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Envía un mensaje interactivo con botones de respuesta rápida.
 * ``buttons`` debe ser un array de objetos con `id` y `title`.
 */
export async function sendButtonMessage(
  config: WabaConfig,
  to: string,
  text: string,
  buttons: Array<{ id: string; title: string }>,
): Promise<void> {
  const version = config.apiVersion ?? 'v22.0';
  const url = `https://graph.facebook.com/${version}/${config.phoneNumberId}/messages`;

  try {
    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text },
        action: {
          buttons: buttons.map((b) => ({
            type: 'reply',
            reply: { id: b.id, title: b.title.substring(0, 20) },
          })),
        },
      },
    } as const;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const detail = await res.json().catch(() => res.statusText);
      console.warn(`[WhatsApp API] Error enviando botones a ${to}: ${JSON.stringify(detail)}`);
      return;
    }
  } catch (err) {
    console.warn(`[WhatsApp API] Error de red enviando botones a ${to}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Envía un mensaje de tipo lista (interactive list) según la API oficial de WhatsApp.
 */
export async function sendListMessage(
  config: WabaConfig,
  to: string,
  text: string,
  buttonText: string,
  sections: Array<{
    title: string;
    rows: Array<{ id: string; title: string; description?: string }>;
  }>,
): Promise<void> {
  const version = config.apiVersion ?? 'v22.0';
  const url = `https://graph.facebook.com/${version}/${config.phoneNumberId}/messages`;

  try {
    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'list',
        body: { text },
        action: {
          button: buttonText,
          sections,
        },
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const detail = await res.json().catch(() => res.statusText);
      console.warn(`[WhatsApp API] Error enviando lista a ${to}: ${JSON.stringify(detail)}`);
      return;
    }
  } catch (err) {
    console.warn(`[WhatsApp API] Error de red enviando lista a ${to}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Extrae los mensajes de texto del payload del webhook de Meta.
 * Ignora otros tipos (imagen, audio, botones, etc.).
 *
 * Estructura: entry[] → changes[] → value.messages[] → { from, id, type, text.body }
 * También extrae el phoneNumberId para soporte multi-instancia.
 */
export function parseWebhookPayload(payload: unknown): ParsedWebhookMessage[] {
  const result: ParsedWebhookMessage[] = [];
  const p = payload as Record<string, unknown>;

  if (!Array.isArray(p?.entry)) return result;

  for (const entry of p.entry as Record<string, unknown>[]) {
    for (const change of (entry?.changes ?? []) as Record<string, unknown>[]) {
      const value = change?.value as Record<string, unknown> | undefined;

      // Extraer phoneNumberId de los metadatos (para multi-instancia)
      const metadata = value?.metadata as Record<string, unknown> | undefined;
      const phoneNumberId = metadata?.phone_number_id as string | undefined
        || metadata?.phone_number_id as string | undefined;

      for (const msg of (value?.messages ?? []) as Record<string, unknown>[]) {
        // Texto simple
        if (msg?.type === 'text') {
          const text = msg.text as { body?: string } | undefined;
          if (text?.body) {
            result.push({
              id: msg.id as string | undefined,
              from: msg.from as string,
              body: text.body,
              phoneNumberId,
            });
          }
          continue;
        }

        // Respuesta a botón interactivo (button_reply)
        if (msg?.type === 'interactive') {
          const interactive = msg.interactive as Record<string, unknown> | undefined;
          if (interactive?.type === 'button_reply') {
            const br = interactive.button_reply as { id?: string; title?: string } | undefined;
            if (br?.title || br?.id) {
              result.push({
                id: msg.id as string | undefined,
                from: msg.from as string,
                body: br?.title ?? br?.id ?? '',
                payloadId: br?.id,
                phoneNumberId,
              });
            }
          } else if (interactive?.type === 'list_reply') {
            const lr = interactive.list_reply as { id?: string; title?: string } | undefined;
            if (lr?.title || lr?.id) {
              result.push({
                id: msg.id as string | undefined,
                from: msg.from as string,
                body: lr?.title ?? lr?.id ?? '',
                payloadId: lr?.id,
                phoneNumberId,
              });
            }
          }
        }
      }
    }
  }

  return result;
}
