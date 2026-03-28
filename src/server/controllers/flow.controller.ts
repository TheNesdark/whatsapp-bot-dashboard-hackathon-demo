import type { Request, Response } from 'express';
import { MAX_FLOW_PAYLOAD_BYTES } from '@server/constants/flow';
import { stmts } from '@server/db/db';
import { flowDefinitionEnvelopeSchema } from '@server/schemas/flow';
import { broadcast } from '@server/services/wsServer';
import { generateDefaultFlow } from '@server/services/whatsapp/flows/defaultFlow';
import { validateFlowDefinition } from '@server/utils/validators';
import type { FlowDefinition } from '@shared/flow';

export function getFlowController(_req: Request, res: Response): void {
  try {
    const row = stmts.selectSettingByKey.get('flow_definition') as { value: string } | undefined;
    if (row?.value) {
      try {
        const def = JSON.parse(row.value) as FlowDefinition;
        res.json(def);
        return;
      } catch {
        // corrupted - fall through to default
      }
    }
    res.json(generateDefaultFlow());
  } catch (err) {
    console.error('[flow] Error obteniendo flujo:', err);
    res.status(500).json({ error: 'Error al obtener el flujo' });
  }
}

export function saveFlowController(req: Request, res: Response): void {
  try {
    const raw = JSON.stringify(req.body);
    if (Buffer.byteLength(raw, 'utf8') > MAX_FLOW_PAYLOAD_BYTES) {
      res.status(413).json({ error: 'Payload demasiado grande (max. 500 KB)' });
      return;
    }

    const parsed = flowDefinitionEnvelopeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Definicion de flujo invalida' });
      return;
    }

    const flow = parsed.data as FlowDefinition;
    const errors = validateFlowDefinition(flow);
    if (errors.length > 0) {
      res.status(400).json({ error: errors.join('; ') });
      return;
    }

    stmts.upsertSetting.run('flow_definition', raw);
    broadcast('flow:changed', flow);
    res.json({ success: true });
  } catch (err) {
    console.error('[flow] Error guardando flujo:', err);
    res.status(500).json({ error: 'Error al guardar el flujo' });
  }
}

export function resetFlowController(_req: Request, res: Response): void {
  try {
    const defaultFlow = generateDefaultFlow();
    const raw = JSON.stringify(defaultFlow);
    stmts.upsertSetting.run('flow_definition', raw);
    broadcast('flow:changed', defaultFlow);
    res.json(defaultFlow);
  } catch (err) {
    console.error('[flow] Error restableciendo flujo:', err);
    res.status(500).json({ error: 'Error al restablecer el flujo' });
  }
}
