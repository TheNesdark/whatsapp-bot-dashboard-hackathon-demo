/**
 * formatters.ts — Utilidades para el flujo conversacional del bot.
 */

/** Construye un mensaje de menú numerado listo para enviar por WhatsApp */
export function buildMenu(title: string, options: string[]): string {
  const items = options.map((o, i) => `${i + 1}️⃣ *${o}*`);
  return [title, '', ...items, '', 'Responde con el *número* de tu opción.'].join('\n');
}

/** Resuelve la selección de un menú numerado (1-based). Devuelve null si es inválida */
export function resolveMenuSelection(body: string, options: string[]): string | null {
  const idx = parseInt(body.trim(), 10) - 1;
  return idx >= 0 && idx < options.length ? options[idx] : null;
}

/**
 * Crea un objeto listo para enviarse como mensaje con botones interactivos.
 * WhatsApp Business Cloud API permite hasta 3 botones de tipo "reply".
 */
export function buildButtonMenu(
  title: string,
  options: string[],
): { text: string; buttons: Array<{ id: string; title: string }> } {
  const buttons = options.slice(0, 3).map((opt, i) => ({ id: String(i + 1), title: opt }));
  return { text: title, buttons };
}
