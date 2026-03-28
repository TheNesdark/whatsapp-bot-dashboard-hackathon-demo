import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Headphones } from 'lucide-react';
import type { OperatorNodeData } from '@shared/flow';
import type { FlowNodeProps } from '@/types';

export function OperatorNode({ data, selected }: FlowNodeProps<OperatorNodeData>) {
  return (
    <div className={`flow-node flow-node--operator${selected ? ' flow-node--selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="flow-node__header">
        <Headphones size={12} />
        <span>Operador</span>
      </div>
      <div className="flow-node__body">
        <p className="flow-node__preview">{data.message || <em>Sin mensaje</em>}</p>
      </div>
    </div>
  );
}
