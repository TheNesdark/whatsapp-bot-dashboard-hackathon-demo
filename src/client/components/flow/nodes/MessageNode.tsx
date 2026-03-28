import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { MessageSquare } from 'lucide-react';
import type { MessageNodeData } from '@shared/flow';
import type { FlowNodeProps } from '@/types';

export function MessageNode({ data, selected }: FlowNodeProps<MessageNodeData>) {
  return (
    <div className={`flow-node flow-node--message${selected ? ' flow-node--selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="flow-node__header">
        <MessageSquare size={12} />
        <span>Mensaje</span>
      </div>
      <div className="flow-node__body">
        <p className="flow-node__preview">{data.message || <em>Sin mensaje</em>}</p>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
