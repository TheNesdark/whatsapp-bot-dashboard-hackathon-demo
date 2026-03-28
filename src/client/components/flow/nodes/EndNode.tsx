import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { CheckCircle } from 'lucide-react';
import type { EndNodeData } from '@shared/flow';
import type { FlowNodeProps } from '@/types';

export function EndNode({ data, selected }: FlowNodeProps<EndNodeData>) {
  return (
    <div className={`flow-node flow-node--end${selected ? ' flow-node--selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="flow-node__header">
        <CheckCircle size={12} />
        <span>Fin</span>
      </div>
      <div className="flow-node__body">
        <p className="flow-node__preview">{data.message || <em>Sin mensaje final</em>}</p>
      </div>
    </div>
  );
}
