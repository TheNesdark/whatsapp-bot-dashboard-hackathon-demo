import { Request, Response } from 'express';
import { stmts } from '@server/db/db';
import { createOperatorSchema, operatorIdParamsSchema } from '@server/schemas/operators';
import { broadcast } from '@server/services/wsServer';
import type { OperatorRow } from '@server/types/operator';

export function getOperatorsController(_req: Request, res: Response): void {
  res.json(stmts.selectAllOperators.all() as OperatorRow[]);
}

export function createOperatorController(req: Request, res: Response): void {
  const parsed = createOperatorSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos invalidos para el operador' });
    return;
  }

  const { name } = parsed.data;

  try {
    const info = stmts.insertOperator.run(name) as { lastInsertRowid: number };
    broadcast('operators:changed', { action: 'created', id: info.lastInsertRowid, name });
    res.status(201).json({ id: info.lastInsertRowid, name });
  } catch (err: unknown) {
    const isDuplicate = err instanceof Error && err.message.includes('UNIQUE');
    res.status(isDuplicate ? 409 : 500).json({
      error: isDuplicate ? 'Ya existe un operador con ese nombre' : 'Error al crear el operador',
    });
  }
}

export function deleteOperatorController(req: Request, res: Response): void {
  const parsed = operatorIdParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'ID invalido' });
    return;
  }

  const { id } = parsed.data;
  stmts.deleteOperator.run(id);
  broadcast('operators:changed', { action: 'deleted', id });
  res.json({ success: true });
}
