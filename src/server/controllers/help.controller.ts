import { Request, Response } from 'express';
import { stmts } from '@server/db/db';
import {
  createHelpRequestSchema,
  helpRequestIdParamsSchema,
  helpRequestsQuerySchema,
  resolveHelpRequestSchema,
} from '@server/schemas/help';
import { broadcast } from '@server/services/wsServer';
import { reply } from '@server/services/whatsapp/sender';
import { DEFAULT_INSTANCE_ID, restoreUserState } from '@server/services/whatsapp/state';
import type { HelpRequestRow } from '@server/types/help';
import { getStoredContactId } from '@server/utils/demoPrivacy';

export async function getHelpRequestsController(req: Request, res: Response): Promise<void> {
  const parsed = helpRequestsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Parametros invalidos' });
    return;
  }

  try {
    const includeMuted = parsed.data.includeMuted === '1' || parsed.data.includeMuted === 'true';
    const pending = stmts.selectAllHelpRequests.all('pending') as HelpRequestRow[];
    const muted = includeMuted ? (stmts.selectAllHelpRequests.all('muted') as HelpRequestRow[]) : [];
    res.json(includeMuted ? [...pending, ...muted] : pending);
  } catch (err) {
    console.error('[API] Error obteniendo solicitudes de ayuda:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function createHelpRequestController(req: Request, res: Response): Promise<void> {
  const parsed = createHelpRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos invalidos para la solicitud de ayuda' });
    return;
  }

  const {
    phone_number,
    full_name = null,
    cedula = null,
    instance_id = DEFAULT_INSTANCE_ID,
    silent = false,
  } = parsed.data;

  const normalizedPhone = getStoredContactId(phone_number);

  try {
    const existing = stmts.selectHelpRequestByPhone.get(normalizedPhone) as HelpRequestRow | undefined;
    if (existing) {
      res.json({ id: existing.id, alreadyExists: true });
      return;
    }

    const status = silent ? 'muted' : 'pending';
    const result = stmts.insertHelpRequest.run(
      normalizedPhone,
      full_name,
      cedula,
      instance_id,
      status,
      null,
      null,
    );
    const id = Number(result.lastInsertRowid);

    if (!silent) {
      broadcast('help:request', {
        id,
        phone_number: normalizedPhone,
        full_name,
        cedula,
        instance_id,
        created_at: new Date().toISOString(),
      });
    }

    res.status(201).json({ id });
  } catch (err) {
    console.error('[API] Error creando solicitud de ayuda:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function resolveHelpRequestController(req: Request, res: Response): Promise<void> {
  const parsedParams = helpRequestIdParamsSchema.safeParse(req.params);
  if (!parsedParams.success) {
    res.status(400).json({ error: parsedParams.error.issues[0]?.message ?? 'ID invalido' });
    return;
  }

  const parsedBody = resolveHelpRequestSchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({ error: parsedBody.error.issues[0]?.message ?? 'Datos invalidos' });
    return;
  }

  const { id } = parsedParams.data;
  const { message } = parsedBody.data;

  try {
    const helpRequest = stmts.selectHelpRequestById.get(id) as HelpRequestRow | undefined;
    if (!helpRequest) {
      res.status(404).json({ error: 'Solicitud no encontrada' });
      return;
    }

    if (message) {
      await reply(helpRequest.phone_number, helpRequest.instance_id, message);
    }

    if (helpRequest.previous_step && helpRequest.previous_data) {
      restoreUserState(
        helpRequest.phone_number,
        helpRequest.previous_step,
        helpRequest.previous_data,
        helpRequest.instance_id,
      );
    }

    stmts.updateHelpRequestStatus.run('resolved', id);
    broadcast('help:resolved', { id });
    res.json({ success: true });
  } catch (err) {
    console.error('[API] Error resolviendo solicitud de ayuda:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function deleteHelpRequestController(req: Request, res: Response): Promise<void> {
  const parsed = helpRequestIdParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'ID invalido' });
    return;
  }

  const { id } = parsed.data;

  try {
    stmts.deleteHelpRequest.run(id);
    broadcast('help:resolved', { id });
    res.json({ success: true });
  } catch (err) {
    console.error('[API] Error eliminando solicitud de ayuda:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
