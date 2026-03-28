import { stmts } from '@server/db/db';
import { instanceManager } from './instanceManager';

function firstRegisteredInstanceId(): number | null {
  const ids = instanceManager.getAllIds();
  if (ids.length > 0) return ids[0]!;

  const rows = stmts.selectAllInstances.all() as Array<{ id: number; is_active: number }>;
  const active = rows.find(r => !!r.is_active);
  return active?.id ?? rows[0]?.id ?? null;
}

export function resolveInstanceId(preferred?: number | null): number | null {
  if (preferred && Number.isInteger(preferred) && preferred > 0) {
    if (instanceManager.has(preferred)) return preferred;

    const row = stmts.selectInstanceById.get(preferred) as { id: number; is_active: number } | undefined;
    if (row?.is_active) {
      const full = stmts.selectInstanceById.get(preferred) as { id: number; name: string; phone_number_id: string | null } | undefined;
      if (full) {
        instanceManager.register(full.id, full.name, full.phone_number_id ?? null);
        return full.id;
      }
    }
  }

  return firstRegisteredInstanceId();
}
