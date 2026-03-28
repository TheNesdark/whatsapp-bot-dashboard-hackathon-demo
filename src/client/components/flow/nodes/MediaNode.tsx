import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Image as ImageIcon } from 'lucide-react';
import type { MediaNodeData } from '@shared/flow';
import type { FlowNodeProps } from '@/types';

export function MediaNode({ data, selected }: FlowNodeProps<MediaNodeData>) {
  return (
    <div className={`flow-node flow-node--message${selected ? ' flow-node--selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="flow-node__header">
        <ImageIcon size={12} />
        <span>Media</span>
      </div>
      <div className="flow-node__body">
        <p className="flow-node__preview">
          {data.caption || data.fallbackMessage || <em>Envio de imagen</em>}
        </p>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
