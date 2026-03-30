import { stmts } from '@server/db/db';
import { instanceManager } from '@server/services/whatsapp/instanceManager';
import { getWabaPhoneNumberId } from '@server/utils/sysConfig';
import type { InstanceRow } from '@server/types/index';

export function bootstrapActiveInstances(): void {
  // Registrar instancia de prueba desde .env
  const pruebaId = Number(process.env.PRUEBA ?? 1);
  const wabaPhoneId = getWabaPhoneNumberId();
  console.log(`[Bootstrap] Registrando instancia 'prueba' #${pruebaId}`);
  instanceManager.register(pruebaId, 'Prueba', wabaPhoneId || null);

  const activeInstances = stmts.selectAllInstances.all() as InstanceRow[];
  for (const row of activeInstances) {
    if (!row.is_active) continue;
    instanceManager.register(row.id, row.name, row.phone_number_id ?? null);
  }
}
