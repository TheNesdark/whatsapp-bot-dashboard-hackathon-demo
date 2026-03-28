import { z } from 'zod';
import { VALID_FLOW_NODE_TYPES } from '@server/constants/flow';

const flowNodeSchema = z.object({
  id: z.string().trim().min(1, 'Cada nodo debe tener "id"'),
  type: z.string().refine(
    (value): value is string => VALID_FLOW_NODE_TYPES.has(value as never),
    { message: `Tipo de nodo inválido. Tipos permitidos: ${Array.from(VALID_FLOW_NODE_TYPES).join(', ')}` },
  ),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
}).passthrough();

const flowEdgeSchema = z.object({
  id: z.string().trim().min(1, 'Cada arista debe tener "id"'),
  source: z.string().trim().min(1, 'Cada arista debe tener "source"'),
  target: z.string().trim().min(1, 'Cada arista debe tener "target"'),
}).passthrough();

export const flowDefinitionEnvelopeSchema = z.object({
  nodes: z.array(flowNodeSchema),
  edges: z.array(flowEdgeSchema),
});
