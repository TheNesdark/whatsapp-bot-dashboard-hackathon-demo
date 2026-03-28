/**
 * state.ts — helpers del estado global y de sesión de usuario.
 */
import { instanceManager } from './instanceManager';
import type { UserState } from '@server/types/whatsapp';

export { instanceManager } from './instanceManager';

export const DEFAULT_INSTANCE_ID = 1;

/** Normaliza número para uso interno (quita espacios y sufijos @c.us, etc.) */
export function normalizePhoneForStorage(phone: string): string {
  return phone.replace(/\s/g, '').replace(/@(c\.us|s\.whatsapp\.net|g\.us)$/i, '');
}

/** Pone al usuario en estado de aprobación dinámicamente buscando el nodo en el flujo */
export function setAwaitingConfirmation(
  phone: string,
  registrationId: number,
  instanceId = DEFAULT_INSTANCE_ID,
): void {
  const cleanPhone = normalizePhoneForStorage(phone);
  const inst = instanceManager.get(instanceId);
  if (!inst) return;

  // Importación diferida para evitar ciclos
  const { flowEngine } = require('./handler');
  const approvalNode = flowEngine.getFirstOperatorApprovalNode?.();
  if (!approvalNode) return;

  const state: UserState = { nodeId: approvalNode.id, variables: {}, registrationId };
  inst.userStates.set(cleanPhone, state);
  instanceManager.touchState(instanceId, cleanPhone);
}

/** Restaura el estado anterior del usuario después de que el operador termina la atención */
export function restoreUserState(
  phone: string,
  previousStep: string,
  previousData: string,
  instanceId = DEFAULT_INSTANCE_ID,
): void {
  const cleanPhone = normalizePhoneForStorage(phone);
  const inst = instanceManager.get(instanceId);
  if (!inst) return;

  let variables: Record<string, string> = {};
  try {
    variables = JSON.parse(previousData) as Record<string, string>;
  } catch {
    variables = {};
  }

  const state: UserState = { nodeId: previousStep, variables };
  inst.userStates.set(cleanPhone, state);
  instanceManager.touchState(instanceId, cleanPhone);
}
