import { Request, Response } from 'express';
import { INSTANCE_PHONE_EXISTS_ERROR, MAX_INSTANCES } from '@server/constants/instances';
import { stmts } from '@server/db/db';
import { createInstanceSchema, instanceIdParamsSchema } from '@server/schemas/instances';
import { instanceManager } from '@server/services/whatsapp/instanceManager';
import { broadcast } from '@server/services/wsServer';
import type { InstanceRow } from '@server/types/index';

export function listInstancesController(_req: Request, res: Response): void {
  const rows = stmts.selectAllInstances.all() as InstanceRow[];
  res.json(rows.map((row) => ({
    id: row.id,
    name: row.name,
    phoneNumberId: row.phone_number_id ?? null,
    apiUrl: row.api_url ?? null,
    isActive: !!row.is_active,
    createdAt: row.created_at,
  })));
}

export async function createInstanceController(req: Request, res: Response): Promise<void> {
  const parsed = createInstanceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos invalidos para la instancia' });
    return;
  }

  const { name } = parsed.data;
  const phoneNumberId = parsed.data.phoneNumberId?.trim() ? parsed.data.phoneNumberId.trim() : null;
  const apiUrl = parsed.data.apiUrl?.trim() ? parsed.data.apiUrl.trim() : null;

  if ((stmts.selectAllInstances.all() as InstanceRow[]).length >= MAX_INSTANCES) {
    res.status(400).json({ error: `Limite maximo de ${MAX_INSTANCES} instancias alcanzado` });
    return;
  }

  if (phoneNumberId) {
    const existingByPhone = stmts.selectInstanceByPhoneId.get(phoneNumberId) as InstanceRow | undefined;
    if (existingByPhone) {
      res.status(409).json({ error: INSTANCE_PHONE_EXISTS_ERROR });
      return;
    }
  }

  try {
    const info = stmts.insertInstance.run(name, phoneNumberId, apiUrl);
    const newId = Number(info.lastInsertRowid);
    instanceManager.register(newId, name, phoneNumberId);
    broadcast('instances:created', { id: newId, name, phoneNumberId, apiUrl });
    res.status(201).json({ id: newId, name, phoneNumberId, apiUrl });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('UNIQUE constraint failed')) {
      res.status(409).json({ error: INSTANCE_PHONE_EXISTS_ERROR });
      return;
    }

    console.error('[instances] Error creando instancia:', err);
    res.status(500).json({ error: 'Error al crear la instancia' });
  }
}

export function deleteInstanceController(req: Request, res: Response): void {
  const parsed = instanceIdParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'ID invalido' });
    return;
  }

  const { id } = parsed.data;
  if (!stmts.selectInstanceById.get(id)) {
    res.status(404).json({ error: 'Instancia no encontrada' });
    return;
  }

  instanceManager.unregister(id);
  stmts.deleteInstance.run(id);
  broadcast('instances:deleted', { id });
  res.json({ success: true });
}
