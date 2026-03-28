import { stmts } from '@server/db/db';
import { instanceManager } from '@server/services/whatsapp/instanceManager';
import type { InstanceRow } from '@server/types/index';

export function bootstrapActiveInstances(): void {
  const activeInstances = stmts.selectAllInstances.all() as InstanceRow[];
  for (const row of activeInstances) {
    if (!row.is_active) continue;
    instanceManager.register(row.id, row.name, row.phone_number_id ?? null);
  }
}
