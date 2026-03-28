import { Request, Response } from 'express';
import { MAX_WHATSAPP_TEXT_LENGTH } from '@server/constants/messages';
import { stmts } from '@server/db/db';
import { replyImageBodySchema, replyMessageSchema, validateImageFile } from '@server/schemas/messages';
import { sendWhatsAppImage, sendWhatsAppMessage } from '@server/services/whatsapp/index';
import { ADMIN_MESSAGES } from '@server/services/whatsapp/messages';
import { resolveInstanceId } from '@server/services/whatsapp/instanceResolver';
import { broadcast } from '@server/services/wsServer';
import { getStoredContactId } from '@server/utils/demoPrivacy';
import { requireConnected } from './whatsapp.controller';

export function getMessagesController(req: Request, res: Response): void {
  const instanceId = req.query.instanceId ? Number(req.query.instanceId) : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : 50;
  const offset = req.query.offset ? Number(req.query.offset) : 0;
  const mode = req.query.mode as string; // 'threads' or 'history'
  const contact = req.query.contact as string;

  if (mode === 'threads') {
    // Return only the latest message for each contact
    const data = stmts.selectLatestMessagesPerContact.all();
    res.json(data);
    return;
  }

  if (contact) {
    // Return paginated history for a specific contact
    const data = stmts.selectMessagesByContact.all(contact, contact, limit, offset);
    res.json(data);
    return;
  }

  const data = instanceId 
    ? stmts.selectMessagesByInstance.all(instanceId, limit, offset) 
    : stmts.selectAllMessages.all(limit, offset);
  res.json(data);
}

export async function replyMessageController(req: Request, res: Response): Promise<void> {
  const parsed = replyMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: ADMIN_MESSAGES.PHONE_MESSAGE_REQUIRED });
    return;
  }

  const { phone, message, instanceId: requestedInstanceId } = parsed.data;
  if (message.length > MAX_WHATSAPP_TEXT_LENGTH) {
    res.status(400).json({ error: ADMIN_MESSAGES.MESSAGE_TOO_LONG(MAX_WHATSAPP_TEXT_LENGTH) });
    return;
  }

  const instanceId = resolveInstanceId(requestedInstanceId);
  if (!instanceId) {
    res.status(409).json({ error: 'No hay instancia activa para enviar el mensaje' });
    return;
  }

  if (!(await requireConnected(res, instanceId))) return;

  try {
    await sendWhatsAppMessage(phone, message, instanceId);
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    stmts.insertMessage.run(`Bot -> ${getStoredContactId(phone)}`, message, null, instanceId, now);
    broadcast('messages:new', { instanceId });
    res.json({ success: true });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : String(error);
    console.error('[messages] Error enviando:', messageText);
    res.status(500).json({ error: `Error al enviar: ${messageText}` });
  }
}

export async function replyImageController(req: Request, res: Response): Promise<void> {
  const parsed = replyImageBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Se requiere telefono e imagen' });
    return;
  }

  const { phone, caption, instanceId: requestedInstanceId } = parsed.data;
  const file = (req as Request & { file?: { buffer: Buffer; mimetype: string; originalname: string; size: number } }).file;
  const fileError = validateImageFile(file);
  if (fileError) {
    res.status(400).json({ error: fileError });
    return;
  }

  const instanceId = resolveInstanceId(requestedInstanceId);
  if (!instanceId) {
    res.status(409).json({ error: 'No hay instancia activa para enviar el mensaje' });
    return;
  }

  if (!(await requireConnected(res, instanceId))) return;

  try {
    await sendWhatsAppImage(
      phone,
      { buffer: file.buffer, mimeType: file.mimetype, filename: file.originalname },
      instanceId,
      caption || undefined,
    );
    const logText = caption ? `[imagen] ${caption}` : '[imagen]';
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    stmts.insertMessage.run(`Bot -> ${getStoredContactId(phone)}`, logText, null, instanceId, now);
    broadcast('messages:new', { instanceId });
    res.json({ success: true });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : String(error);
    console.error('[messages] Error enviando imagen:', messageText);
    res.status(500).json({ error: `Error al enviar imagen: ${messageText}` });
  }
}
