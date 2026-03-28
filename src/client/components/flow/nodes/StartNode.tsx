import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Play } from 'lucide-react';

export function StartNode() {
  return (
    <div className="flow-node flow-node--start">
      <div className="flow-node__header">
        <Play size={12} />
        <span>Inicio</span>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
