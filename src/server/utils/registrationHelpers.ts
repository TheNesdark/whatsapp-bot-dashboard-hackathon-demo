/**
 * Helpers compartidos para controladores de registrations.
 */
import type { Request, Response } from 'express';
import { stmts } from '@server/db/db';
import { parsePositiveInt, isValidPhone } from '@server/utils/validators';
import type { RegistrationRow } from '@server/types/registration';

/** Valida phone e id; envía 400 si no son válidos y devuelve false */
export function validatePhoneAndId(
  phone: string,
  id: number | null,
  res: Response,
): id is number {
  if (!phone || !id) {
    res.status(400).json({ error: 'El teléfono y el ID son obligatorios' });
    return false;
  }
  if (!isValidPhone(phone)) {
    res.status(400).json({ error: 'Formato de número inválido' });
    return false;
  }
  return true;
}

/** Busca un registro por id; envía 404 si no existe y devuelve null */
export function findRegistrationById(
  id: number,
  res: Response,
): RegistrationRow | null {
  const row = stmts.selectRegistrationById.get(id) as RegistrationRow | undefined;
  if (!row) {
    res.status(404).json({ error: 'Registro no encontrado' });
    return null;
  }
  return row;
}

/** Parsea id desde req.body; devuelve null y envía 400 si es inválido */
export function parseRegistrationId(body: Record<string, unknown>, res: Response): number | null {
  const id = parsePositiveInt(body?.id);
  if (!id) {
    res.status(400).json({ error: 'ID inválido' });
    return null;
  }
  return id;
}

/** Aplica attended_by al registro si viene en el body y aún no tiene */
export function applyAttendedBy(req: Request, registrationId: number): void {
  const attendedBy = String(req.body?.attended_by ?? '').trim();
  if (attendedBy) stmts.setAttendedByIfNull.run(attendedBy, registrationId);
}
