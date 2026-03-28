import { Request, Response } from 'express';
import { instanceManager } from '@server/services/whatsapp/index';

/**
 * Verifica que la instancia exista.
 * Si no existe, responde con 503 y devuelve false.
 */
export async function requireConnected(res: Response, instanceId = 1): Promise<boolean> {
  const inst = instanceManager.get(instanceId);
  if (inst) return true;

  res.status(503).json({
    error: `La instancia ${instanceId} no existe.`,
  });
  return false;
}
