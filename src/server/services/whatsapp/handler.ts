import { stmts } from '@server/db/db';
import type { ParsedWebhookMessage } from '@server/types/whatsapp';
import { instanceManager } from './instanceManager';
import { DEFAULT_INSTANCE_ID, normalizePhoneForStorage } from './state';
import { resolveInstanceId } from './instanceResolver';
import { reply } from './sender';
import { broadcast, onServerEvent } from '@server/services/wsServer';
import { getSettings, getHorarioConfig, isWithinSchedule } from './config';
import { COMMAND_MESSAGES, ERROR_MESSAGES } from './messages';
import { FlowEngine } from './flows/FlowEngine';
import { getStoredContactId } from '@server/utils/demoPrivacy';
import type { FlowDefinition } from '@shared/flow';

// ── Caché LRU para evitar procesar el mismo mensaje dos veces ─────────────────

const MAX_CACHE_SIZE = 20_000;

class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  constructor(maxSize: number) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) this.cache.delete(key);
    else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}

const processedMessages = new LRUCache<string, true>(MAX_CACHE_SIZE);
const EXIT_COMMANDS = new Set(['salir', 'exit', 'quit']);

function isDuplicate(instanceId: number, from: string, msgId?: string): boolean {
  if (!msgId) return false;
  const key = `${instanceId}:${from}:${msgId}`;
  if (processedMessages.has(key)) return true;
  const existing = stmts.selectMessageByLidAndInstance.get(msgId, instanceId) as { id: number } | undefined;
  if (existing) {
    processedMessages.set(key, true);
    return true;
  }
  processedMessages.set(key, true);
  return false;
}

// ── Instancia del FlowEngine ──────────────────────────────────────────────────

export const flowEngine = new FlowEngine();

// Hot-reload cuando el operador guarda un nuevo flujo
onServerEvent('flow:changed', (data) => {
  try {
    flowEngine.reload(data as FlowDefinition);
    console.log('[FlowEngine] Flujo recargado en caliente');
  } catch (err) {
    console.error('[FlowEngine] Error recargando flujo:', err);
  }
});

// ── Entry point ───────────────────────────────────────────────────────────────

export async function handleIncomingWebhookMessages(
  msgs: ParsedWebhookMessage[],
  fallbackInstanceId: number = DEFAULT_INSTANCE_ID,
): Promise<void> {
  for (const msg of msgs) {
    if (!msg.from || msg.from.endsWith('@g.us')) continue;

    let instanceId: number | null = null;
    if (msg.phoneNumberId) {
      const inst = instanceManager.findByPhoneNumberId(msg.phoneNumberId);
      if (inst) instanceId = inst.id;
      else {
        const resolved = resolveInstanceId(fallbackInstanceId);
        if (resolved) {
          console.warn(
            `[Webhook] No se encontró instancia con phoneNumberId=${msg.phoneNumberId}, usando fallback #${resolved}`,
          );
          instanceId = resolved;
        }
      }
    } else {
      instanceId = resolveInstanceId(fallbackInstanceId);
    }

    if (!instanceId) {
      console.warn('[Webhook] No hay instancia activa para procesar el mensaje entrante');
      continue;
    }

    if (isDuplicate(instanceId, msg.from, msg.id)) continue;
    await processMessage(msg, instanceId);
  }
}

// ── Procesamiento de un mensaje individual ────────────────────────────────────

async function processMessage(msg: ParsedWebhookMessage, instanceId: number): Promise<void> {
  const { id, from, body, payloadId } = msg;

  const inst = instanceManager.get(instanceId);
  if (!inst) {
    console.error(`[WA#${instanceId}] Instancia no encontrada`);
    return;
  }

  const normalizedFrom = normalizePhoneForStorage(from);
  const contactId = getStoredContactId(normalizedFrom);
  try {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    stmts.insertMessage.run(contactId, body, id ?? null, instanceId, now);
    broadcast('messages:new', { instanceId });
  } catch (e: unknown) {
    console.error(`[WA#${instanceId}] Error guardando mensaje:`, e);
  }

  let helpRequest: { id: number; status: string } | undefined;
  try {
    helpRequest = stmts.selectHelpRequestByPhone.get(contactId) as
      | { id: number; status: string }
      | undefined;
  } catch (err) {
    console.error(`[WA#${instanceId}] Error consultando solicitud de ayuda:`, err);
  }

  if (helpRequest) {
    return;
  }

  const state = inst.userStates.get(contactId);
  const settings = getSettings(instanceId);

  if (EXIT_COMMANDS.has(body.toLowerCase().trim())) {
    instanceManager.clearUserState(instanceId, contactId);
    try {
      await reply(
        contactId,
        instanceId,
        state ? COMMAND_MESSAGES.EXIT_WITH_SESSION : COMMAND_MESSAGES.EXIT_NO_SESSION,
      );
    } catch (err) {
      console.warn(`[WA#${instanceId}] Error enviando mensaje de salida:`, err);
    }
    return;
  }

  const horario = getHorarioConfig(settings);
  if (!isWithinSchedule(horario)) {
    try {
      await reply(contactId, instanceId, horario.mensajeRechazo);
    } catch (err) {
      console.warn(`[WA#${instanceId}] Error enviando mensaje fuera de horario:`, err);
    }
    return;
  }

  try {
    if (!state) {
      await flowEngine.handleNewConversation(contactId, inst, settings, instanceId);
    } else {
      await flowEngine.processMessage(contactId, payloadId ?? body, state, instanceId);
    }
    instanceManager.touchState(instanceId, contactId);
  } catch (err) {
    console.warn(`[WA#${instanceId}] Error en flujo:`, err);
    instanceManager.clearUserState(instanceId, contactId);
    try {
      await reply(contactId, instanceId, ERROR_MESSAGES.UNEXPECTED_ERROR);
    } catch (replyErr) {
      console.warn(`[WA#${instanceId}] Error enviando mensaje de error:`, replyErr);
    }
  }
}
